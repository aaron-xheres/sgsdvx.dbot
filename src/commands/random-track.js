/*
 * Author: Aaron Tan (aarontan.jr@gmail.com)
 * 
 * /random-track (level)
 */

import { SlashCommandBuilder } from '@discordjs/builders'
import { trackPagination } from '../handlers/paginationHandler.js';


/*
 * =-=-=-=-=-=-=-=-=-=-=
 * Main Command Body
 * =-=-=-=-=-=-=-=-=-=-=
 */
const command = {
    data: new SlashCommandBuilder()
        .setName('random-track')
        .setDescription('Get a random track')
        .addIntegerOption(option => option.setName('level').setDescription('Level to random from')),
    async execute(interaction) {

        const level = interaction.options.getInteger('level')

        const randomTrack = await getRandomTrack(level);

        if(level) {
            interaction.reply({ embeds: [randomTrack.generateEmbed()] })
        } 
        else {
            trackPagination(interaction, randomTrack);
        }

    },
};



/**
 * Get a random Track from Track List 
 * @returns {Array<Track>} Array of Tracks (all difficulties)
 */
import { open } from 'sqlite'
import sqlite3 from 'sqlite3'

import { DIR_RESOURCES, SDVXIN } from '../constants.js';
import { Track } from '../classes/track.js';

const baseURL = process.cwd();
const trackListDbURL = `${baseURL}/${DIR_RESOURCES}/${SDVXIN.RESOURCE_BASEDIR}/${SDVXIN.TRACK_DB_FILE}`

export async function getRandomTrack(_level) {

    try{
        // Open Database
        const db = await open({
            filename: trackListDbURL,
            driver: sqlite3.Database
        });

        let level;
        if(_level >= 1 && _level < 10) level = `0${_level}`;
        else if (_level >= 11 && _level <= 20) level = _level
        else level = '%'

        // Get Random Track ID
        let res = await db.get(
            `
            SELECT * FROM tracks 
                WHERE
                    level LIKE '"${level}"'
                ORDER BY 
                    RANDOM() 
                LIMIT 
                    1
            `
        );

        if(level !== '%') {
            console.log(`[TRACK] ID: ${res.id.slice(1, res.id.length-2)}`);
            return Track.generateTrackFromDatabase(res)
        }

        // Get all tracks from selected random ID
        const id = res.id.slice(1, res.id.length-2);
        res = await db.all(
            `
            SELECT * FROM tracks
                WHERE 
                    id LIKE '"${id}%"'
                ORDER BY
                    level
            `
        );

        // Create embed for all the tracks
        let tracks = [];
        for(const track of res) {
            tracks.push(Track.generateTrackFromDatabase(track));
        }

        // Close Database
        db.close();

        return tracks;
    }
    catch (error) {
        console.error('[SDVX.IN]', error);
    }
}



// Default Command Export
export { command as default }