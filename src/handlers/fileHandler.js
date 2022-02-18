/*
 * Author: Aaron Tan (aarontan.jr@gmail.com)
 * Modified: 28 Dec 2021
 * File Handling using async fs
 */

import { promises as fs } from 'fs'



/**
 * Read data from file
 * @param {String} _file File URL
 * @returns {Promise} File content
 */
export async function readFile(_file) { return fs.readFile(_file) }



/**
 * Reads path and return array of file names
 * @param {String} _path 
 * @returns {Array} Name of files
 */
export async function readDir(_path) { return fs.readdir(_path) }



/**
 * Write data to file
 * @param {String} _file File URL
 * @param {String} _data Data to be written to file
 */
export async function writeFile(_file, _data) { fs.writeFile(_file, _data, 'utf-8')}



/**
 * Append data to JSON file
 * @param {String} _file 
 * @param {String} _key 
 * @param {*} _data 
 */
export async function appendJSON(_file, _key, _data) {

    let file, jsonData;

    try {
        file = await FileHandler.readFile(_file);
        jsonData = JSON.parse(file.toString());
    }
    catch {
        jsonData = {};
    }

    if(Array.isArray(jsonData[_key])) jsonData[_key].push(_data);
    else jsonData[_key] = _data;
    
}