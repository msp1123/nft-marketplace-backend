var CronJob = require('cron').CronJob;
const CONFIG = require('../configs/global.configs');

// This is a cron job, this will run every time as per the interval we set
var syncJob = new CronJob(`0 */${CONFIG.sync_interval_mins} * * * *`, async function () {
    console.log("Sync job run at:", Date())
}, null, true, 'UTC');