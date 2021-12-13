module.exports = (context) => {
    const syncService = require('./sync.service')(context);
    const CronJob = require('cron').CronJob;
    const config = context.config;
    const db = context.utils.db;

    console.log('>> [MINNOW POD JOB] started data sync');

    new CronJob(config.sync.pollingInterval, async () => {
        let conn;

        try {
            console.log('[JOB] - SYNC STARTED');

            conn = await db.createConnection(true);

            let syncServiceContext = syncService.createContext(conn);

            await syncServiceContext.syncDrinks();

            conn.commit();

            console.log('[JOB] - SYNC ENDED');
        }
        catch (error) {
            console.log(error);
            conn.rollback();
        }
        finally {
            conn.end();
        }
    }, null, true, 'America/Sao_Paulo');

}