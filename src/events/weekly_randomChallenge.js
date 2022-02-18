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

import { CHANNEL, DIR_RESOURCES, SDVXIN, TIMEZONE } from '../constants.js';
import { Track } from "../classes/track.js";

const baseURL = process.cwd();
const trackListDbURL = `${baseURL}/${DIR_RESOURCES}/${SDVXIN.RESOURCE_BASEDIR}/${SDVXIN.TRACK_DB_FILE}`

const levels = [16, 17, 18]
const channel = client.channels.cache.get(`${process.env.CHANNEL_PUBLIC_ANNOUNCE}`);



export default function weeklyRandomChallenge() {

    cron.schedule('0 0 * * SUN', async () => {

        try{
            // Open Database
            const db = await open({
                filename: trackListDbURL,
                driver: sqlite3.Database
            });

            await channel.send(`This week's Challenge!`)
            for(const level of levels) {
                const res = await db.get(
                    `
                    SELECT * FROM tracks
                        WHERE
                            level = '"${level}"'
                        ORDER BY
                            RANDOM()
                        LIMIT
                            1
                    `
                );

                const track = Track.generateTrackFromDatabase(res);
                channel.send({ embeds: [track.generateEmbed()] })            
            }

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