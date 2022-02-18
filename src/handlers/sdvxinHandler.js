/*
 * Author: Aaron Tan (aarontan.jr@gmail.com)
 * Modified: 14 Feb 2022
 * 
 * Handlers for sdvx.in data extraction
 * Uses JSON for unstructured sdvx.in ID storage
 * Uses SQLite3 for Database storage
 */

import { DIR_RESOURCES, SDVXIN } from "../constants.js";
import { Track } from "../classes/track.js";
import { readFile, writeFile } from "./fileHandler.js";

import sqlite3 from 'sqlite3'
import { open } from 'sqlite'

import fetch from 'node-fetch'

const baseURL = process.cwd();
const resourceDir = `${baseURL}/${DIR_RESOURCES}/${SDVXIN.RESOURCE_BASEDIR}`
const trackIdListURL = `${baseURL}/${DIR_RESOURCES}/${SDVXIN.RESOURCE_BASEDIR}/${SDVXIN.TRACK_ID_LIST_FILE}`
const updateIdListURL = `${baseURL}/${DIR_RESOURCES}/${SDVXIN.RESOURCE_BASEDIR}/${SDVXIN.UPDATE_ID_LIST_FILE}`
const trackListDbURL = `${baseURL}/${DIR_RESOURCES}/${SDVXIN.RESOURCE_BASEDIR}/${SDVXIN.TRACK_DB_FILE}`

/**
 * =-=-=-=-=-=-=-=-=-=-=
 * Generate Track Id List 
 * =-=-=-=-=-=-=-=-=-=-=
 */
export async function generateTrackIdList() {
    const levels = [...Array(SDVXIN.MAX_LEVEL + SDVXIN.MAX_LEVEL).keys()].splice(1, SDVXIN.MAX_LEVEL);
    const sortLevels = new Map();

    let trackList = {};

    // Iterate through levels
    for(const level of levels) {

        let tracks = []
        let strLevel, fetchData, strData, tracksArr;

        if(level < 10) strLevel = `0${level}`
        else strLevel = level.toString();

        try { fetchData = await fetch(`https://sdvx.in/sort/sort_${strLevel}.htm`) }
        catch (error) { console.error('[SDVX.IN]', error) }

        strData = await fetchData.text();
        tracksArr = strData.split('\n').filter(str => {
            return str.includes('SORT0');
        });

        // Iterate through tracksArr
        for(const track of tracksArr) {
            const tracksId = track.slice(55, 61)
            tracks.push(tracksId)
        }

        trackList[`level${strLevel}`] = tracks;
    }

    console.info('[SDVX.IN] Track List Generated!');

    return trackList;
}



/**
 * =-=-=-=-=-=-=-=-=-=-=
 * Update Track Id List
 * =-=-=-=-=-=-=-=-=-=-=
 */
export async function updateTrackIdList() {

    let readData, trackList, updateList

    try {
        // Read trackIdList.json
        readData = await readFile(trackIdListURL);
        readData = await JSON.parse(readData);

        // Generate new Track List from SDVX.in
        trackList = await generateTrackIdList();
        console.log('Database Found')
    }
    catch {
        // Generate new trackIdList.json
        readData = await generateTrackIdList();

        // Create Database
        console.log('Database not found, creating new database')
        createTrackDB();
    }

    if(trackList) {
        // trackList is generated
        updateList = {}

        for(const [_level, _tracks] of Object.entries(trackList)) {
            updateList[_level] = _tracks.filter(x => !readData[_level].includes(x))
        }
    }
    else { 
        // New trackIdList.json file
       trackList = readData;
       updateList = trackList;
    }

    // Write updated data into file
    await writeFile(updateIdListURL, JSON.stringify(updateList));
    // Write new trackIdList.json
    await writeFile(trackIdListURL, JSON.stringify(trackList));

    console.log('[SDVX.IN] Updated Track Ids: \n', updateList);

    // Update tracks into Database
    await updateTrackDB();
}



