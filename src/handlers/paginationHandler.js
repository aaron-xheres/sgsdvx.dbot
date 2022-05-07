/*
 * Author: Aaron Tan (aarontan.jr@gmail.com)
 *
 * Pagination Handler
 */

import { Interaction, MessageActionRow, MessageButton, Message, MessageEmbed, MessageSelectMenu } from 'discord.js'
import { Track } from '../classes/track.js';


/**
 * [PRIVATE] Creates a pagination embed for Single Tracks
 * @param {Interaction} interaction
 * @param {Track[]} tracks
 * @param {number} timeout
 * @returns {Message}
 */

export async function trackPagination(interaction, tracks, timeout = 15000) {

    // Current Page
    let page = 0;

    let buttonArray = [];

    for(let i=0; i<tracks.length; i++) {
        buttonArray.push(
            new MessageButton()
                .setCustomId(`${i+1}`) // Hard coded pagination press
                .setLabel(tracks[i].difficulty)
                .setStyle('PRIMARY')
        )
    }

    let pages = []
    for(const track of tracks) {
        pages.push(track.generateEmbed())
    }

    const actionRow = new MessageActionRow().addComponents(buttonArray);

    //has the interaction already been deferred? If not, defer the reply.
    if (interaction.deferred == false){
        await interaction.deferReply()
    };

    let curPage;
    if(interaction.editReply) {
        curPage = await interaction.editReply({
            embeds: [pages[page]],
            components: [actionRow],
            fetchReply: true
        });
    }
    else if(interaction.edit) {
        curPage = await interaction.edit({
            embeds: [pages[page]],
            components: [actionRow],
            fetchReply: true
        });
    }

    console.log('[TRACK] ID:', tracks[0].id.slice(0, -1))
    const filter = (i) =>
        i.customId === '1' ||
        i.customId === '2' ||
        i.customId === '3' ||
        i.customId === '4';

    const collector = await curPage.createMessageComponentCollector({
        filter,
        time: timeout,
    });

    collector.on("collect", async (i) => {
        switch (i.customId) {
            case '1':
                page = 0;
                break;
            case '2':
                page = 1;
                break;
            case '3':
                page = 2;
                break;
            case '4':
                page = 3;
                break;
            default:
                break;
        }

        await i.deferUpdate();
        try {
            await i.editReply({
                embeds: [pages[page]],
                components: [actionRow],
            });
        }
        catch {
            await i.edit({
                embeds: [pages[page]],
                components: [actionRow],
            });
        }
        collector.resetTimer();
    });

    collector.on("end", () => {
        let disabled = []
        for(const button of buttonArray) {
            disabled.push(button.setDisabled(true))
        }

        curPage.edit({
            embeds: [pages[page]],
            components: [new MessageActionRow().addComponents(disabled)],
        });
    });

    return curPage;
};


/**
 * [PRIVATE] Creates a pagination embed for Searched Tracks
 * @param {Interaction} interaction
 * @param {Object} idTracks [Id, Tracks]
 * @param {number} timeout
 * @returns {Message}
 */
import { open } from 'sqlite'
import sqlite3 from 'sqlite3'

import { DIR_RESOURCES, SDVXIN } from '../constants.js';

const baseURL = process.cwd();
const trackListDbURL = `${baseURL}/${DIR_RESOURCES}/${SDVXIN.RESOURCE_BASEDIR}/${SDVXIN.TRACK_DB_FILE}`

export async function searchPagination(interaction, idTracks, timeout = 15000) {

    // Current Page
    let page = 0;

    // Action Row
    const actionRow = new MessageActionRow();
    let menuRow = new MessageActionRow()

    // Get total search count
    const searchCount = Object.keys(idTracks).length
    const tracksPerPage = 10
    const pagesNeeded = Math.ceil(searchCount / tracksPerPage);

    const idTracksArray = [...Object.entries(idTracks).map(([key, value]) => ({ [key]: value }))]

    // Embed Objects & Pages
    let pages = []
    let titlesPage = []

    for(let i=0; i<pagesNeeded; i++) {
        let titles = {}
        let strTitle = ''
        let embed = new MessageEmbed()
            .setTitle(`${searchCount} Tracks found`)
            .setFooter(`Page ${page+1} / ${pagesNeeded}`);
        
        for(let x=0; x<tracksPerPage; x++) {
            try {
                let id = Object.keys(idTracksArray[x+(i*tracksPerPage)])[0]
                let title = Object.values(idTracksArray[x+(i*tracksPerPage)])[0].title
                titles[id] = title

                strTitle += `\`\`\`${title}\n\`\`\``
                
            }
            catch { break; }
        }

        titlesPage.push(titles);
        embed.addField('\u200b', strTitle);

        pages.push(embed)
    }

    if(titlesPage.length === 0) {
        interaction.reply('```0 Tracks found```');
        return;
    }

    // Buttons
    let buttonArray = [
        new MessageButton()
            .setCustomId('prev')
            .setLabel('<')
            .setStyle('PRIMARY'),
        new MessageButton()
            .setCustomId('next')
            .setLabel('>')
            .setStyle('PRIMARY')
    ]

    actionRow.addComponents(buttonArray);

    // Menu
    let menu = new MessageSelectMenu()
        .setCustomId('selectTrack')
        .setPlaceholder('Select Track for Info')

    for(const [id, title] of Object.entries(titlesPage[page])) {
        menu.addOptions({
            label: title,
            value: id
        });
    }

    menuRow.addComponents(menu);

    //has the interaction already been deferred? If not, defer the reply.
    if (interaction.deferred == false){
        await interaction.deferReply()
    };

    const curPage = await interaction.editReply({
        embeds: [pages[page]],
        components: [menuRow, actionRow],
        fetchReply: true
    });

    const collector = await curPage.createMessageComponentCollector({
        time: timeout,
    });

    collector.on("collect", async (i) => {

        menuRow = new MessageActionRow()

        if(i.customId === 'prev') {
            page = page > 0 ? --page : pages.length - 1;

            // Menu
            let menu = new MessageSelectMenu()
            .setCustomId('selectTrack')
            .setPlaceholder('Select Track for Info')

            for(const [id, title] of Object.entries(titlesPage[page])) {
                menu.addOptions({
                    label: title,
                    value: id
                });
            }

            menuRow.addComponents(menu)
        }    

        if(i.customId === 'next') {
            page = page + 1 < pages.length ? ++page : 0;

            // Menu
            let menu = new MessageSelectMenu()
            .setCustomId('selectTrack')
            .setPlaceholder('Select Track for Info')

            for(const [id, title] of Object.entries(titlesPage[page])) {
                menu.addOptions({
                    label: title,
                    value: id
                });
            }

            menuRow.addComponents(menu)
        }
        
        if(i.customId === 'selectTrack') {
            const db = await open({
                filename: trackListDbURL,
                driver: sqlite3.Database
            })

            const res = await db.all(
                `
                SELECT * FROM tracks
                    WHERE 
                        id LIKE '"${i.values[0]}%"'
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

            await collector.stop();
            return trackPagination(i, tracks);
        }

        await i.deferUpdate();
        await i.editReply({
            embeds: [pages[page].setFooter(`Page ${page+1} / ${pagesNeeded}`)],
            components: [menuRow, actionRow],
        });
    
        collector.resetTimer();
    });

    collector.on("end", () => {
        let disabled = []
        menu.setDisabled(true)
        for(const button of buttonArray) {
            disabled.push(button.setDisabled(true))
        }

        curPage.delete();
    });

}