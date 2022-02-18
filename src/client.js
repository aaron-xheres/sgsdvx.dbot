/*
 * Author: Aaron Tan (aarontan.jr@gmail.com)
 * Modified: 6 Jan 2022
 * 
 * client.js
 * =-=-=-=-=-=
 * Main client entrypoint for discord bot
 *  - Exports baseURL
 *  - Configures environmental variables
 *  - Deploy commands
 *  - Login to bot
 */

/*
 * =-=-=-=-=-=-=-=-=-=-=
 * Client Constants
 * =-=-=-=-=-=-=-=-=-=-=
 */
import { readDir } from './handlers/fileHandler.js';

const baseURL = process.cwd()



/*
 * =-=-=-=-=-=-=-=-=-=-=
 * Enviroment Variables
 * =-=-=-=-=-=-=-=-=-=-=
 */

import { config } from 'dotenv';
config({ path: `${baseURL}/src/.env` })



/*
 * =-=-=-=-=-=-=-=-=-=-=
 * Deploy Commands
 * =-=-=-=-=-=-=-=-=-=-=
 */

import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';

const commands = []
const commandFiles = await readDir(`./src/${DIR_COMMANDS}`)

for (const file of commandFiles) {
    const commandFile = await import(`./${DIR_COMMANDS}/${file}`);
    const command = commandFile.default
    commands.push(command.data.toJSON());
}

const rest = new REST({ version: '9' }).setToken(`${process.env.DISCORD_TOKEN}`);

const clientId = `${process.env.DISCORD_CLIENT}`

/* Testing Commands */
const guildId = `${process.env.DISCORD_GUILD}`
await rest.put(
    Routes.applicationGuildCommands(clientId, guildId),
    { body: commands },
);

/* Global Commands 
await rest.put(
    Routes.applicationCommands(clientId, 
    { body: commands }))
*/



/*
 * =-=-=-=-=-=-=-=-=-=-=
 * Discord Bot Initialization
 * =-=-=-=-=-=-=-=-=-=-=
 */

import { Client, Collection, Intents } from 'discord.js'
import mkdirp from "mkdirp";

import { DIR_RESOURCES, DIR_COMMANDS, DIR_EVENTS, SDVXIN } from "./constants.js";
import { updateTrackIdList } from './handlers/sdvxinHandler.js';

const resourceDir = [
    `${baseURL}/${DIR_RESOURCES}/${SDVXIN.RESOURCE_BASEDIR}`
]

// Create new client instance
export const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

// Process Commands
client.commands = new Collection();

for (const file of commandFiles) {
    const commandFile = await import(`./${DIR_COMMANDS}/${file}`);
    const command = commandFile.default;
    client.commands.set(command.data.name, command);
}

// Client execute commands
client.on('interactionCreate', async interaction => {
    // Is interaction a command?
    if(!interaction.isCommand()) return;

    // Does command exist?
    const command = client.commands.get(interaction.commandName)
    if(!command) return;

    try {
        await command.execute(interaction)
    }
    catch (error) {
        console.error(error);
        await interaction.reply({ content: 'An error occured', ephemeral: true })
    }
})

// Client initialization
client.once('ready', async () => {

    // Ensure every resource directory exists
    for(const dir of resourceDir) {
        console.log('[DIRECTORY]', dir)
        await mkdirp(dir)
    }

    // Process Events
    const eventFiles = await readDir(`./src/${DIR_EVENTS}`)

    for (const file of eventFiles) {
        const eventFile = await import(`./${DIR_EVENTS}/${file}`);
        eventFile.default();
    }

    // Update Track and Database on start
    await updateTrackIdList();

    console.log('[BOT] Login successful');
});

// Login Discord Bot
client.login(`${process.env.DISCORD_TOKEN}`);