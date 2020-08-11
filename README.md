# ED Matchmaker Bot
Discord matchmaking bot for Elite Dangerous and potentially other games.
Writen using the discord.js library

## Setup
First clone the repository and install the necessary modules
```
git clone https://github.com/ambroshia/ED-Matchmaker-Bot && cd ed-matchmaker-bot
npm install discord.js
```
Go to the Discord Developer Portal https://discord.com/developers/applications and create an application and an accompanying discord bot.

Then, copy the example data json files
```
cp example-data.json data.json
cp example-private_data.json private_data.json
```
Using an editor of your choice, edit the channel ID variables in `data.json` to the channel IDs of your discord server. 

Then, edit the bot token variable inside `private_data.json` to the bot token of your application.

Add the bot to the server to your matchmaking server, then do `node mybot.js` to run the bot.

## Usage
`?reg` `?r` puts the user into the queue

`?unreg` `?ur` removes the user from the queue

`?show` `?sh` shows current users that are in the queue

`?clear` `?c` clears the channel of all matches

`?reroll` `?rr` rerolls a match that has already been made

`?freg` `?fr` force registers a dummy player into the queue. You can specify the name of the player by inputting a string as a parameter, or specify a discord user by pinging the user as the parameter

`?github` `?git` displays a link to this repository

## Copyright 
Copyright (C) 2020 ambroshia

![](https://www.gnu.org/graphics/gplv3-with-text-136x68.png)

ED Matchmaker Bot is licenced under the GNU General Public Licence Version 3 or later, which is a free software licence. See the [licence file](LICENSE) for more info. 