/**
 * =-=-=-=-=-=-=-=-=-=-=
 * Create Database
 * =-=-=-=-=-=-=-=-=-=-=
 */
export async function createTrackDB() {

    // Open Database
    const db = await open({
        filename: trackListDbURL,
        driver: sqlite3.Database
    })

    // Check for tracks Table
    const res = db.get("SELECT * FROM tracks")
    // Remove all data if table exists
    if(res) { db.exec("DELETE FROM tracks"); }
    else { 
            // Create new table
            db.run(`CREATE TABLE tracks (
            id text,
            title text,
            artist text,
            level text,
            difficulty text,
            bpm text,
            effector text,
            illustrator text,
            version text,
            trackURL text,
            jacketURL text)`);
    }

    db.close();
    console.log('[SDVX.IN] Database Generated!')

}



/**
 * =-=-=-=-=-=-=-=-=-=-=
 * Update Track Database
 * =-=-=-=-=-=-=-=-=-=-=
 */
export async function updateTrackDB() {
    
    // Read updateIdList.json
    let readData = await readFile(updateIdListURL);
    readData = await JSON.parse(readData);

    // Open Database
    const db = await open({
        filename: trackListDbURL,
        driver: sqlite3.Database
    })

    for(const [_level, _ids] of Object.entries(readData)) {
        for(const _id of _ids) {
            let track = await fetchTrackInfo(_id);
            await insertTrackIntoDB(_id, track, db);
        }
    }

    db.close();
    console.log('[SDVX.IN] Database Updated!')
}



/**
 * [PRIVATE] Insert specified track into Database
 * @param {*} _id ID of the track to be inserted
 * @param {*} _track Track object to be inserted
 * @param {*} _db Database to be inserted into
 */
async function insertTrackIntoDB(_id, _track, _db,) {

    _db.run("INSERT INTO tracks VALUES ($id, $title, $artist, $level, $difficulty, $bpm, $effector, $illustrator, $version, $trackURL, $jacketURL)", 
        {
            $id: `"${_id}"`,
            $title: `"${_track.title}"`,
            $artist: `"${_track.artist}"`,
            $level: `"${_track.level}"`,
            $difficulty: `"${_track.difficulty}"`,
            $bpm: `"${_track.bpm}"`,
            $effector: `"${_track.effector}"`,
            $illustrator: `"${_track.illustrator}"`,
            $version: `"${_track.version}"`,
            $trackURL: `"${_track.trackURL}"`,
            $jacketURL: `"${_track.jacketURL}"`
        })

    console.log('[SDVX.IN] Database Insert: \n', _id, _track)

}



/**
 * [PRIVATE] Get Track Info from Id
 * @param {String} _trackIdDiff Full Track ID with Difficulty
 * @returns {Track} Track Object with track info
 */
