/*
 * Author: Aaron Tan (aarontan.jr@gmail.com)
 * Modified: 6 Jan 2022
 * 
 * /find-tracks title? artist? effector?
 */

import { SlashCommandBuilder } from "@discordjs/builders";
import { searchPagination } from '../handlers/paginationHandler.js'


/*
 * =-=-=-=-=-=-=-=-=-=-=
 * Main Command Body
 * =-=-=-=-=-=-=-=-=-=-=
 */
const command = {
    data: new SlashCommandBuilder()
        .setName('find-tracks')
        .setDescription('Find a track with specified parameters. Search can be part-of or full')
        .addStringOption(option => option.setName('title').setDescription('Title to search from'))
        .addStringOption(option => option.setName('artist').setDescription('Artist to search from'))
        .addStringOption(option => option.setName('effector').setDescription('Effector to search from'))
        .addIntegerOption(option => option.setName('version').setDescription('Version of the Track')),
    async execute(interaction) {

        let searchTitle = interaction.options.getString('title')
        let searchArtist = interaction.options.getString('artist')
        let searchEffector = interaction.options.getString('effector')
        let searchVersion = interaction.options.getInteger('version')

        if(!searchTitle && !searchArtist && !searchEffector) {
            interaction.reply('```Please insert at least 1 parameter to start finding track```');
            return false;
        }

        if(!searchTitle) searchTitle = '%';
        if(!searchArtist) searchArtist = '%';
        if(!searchEffector) searchEffector = '%';
        if(!searchVersion) searchVersion = '%';

        const foundTracks = await findTrack(searchTitle, searchArtist, searchEffector, searchVersion);
        searchPagination(interaction, foundTracks);

    },
};


/**
 * Get Track(s) from Database Query
 * @param {String} _title? Title to query from
 * @param {String} _artist? Artist to query from
 * @param {String} _effector? Effector to query from
 */
import { open } from 'sqlite'
import sqlite3 from 'sqlite3'

import { DIR_RESOURCES, SDVXIN } from '../constants.js';
import { Track } from "../classes/track.js";

const baseURL = process.cwd();
const trackListDbURL = `${baseURL}/${DIR_RESOURCES}/${SDVXIN.RESOURCE_BASEDIR}/${SDVXIN.TRACK_DB_FILE}`

async function findTrack(_title, _artist, _effector, _version) {

    // Open Database
    const db = await open ({
        filename: trackListDbURL,
        driver: sqlite3.Database
    });

    let title = _title;
    let artist = _artist;
    let effector = _effector;
    let version = _version;

    // Query specified Track parameters
    let res = await db.all(
        `
        SELECT DISTINCT id FROM tracks 
            WHERE 
                UPPER(title) LIKE UPPER('"%${title}%"')
            AND UPPER(artist) LIKE UPPER('"%${artist}%"')
            AND UPPER(effector) LIKE UPPER('"%${effector}%"')
            AND UPPER(id) LIKE UPPER('"0${version}%"')
            GROUP BY
                title
        `
    );

    // Get all track from each searched ID
    let idArray = [];
    let tracksArrayById = {}

    for(const resId of res) {
        let id = Track.DatabaseJsonToString(resId.id);
        id = id.slice(0, id.length-1)
        idArray.push(id);
    }

    for(const id of idArray) {
        res = await db.all(
            `
            SELECT title, artist FROM tracks
                WHERE
                    id LIKE '"${id}%"'
                ORDER BY
                    level
            `
        );

        for(const resData of res) {
            let title = Track.DatabaseJsonToString(resData.title)
            let artist = Track.DatabaseJsonToString(resData.artist)
            tracksArrayById[id] = {
                title: title,
                artist: artist
            }
        }

    }

    // Close Database
    db.close();

    return tracksArrayById;

}



// Default Command Export
export { command as default }