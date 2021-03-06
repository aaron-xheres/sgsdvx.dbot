# sgsdvx.dbot
A Nodejs Sound Voltex Bot for Discord

---

## | Todo

```
[] Fix broken BPM on update process
[] OCR for score tracking
-- [] Score Recognition
-- [] EX Score Recognition (and handling lack thereof)
-- [] Track Recognition
-- [] Difficulty Recognition
-- [] Name Recognition
```

## | User Enviornment File (.env)

For security purposes, ```.env``` is not included in the repository and must be created by the user in ```src/```.  
Include the following environmental variable to start using
```
DISCORD_TOKEN = <Discord Bot Token>
DISCORD_CLIENT = <Discord Client ID>
DISCORD_GUILD = <Discord Guild ID>
```

These are used specifically for the SGSDVX Group on these files
```daily_randomTrack.js``` ```weekly_randomChallenge.js``` ```weekly_updateDatabase.js```
```
CHANNEL_ADMIN_LOG = <ADMIN LOG CHANNEL ID>
CHANNEL_PUBLIC_ANNOUNCE = <PUBLIC ANNOUNCEMENT CHANNEL ID>
CHANNEL_PUBLIC_GENERAL = <PUBLIC GENERAL CHANNEL ID>
```

## | Usage

Use ```node .``` on project root to start the bot  
 
## | Database

Database is SQLite3

Track Database is populated by extracting information from [sdvx.in](https://sdvx.in/) 

Generated database might have missing BPM if none of the difficulty is being noted/charted down. Manual edit might be required as the BPM is likely to not update due to the updating process checking only track IDs

### Updating Database

Updates for database will be called every ```Sunday 00:00 UTC+8``` automatically.  
You can change the timezone on which the update occurs in ```constants.js``` under ```TIMEZONE```

Updates will also occur each time the bot is started.  

### Generating new Database

If a new Database is required to be generated, delete ```resources/sdvx.in/trackIdList.json```   
The bot will start to generating a new ```trackIdList.json``` on startup which will then update the database.