async function fetchTrackInfo(_trackIdDiff) {

    let track = {}
    let trackId, trackVer, trackDiff;
    
    trackDiff = _trackIdDiff.slice(5, _trackIdDiff.length);
    trackId = _trackIdDiff.slice(0, _trackIdDiff.length - 1);
    trackVer = _trackIdDiff.slice(0, _trackIdDiff.length - 4);

    const fetchTrackData = await fetch(`https://sdvx.in/${trackVer}/js/${trackId}sort.js`);
    const strTrackData = await fetchTrackData.text();

    // Fuck load of string splitting for data
    let sortData;

    // Level
    let level
    try {
        sortData = strTrackData.split('\n').filter((str) => {
            return str.includes(`var LV${_trackIdDiff}`);
        });
        sortData = sortData[0].split('>');
        level = sortData[5].slice(0, 2);
    }
    catch { level = '?' }

    // Title
    let title
    try {
        sortData = strTrackData.split('\n').filter((str) => {
            return str.includes(`TBR${_trackIdDiff}`);
        });

        sortData = sortData[0].split('"');
        title = sortData[1].slice(0, sortData[1].length - 5);
    }
    catch { title = '?' }

    // Artist
    let artist
    try {
        sortData = strTrackData.split('\n').filter((str) => {
            return str.includes(`ARTIST${trackId}=`);
        });

        sortData = sortData[0].split('</');
        artist = sortData[0].slice(34, sortData[0].length);
    }
    catch { artist = '?' }

    // BPM
    let bpm
    try {
        sortData = strTrackData.split('\n').filter((str) => {
            return str.includes(`var BPM`);
        });

        sortData = sortData[0].split('>');
        try { 
            bpm = sortData[8].slice(0, -5); 
            if(bpm.includes('<')) bpm = sortData[7].slice(0, -5);
        }
        catch { bpm = sortData[6].slice(0, -7); }

        if(bpm.includes('<')) bpm = sortData[9].slice(0, -5);

        if(bpm === '') bpm = sortData[9].slice(0, -5);
        if(bpm.includes('\\')) bpm = '?'
    }
    catch { bpm = '?' }

    // Effector
    let effector
    try {
        sortData = strTrackData.split('\n').filter((str) => {
            return str.includes(`EF${_trackIdDiff}`);
        });

        sortData = sortData[0].split('Effected by / ');
        sortData = sortData[1].split('<br>')
        effector = sortData[0];
        if (effector === '') {
            const tempSortData = sortData[0].split('=ef');
            effector = tempSortData[1].slice(14, sortData[1].length);
        }
        if (effector === 'td class') { effector = '?'}
    }
    catch { effector = '?' }

    // Illustrator
    let illustrator
    try {
        sortData = strTrackData.split('\n').filter((str) => {
            return str.includes(`EF${_trackIdDiff}`);
        });

        sortData = sortData[0].split('Illustlated by / ');
        sortData = sortData[1].split('<');
        illustrator = sortData[0]

        if (illustrator === "") { illustrator = '?' }
    }
    catch { illustrator = '?' }

    // Version
    let trackVerInt = parseInt(trackVer);

    // URLs
    let trackURL, jacketURL;
    for (let i = 0; i <= SDVXIN.MAX_VERSION - trackVerInt; i++) {
        let tryUrl = `https://sdvx.in/0${trackVerInt + i}/${_trackIdDiff.toLowerCase()}.htm`;
        let trackFetch = await fetch(tryUrl);
        if (trackFetch.ok) {
            trackURL = tryUrl;
            jacketURL = `https://sdvx.in/0${trackVerInt + i}/jacket/${_trackIdDiff.toLowerCase()}.png`;
            track = {
                id: _trackIdDiff,
                level: level,
                difficulty: parseTrackDifficulty(trackDiff),
                title: title,
                artist: artist,
                bpm: bpm,
                effector: effector,
                illustrator: illustrator,
                version: parseVersion(trackVer),
                trackURL: trackURL,
                jacketURL: jacketURL,
            };

            return new Track(track);
        };
    }

}


 /**
  * [PRIVATE] Parse difficulty from ID to 3 character difficulty
  * @param {String} _difficulty Single Character difficulty
  * @returns {String} 3 Character difficulty
  */
 function parseTrackDifficulty(_difficulty) {
    switch (_difficulty) {
        case 'N':
            return 'NOV';
        case 'A':
            return 'ADV';
        case 'E':
            return 'EXH';
        case 'M':
            return 'MXM';
        case 'I':
            return 'INF';
        case 'G':
            return 'GRV';
        case 'H':
            return 'HVN';
        case 'V':
            return 'VVD';
        default:
            return '';
    }
}


/**
  * [PRIVATE] Parse version from ID to version name
  * @param {String} _id Id without difficulty
  * @returns {String} Full version name
  */
 function parseVersion(_ver) {
    switch (_ver) {
        case '01':
            return 'BOOTH';
        case '02':
            return 'II -infinite infection-';
        case '03':
            return 'III GRAVITY WARS';
        case '04':
            return 'IV HEAVENLY HAVEN';
        case '05':
            return 'VIVID WAVE';
        case '06':
            return 'EXCEED GEAR';
        default:
            return '';
    }
}