const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

module.exports = (context) => {
    const httpClient = context.utils.httpClient;

    const createContext = (connection) => {

        const fetchAPIDrinks = () => {
            let promises = [];

            // iterate through all alphabet letters (a to z) to retrieve all drinks (API designed this way).
            // it's not considering drink starting with numbers for this test
            for (let i = 97; i <= 122; i++) {
                let params = {
                    query: {
                        firstLetter: String.fromCharCode(i)
                    }
                };

                promises.push(httpClient.invoke('drink', 'list', params).then(result => {
                    let items = [];

                    if (result.data && result.data.drinks) {
                        items = result.data.drinks;
                    }

                    return items;
                }));
            }

            return Promise.all(promises).then(results => {
                let drinks = [];

                results.forEach(result => {
                    drinks = drinks.concat(result);
                });

                return drinks;
            });
        };

        const listLocalDrinks = async (filter = {}) => {
            // drinks
            let query = `SELECT d.id, d.external_id as externalId, d.name, d.instructions, d.updated_at as updatedAt, d.synced_at as syncedAt 
                FROM drink d LEFT JOIN drink_ingredient di ON d.id = di.drink_id
                WHERE 1 = 1 `;
            let params = [];

            if (filter.recent) {
                query += `AND d.synced_at > ? `;
                params.push(moment().add(-4, 'days').toDate());
            }

            if (filter.ingredients && filter.ingredients.length) {
                let items = filter.ingredients.split(',');

                query += `AND di.ingredient IN (?) 
                    GROUP BY d.id, d.external_id, d.name, d.instructions, d.updated_at, d.synced_at
                    HAVING COUNT(di.ingredient) = ? `;
                params.push(items);
                params.push(items.length);
            }

            let drinks = await connection.query(query, params);

            // drink ingredients associations
            query = `SELECT di.drink_id, di.ingredient FROM drink_ingredient di`;
            let drinksIngredients = await connection.query(query);

            drinks.forEach(drink => {
                drink.ingredients = drinksIngredients
                    .filter(drinksIngredient => drinksIngredient.drink_id === drink.id)
                    .map(drinksIngredient => drinksIngredient.ingredient);
            });

            return drinks;
        };

        const convertDrinkIngredientsToArray = (apiDrink) => {
            let ingredients = [];
            let ingredientFieldLimit = 15; // fixed in API

            if (!apiDrink) { return []; }

            for (let i = 1; i <= ingredientFieldLimit; i++) {
                let propertyValue = apiDrink[`strIngredient${i}`];

                if (propertyValue && ingredients.indexOf(propertyValue) < 0) {
                    ingredients.push(propertyValue);
                }
            }

            return ingredients;
        };

        const existingDrink = (localDrink, apiDrink) => {
            return (localDrink && apiDrink
                && localDrink.externalId === apiDrink.idDrink);
        };

        const sameDrinkInfo = (localDrink, apiDrink) => {
            return (localDrink && apiDrink && localDrink.updatedAt && apiDrink.dateModified
                && localDrink.externalId === apiDrink.idDrink
                && moment.utc(localDrink.updatedAt).toISOString() === moment.utc(apiDrink.dateModified).toISOString());
        };

        const insertDrink = (apiDrink) => {
            let newId = uuidv4();

            // insert drink
            let query = `INSERT INTO drink (id, external_id, name, instructions, category, updated_at, synced_at) VALUES (?)`;

            // ATTENTION: HAD TO REMOVE CHARACTERS OUTSIDE UTF8 ENCODING TO AVOID SQL ERRORS
            apiDrink.strInstructions = apiDrink.strInstructions ? apiDrink.strInstructions.replace(/[\u0800-\uFFFF]/g, '') : null;
            apiDrink.dateModified = apiDrink.dateModified ? moment.utc(apiDrink.dateModified).toDate() : null;
            let params = [newId, apiDrink.idDrink, apiDrink.strDrink, apiDrink.strInstructions, apiDrink.strCategory, apiDrink.dateModified, new Date()];

            return connection.query(query, [params])
                .then(() => {
                    // after drink insert completion, insert ingredients associations
                    let ingredients = convertDrinkIngredientsToArray(apiDrink);
                    let parallelPromises = [];
                    query = `INSERT INTO drink_ingredient (drink_id, ingredient) VALUES ?`;
                    let insertParams = [];

                    for (let i = 0; i < ingredients.length; i++) {
                        insertParams.push([newId, ingredients[i]]);
                    }

                    parallelPromises.push(connection.query(query, [insertParams]));

                    return Promise.all(parallelPromises);
                });
        };

        const removeDrink = async (drinkId) => {
            let query = `DELETE FROM drink_ingredient WHERE drink_id = ?`;
            let params = [drinkId];

            await connection.query(query, params);

            query = `DELETE FROM drink WHERE id = ?`;
            params = [drinkId];

            return connection.query(query, params);
        };

        const updateSyncDate = async (drinkIds) => {
            let query = `UPDATE drink SET synced_at = ? WHERE id IN (?)`;
            let params = [new Date(), drinkIds];

            return connection.query(query, params);
        };

        return {
            fetchAPIDrinks,
            listLocalDrinks,
            convertDrinkIngredientsToArray,
            existingDrink,
            sameDrinkInfo,
            insertDrink,
            removeDrink,
            updateSyncDate
        };
    };

    return {
        createContext
    };

};