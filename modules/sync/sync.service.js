module.exports = (context) => {

    const drinkService = require('../drink/drink.service')(context);

    const createContext = (connection) => {

        const drinkServiceContext = drinkService.createContext(connection);

        const syncDrinks = async () => {
            let localDrinks = await drinkServiceContext.listLocalDrinks();
            let apiDrinks = await drinkServiceContext.fetchAPIDrinks();
            let existingDrinksIds = [];
            let promises = [];

            for (let i = 0; i < apiDrinks.length; i++) {
                const apiDrink = apiDrinks[i];

                let localDrink = localDrinks.find(localDrink => drinkServiceContext.existingDrink(localDrink, apiDrink));

                if (localDrink) {
                    if (drinkServiceContext.sameDrinkInfo(localDrink, apiDrink)) {
                        existingDrinksIds.push(localDrink.id);
                    } else {
                        await drinkServiceContext.removeDrink(localDrink.id);
                        promises.push(drinkServiceContext.insertDrink(apiDrink));
                    }
                } else {
                    promises.push(drinkServiceContext.insertDrink(apiDrink));
                }
            }

            // update sync dates in bulk
            if (existingDrinksIds.length) {
                promises.push(drinkServiceContext.updateSyncDate(existingDrinksIds));
            }

            // run DB operations in parallel
            if (promises.length) {
                return Promise.all(promises);
            }

            return Promise.resolve(true);
        };

        return {
            syncDrinks
        };
    };

    return {
        createContext
    };

};