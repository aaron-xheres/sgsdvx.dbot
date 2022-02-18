/*
 * Author: Aaron Tan (aarontan.jr@gmail.com)
 * Modified: 28 Dec 2021
 * 
 * Track Class
 */

import { MessageEmbed } from "discord.js";



export class Track {

    get id() { return this._id; }
    get level() { return this._level; }
    get difficulty() { return this._difficulty; }
    get title() { return this._title; }
    get artist() { return this._artist; }
    get bpm() { return this._bpm; }
    get effector() { return this._effector; }
    get illustrator() { return this._illustrator; }
    get version() { return this._version; }
    get trackURL() { return this._trackURL; }
    get jacketURL() { return this._jacketURL; }



    /**
     * Track Object
     * @param {Object} Track Properties
     */
    constructor({id, level, difficulty, title, artist, bpm, effector, illustrator, version, trackURL, jacketURL} = {}) {
        this._id = id;
        this._level = level;
        this._difficulty = difficulty;
        this._title = title;
        this._artist = artist;
        this._bpm = bpm;
        this._effector = effector;
        this._illustrator = illustrator;
        this._version = version;
        this._trackURL = trackURL;
        this._jacketURL = jacketURL;
    }



    /**
     * Generates Embed Message using Track Info
     * @returns {MessageEmbed} Embeded Track Info
     */
    generateEmbed() {
        const embed = new MessageEmbed()
            .setColor(this.#resolveColorByDifficulty(this._difficulty))
            .setTitle(this._title)
            .setURL(this._trackURL)
            .setDescription(this._artist)
            .addField('Level', this._level, true)
            .addField('Difficulty', this._difficulty, true)
            .addField('BPM', this._bpm, true)
            .addField('Effector', this._effector, true)
            .addField('Illustrator', this._illustrator, true)
            .addField('Released', this._version, true)
            .setThumbnail(this._jacketURL);

        return embed;
    }



    static generateTrackFromDatabase(track) {

        const trackObj = new Track({
            id: Track.DatabaseJsonToString(track.id),
            level: Track.DatabaseJsonToString(track.level),
            difficulty: Track.DatabaseJsonToString(track.difficulty),
            title: Track.DatabaseJsonToString(track.title),
            artist: Track.DatabaseJsonToString(track.artist),
            bpm: Track.DatabaseJsonToString(track.bpm),
            effector: Track.DatabaseJsonToString(track.effector),
            illustrator: Track.DatabaseJsonToString(track.illustrator),
            version: Track.DatabaseJsonToString(track.version),
            trackURL: Track.DatabaseJsonToString(track.trackURL),
            jacketURL: Track.DatabaseJsonToString(track.jacketURL),
        })

        return trackObj;

    }



    /**
     * Converts JSON data from database to String
     * @param {String} _value 
     * @returns Database value in string
     */
    static DatabaseJsonToString(_value) {
        return _value.slice(1, _value.length-1)
    }

    

    /**
     * [PRIVATE] Resolve Color based on track difficulty
     * @param {String} _diff 3 Char Difficulty
     * @returns {String} Hexadecimal Color Code
     */
    #resolveColorByDifficulty(diff) {
        switch(diff) {
            case 'NOV':
                return '#8A72C0';
            case 'ADV':
                return '#F9F601';
            case 'EXH':
                return '#992828';
            case 'MXM':
                return '#BEBEBE';
            case 'INF':
                return '#DF4AD8';
            case 'GRV':
                return '#D25F09';
            case 'HVN':
                return '#46B5D1';
            case 'VVD':
                return '#D553AA';
            default:
                return '#000000';
        }
    }
}