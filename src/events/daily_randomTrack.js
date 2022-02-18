/*
 * Author: Aaron Tan (aarontan.jr@gmail.com)
 * Modified: 07 Jan 2022
 * 
 * Daily random song
 */

import { client } from "../client.js";
import cron from 'node-cron'

import { open } from 'sqlite'
import sqlite3 from 'sqlite3'

import { DIR_RESOURCES, SDVXIN, TIMEZONE } from '../constants.js';
import { getRandomTrack } from "../commands/random-track.js";
import { trackPagination } from "../handlers/paginationHandler.js";

const baseURL = process.cwd();
const trackListDbURL = `${baseURL}/${DIR_RESOURCES}/${SDVXIN.RESOURCE_BASEDIR}/${SDVXIN.TRACK_DB_FILE}`

const levels = [16, 17, 18]
const channel = client.channels.cache.get(`${process.env.CHANNEL_PUBLIC_GENERAL}`);



export default function dailyRandomTrack() {

    cron.schedule('0 11 * * *', async () => {

        try{
            // Open Database
            const db = await open({
                filename: trackListDbURL,
                driver: sqlite3.Database
            });

            const track = await getRandomTrack();
            const interaction = await channel.send(`Track of the Day!`)
            trackPagination(interaction, track, 43200000)   

            // Close Database
            db.close()
            
        }
        catch (error) {
            console.log('[DAILY_RANDOM-SONG]', error)
        }

    },
    {
        scheduled: true,
        timezone: TIMEZONE.DEV_LOCAL
    })
    .start();

}