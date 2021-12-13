module.exports = {
    apiURL: 'https://www.thecocktaildb.com/api/json/v1/1',
    testURL: process.env.TEST_URL,
    db: {
        host: process.env.DATABASE_HOST,
        port: process.env.DATABASE_PORT,
        user: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASSWORD,
        name: process.env.DATABASE_NAME
    },
    sync: {
        pollingInterval: process.env.SYNC_POLLING_INTERVAL || '0 5 * * *' // run every 5am
    }
}