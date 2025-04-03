const { DateTime } = require('luxon');

function scheduleAtMidnight(timezone, taskFunction, client) {
    const now = DateTime.now().setZone(timezone);
    const nextMidnight = now.plus({ days: 1 }).startOf('day');
    const waitDuration = nextMidnight.diff(now).toObject().milliseconds;

    let waitTimeInSeconds = waitDuration / 1000;
    let hours = Math.floor(waitTimeInSeconds / 3600);
    waitTimeInSeconds %= 3600;
    let minutes = Math.floor(waitTimeInSeconds / 60);
    let seconds = Math.round(waitTimeInSeconds % 60);

    console.log(`[${now.toFormat('FFF')}] Scheduling next task for ${nextMidnight.toFormat('FFF')}`);
    console.log(`Wait Duration: ${hours} hours, ${minutes} minutes, and ${seconds} seconds`);

    setTimeout(() => {
        console.log(`[${DateTime.now().setZone(timezone).toFormat('FFF')}] Executing scheduled task.`);
        taskFunction(client);
        scheduleAtMidnight(timezone, taskFunction, client);
    }, waitDuration);
}

module.exports = { scheduleAtMidnight };