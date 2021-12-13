'use strict';

require('dotenv').config({ path: __dirname + '/.env' });
const chaiHttp = require('chai-http');
const chai = require('chai');
const config = require('../config/config');
const expect = chai.expect;

chai.use(chaiHttp);

let drinkServiceContext;
let conn;

describe('#', function () {

    before(async function () {
        // Service context
        const utils = require('../utils');
        const config = require('../config/config');
        const db = utils.db;
        const context = {
            config,
            utils
        };

        let drinkService = require('../modules/drink/drink.service')(context);

        conn = await db.createConnection();

        drinkServiceContext = drinkService.createContext(conn);
    });

    after(function () {
        conn.end();
    });

    describe('processing rows', function () {
        it('local database should contain at least the same amount of records coming from the external API', async function () {
            this.timeout(5000);

            let apiCount = (await drinkServiceContext.fetchAPIDrinks()).length;
            let localDatabaseCount = (await drinkServiceContext.listLocalDrinks()).length;

            // in case an old cocktail was synced to the local database but it's not returning anymore using the API
            expect(localDatabaseCount).to.be.at.least(apiCount, 'Some cocktails were not imported.');
        });
    });

    describe('matching cocktails', function () {
        it('1) Should find a cocktail', function () {
            let cocktailToSearch = 'Ipamena';

            chai.request(config.apiURL)
                .get('/search.php?s=' + cocktailToSearch)
                .end(async function (err, res) {

                    if (res.body && res.body.drinks.length === 1) {
                        let ingredients = drinkServiceContext.convertDrinkIngredientsToArray(res.body.drinks[0]);
                        let ingredientsParam = [];

                        for (let i = 0; i < ingredients.length; i++) {
                            const ingredient = ingredients[i];

                            ingredientsParam.push(ingredient);

                            let localQuery = await drinkServiceContext.listLocalDrinks({ ingredients: ingredientsParam.join(',') });

                            if (localQuery && localQuery.data) {
                                let cocktail = localQuery.find(item => item.name === cocktailToSearch);

                                expect(cocktail.name).to.equal('Ipamena');
                            }
                        }
                    }
                });
        });

        it('2) Should not find a cocktail with strange ingredient', async function () {
            let localQuery = await drinkServiceContext.listLocalDrinks({ ingredients: 'strange_ingredient' });

            expect(localQuery.length).to.equal(0);
        });

        it('3) Should not find an existing cocktail with old sync date', async function () {
            this.timeout(10000);

            chai.request(config.testURL)
                .get('/drinks?ingredients=Strawberry')
                .end(async function (err, res) {
                    expect(res.body.data.length).to.equal(0);
                });
        });
    });
});