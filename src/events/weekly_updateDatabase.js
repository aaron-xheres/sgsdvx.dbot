/*
 * Author: Aaron Tan (aarontan.jr@gmail.com)
 * Modified: 09 Jan 2022
 * 
 * Weekly Database Update
 */

import cron from 'node-cron'

import { updateTrackIdList } from '../handlers/sdvxinHandler.js'
import { TIMEZONE } from '../constants.js'

export default function weeklyUpdateDatabase() {
    // Scheduled Update at every Sunday 00:00
    cron.schedule('0 0 * * SUN', async () => {
        // Update Track Id List and Database
        console.log('[SCHEDULED UPATE] Track Database')
        await updateTrackIdList();
    }, 
    {
        scheduled: true,
        timezone: TIMEZONE.DEV_LOCAL
    })
    .start();
}