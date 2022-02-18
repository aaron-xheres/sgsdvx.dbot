# sound-voltex.bot
A Nodejs Sound Voltex Bot for Discord

---

## | User Enviornment File (.env)

For security purposes, ```.env``` is not included in the repository and must be created by the user in ```src/```.  
Include the following environmental variable to start using
```
DISCORD_TOKEN = <Discord Bot Token>
DISCORD_CLIENT = <Discord Client ID>
DISCORD_GUILD = <Discord Guild ID>
```
## | Usage

Use ```node .``` on project root to start the bot  
 
## | Database

Track Database is populated by extracting information from [sdvx.in](https://sdvx.in/) 

### Updating Database

Updates for database will be called every ```Sunday 00:00 UTC+8``` automatically.  
You can change the timezone on which the update occurs in ```constants.js``` under ```TIMEZONE```

Updates will also occur each time the bot is started.  

### Generating new Database

If a new Database is required to be generated, delete ```resources/sdvx.in/trackIdList.json```   
The bot will start to generating a new ```trackIdList.json``` on startup which will then update the database.
