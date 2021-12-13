module.exports = (context) => {

    const drinkService = require('./drink.service')(context);
    const db = context.utils.db;

    const search = async (req, res) => {
        let conn;

        try {
            conn = await db.createConnection();

            const drinkServiceContext = drinkService.createContext(conn);

            req.query.recent = true;

            const result = await drinkServiceContext.listLocalDrinks(req.query);

            res.send({ success: true, data: result });
        }
        catch (error) {
            res.status(500).send({ success: false, error: error.message });
        }
        finally {
            conn.end();
        }
    };
    return {
        search
    };

};