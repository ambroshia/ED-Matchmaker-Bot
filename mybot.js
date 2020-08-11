/* 
 * ED Matchmaker Bot - Discord matchmaking bot for Elite Dangerous
 * Copyright (C) 2020 ambroshia 
 * 
 * This file is part of ED Matchmaker Bot. 
 * 
 * ED Matchmaker Bot is free software: you can redistribute it and/or modify 
 * it under the terms of version 3 of the GNU General Public License as 
 * published by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * ED Matchmaker Bot is distributed in the hope that it will be useful, 
 * but WITHOUT ANY WARRANTY; without even the implied warranty of 
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the 
 * GNU General Public License for more details. 
 * 
 * You should have received a copy of the GNU General Public License 
 * along with this program.  If not, see <https://www.gnu.org/licenses/>. 
 *
 */
const Discord = require("discord.js");
const client = new Discord.Client();
const private_data = require("./private_data.json");
const data = require("./data.json");
const prefix = data.prefix;
 
const id1v1 = "735309636978344047";
const idcustom = "735309718226206720";

client.on("ready", () => {
  console.log("bot is online");
});

// reset 1v1 queue after 1 hour [OLD FUNCTIONS NEED UPDATE]
/*var chan1v1;
function countdown1v1() {
  chan1v1 = setTimeout(timeout, 3600000);
}
function timeout() {
  queues["560025232375676938"].peopleInQueue.length = 0;
  client.channels.get("560025232375676938").send("1 hour has elapsed since last ?reg. The 1v1 queue has been reset.");
}
*/

//event: the "message" event activates when a message is sent in any channels readable by the bot
client.on("message", (message) => {
	if  (!message.content.startsWith(prefix) || message.author.bot) return; // reject commands not starting with the prefix and messages from the bot itself
	
	var args = message.content.slice(prefix.length).trim().split(/ +/g); // remove prefix, trim whitespace from both ends of message, and split the message into array of arguments with spaces
	var command = args.shift().toLowerCase(); // shift() removes the first argument (the command) from the args array and stores it in command. args now contain an array of arguments after the command.
	
	switch (command) {	
		case 'unreg':
		case 'ur':
			if (checkChannel(message.channel)) { // check that current channel exists in data as valid matchmaking channel
				if (!data.channels[message.channel.id].peopleInQueue.includes(message.author)) { // do not let user unreg from a queue they are not in
					message.channel.send("You are not even registered to the " + data.channels[message.channel.id].name + " queue.");
				} else { // user is able to unreg
					data.channels[message.channel.id].peopleInQueue = data.channels[message.channel.id].peopleInQueue.filter(function(returnUnreg) { // unreg command to remove user.
						return returnUnreg != message.author;
					});
					message.channel.send(message.author.username + " has been removed from the " + data.channels[message.channel.id].name + " queue.");
				}
			}
			break;
			
		case 'reg':
		case 'r':
			if (checkChannel(message.channel)) { // check that current channel exists in data as valid matchmaking channel
				if (data.channels[message.channel.id].peopleInQueue.includes(message.author)) { // Do not let the user register twice in the same queue
					message.channel.send("You are already in the " + data.channels[message.channel.id].name + " queue.");
				} else { // user is able to reg
					data.channels[message.channel.id].peopleInQueue.push(message.author);  
					message.channel.send(message.author.username + " has been added to the " + data.channels[message.channel.id].name + " queue. " + data.channels[message.channel.id].peopleInQueue.length + " player(s) in the queue.");
					checkForMatch(message.channel); // always run a check to see if a match can be made everytime a user is added to the queue
				}
			}
			break;
			
		case 'show':
		case 'sh':
			if (checkChannel(message.channel)) { // check that current channel exists in data as valid matchmaking channel
				if (data.channels[message.channel.id].peopleInQueue.length === 0) {
					message.channel.send("The " + data.channels[message.channel.id].name + " queue is empty.");
				} else {
					let showCurrentQueuePlayers = [];
					for (i in data.channels[message.channel.id].peopleInQueue)
						showCurrentQueuePlayers.push(data.channels[message.channel.id].peopleInQueue[i].username);
					message.channel.send(data.channels[message.channel.id].peopleInQueue.length + " player(s) currently in the " + data.channels[message.channel.id].name + " queue: " + showCurrentQueuePlayers.join(", "));
				}
			}
			break;
			
		case 'clear':
		case 'c':
			if (checkChannel(message.channel)) { // check that current channel exists in data as valid matchmaking channel
				data.channels[message.channel.id].peopleInQueue.length = 0;
				data.channels[message.channel.id].peopleWaitingReroll.length = 0;
				message.channel.send("The " + data.channels[message.channel.id].name + " queue has been cleared.");
			}
			break;
			
		case 'reroll':
		case 'rr':
			if (checkChannel(message.channel)) { // check that current channel exists in data as valid matchmaking channel				
				if (data.channels[message.channel.id].peopleWaitingReroll.length < data.channels[message.channel.id].maxPlayerCount) { // check to see whether the reroll queue is full to prevent rerolls of nonexistant matches
					message.channel.send("There are no ready matches!");
					break;
				}
				matchMake(message.channel); // call the matchmake function
			}
			break;
			
		case 'freg':
		case 'fr':
			if (data.channels[message.channel.id].name === "1v1") { // don't proceed if freg command is called in the 1v1 channel
				message.channel.send("Cannot force reg 1v1s");
				break;
			}
			if (checkChannel(message.channel)) { // check that current channel exists in data as valid matchmaking channel
				if (args.length === 0) { // if no freg player is specified, freg Joe
					args.push("Joe");
				}
				var freg = { // create a new object that pretends to be a player
					"username": args[0],
					"freg": true // this boolean will be used later to convert the fake player object into a string to be output into team results
				}
				
				for (var i = 0; i < data.channels[message.channel.id].peopleInQueue.length; ++i) { // iterate through the queue and compare username string with freg user
					if (data.channels[message.channel.id].peopleInQueue[i].username.toLowerCase() == args[0].toLowerCase()) { // compare raw username string of each queue user and freg user
						message.channel.send(data.channels[message.channel.id].peopleInQueue[i].username + " is already in the " + data.channels[message.channel.id].name + " queue.");
						return; // this will stop execution of the remainder code
					}
				} // NOTE: this still cannot prevent a user being reg twice with one self reg and one freg with the user being mentioned. The two user objects are structured too differently.
				
				data.channels[message.channel.id].peopleInQueue.push(freg); // if the check for duplicate players passes, go ahead and freg the user
				message.channel.send(freg.username + " has been added to the " + data.channels[message.channel.id].name + " queue. " + data.channels[message.channel.id].peopleInQueue.length + " player(s) in the queue.");
				checkForMatch(message.channel); // always run a check to see if a match can be made everytime a user is added to the queue
			}
			break;
		
		case 'fosel':
		case 'fosle':
			message.channel.send("https://media.discordapp.net/attachments/493641381089247233/728972224005931008/tenor_3.gif");
			break;
			
		case 'fo':
			if (args[0] === "sel")
				message.channel.send("https://media.discordapp.net/attachments/493641381089247233/728972224005931008/tenor_3.gif");
			break;
		// default: // do nothing if command is not known
	}

});

function checkChannel(channel) { // used to check if a channel exists in the data as a valid matchmaking channel

	if (data.channels[channel.id].name == "customs") { // check if its the customs channel
		channel.send("Please use ?custom for matchmaking in customs");
		return false;
	} else if (data.channels[channel.id]) { // check that the channel id exists in the channels object
		return true;
	} else { // if the channel is not here, don't use it
		channel.send("Channel is under construction");
		return false;
	}
}

function checkForMatch(channel) { // called after every reg to check if there are enough people in the queue to create a match. channel obj is passed as argument
	if (data.channels[channel.id].peopleInQueue.length < data.channels[channel.id].maxPlayerCount) // if insufficient players, do not call matchmaking function
		return;
		
	matchMake(channel);
}

function matchMake(channel) {
	if (data.channels[channel.id].peopleInQueue.length == data.channels[channel.id].maxPlayerCount) { // if this is a new match, clear the reroll queue for players in the new match (if matchMake function is invoked by reroll instead, queue would have < max players)
		data.channels[channel.id].peopleWaitingReroll.length = 0; // first clear the reroll queue since there is now a new match
		
		for (var i = 0; i < data.channels[channel.id].peopleInQueue.length; ++i) // deep copy; reroll queue values will persist until bot shuts down or ?clear is used.
			data.channels[channel.id].peopleWaitingReroll.push(data.channels[channel.id].peopleInQueue[i]);
			
		data.channels[channel.id].peopleInQueue.length = 0; // clear the reg queue to allow another different match to be regged up
	}
	
	let players = []; // temp array that stores the values of the reroll queue and used by the randomizer to generate a new rerolled array
	
	for (var i = 0; i < data.channels[channel.id].peopleWaitingReroll.length; ++i) // another deep copy, otherwise randomizer will delete the reroll queue.
		players.push(data.channels[channel.id].peopleWaitingReroll[i]);
		
	players = scrambler(players); // players array now contains the same values but scrambled
	
	channel.send("A new " + data.channels[channel.id].name + " match is ready: \nTeam 1: " + players.slice(0, players.length / 2).join(", ") + "\nTeam 2: " + players.slice(players.length / 2, players.length).join(", "));
}
	
function scrambler(players) { // randomizer function
	let output = [];
	let n = players.length;
	while (n) { // loop runs as long as players > 0
		let i = Math.floor(Math.random() * players.length);
		if (i in players) {
			
			if (players[i].freg) // boolean which identifies player object as a freg player 
				output.push(players[i].username); // pushes the raw username string in lieu of the object. This allows the team output to print the fregged user's name properly	
			else
				output.push(players[i]); // if its an actual discord user, push the object and it will ping the user correctly in the team output
			
			delete players[i];
			n = n-1;
		}
	}
	return output;
}

	
/* OLD CODE FROM 2018, NEED CLEANING
  if (message.author.bot) {
    if (message.author.id === '557013632781910046' && matchReady && message.content.includes("match is ready to be voted on:")) {

      message.react('👍').then(() => message.react('👎'));

      const filter = (reaction, user) => {
        return ['👍', '👎'].includes(reaction.emoji.name);
      };
      message.awaitReactions(filter, { max: (2 + queues[message.channel.id].votingMajority), time: 60000, errors: ['time'] })
        .then(collected => {
            const reaction = collected.first(); //something wrong here!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
            //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! It should not read the first react, but the MOST react
        console.log("max amount of votes = "+ (2 + queues[message.channel.id].votingMajority));

            if (reaction.emoji.name === '👍') {
        console.log("thumbs up are go");
              resolvedTeamsOutput();  // for some reason it crashes the bot when trying to send the teams 
            } else {
        console.log("match successfully rerolled");
              scramblerTeamOutput();
            }
        })
        .catch(collected => {
            console.log(`After a minute,${queues[message.channel.id].name} voting was terminated`);
        });
      matchReady = false;
      } else {
        return;
    }
  }
  if (message.content.startsWith(prefix) && message.channel.id === '560025313967603712') {
    message.channel.send(`This channel is under construction!`);
  } else if (message.content.startsWith(prefix) && !queues[message.channel.id].matchmaking) { //does not let user use ? commands in non matchmaking channels because it crashes the bot
    message.channel.send(`${message.author}, please use one of the matchmaking channels for matchmaking commands.`)
    return; // For some reason !queues.includes(message.channel.id) crashes the bot and says 'includes is not a function'. NEED FIX ASAP
  }
  
  if (message.isMentioned(client.user)) {
    message.channel.send(`${message.author} `); //pings back users who ping the bot
  } else if  (!message.content.startsWith(prefix) || message.author.bot) return;  //reject any other messages not starting with the prefix
  //end misc meme commands

  const args = message.content.slice(prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();

  function scramblerTeamOutput() {
    let scramblerInput = queues[message.channel.id].peopleWaitingMatchmake;
    let scramblerOutput = scrambler(scramblerInput);
    let pplDoneScrambling = scramblerOutput[0];

      let x = pplDoneScrambling.length;
      let halfCurrentQueue = pplDoneScrambling.length / 2;
      let team1 = pplDoneScrambling.slice(0, halfCurrentQueue);
      let team2 = pplDoneScrambling.slice(halfCurrentQueue, x);
      message.channel.send(`A new ${queues[message.channel.id].name} match is ready to be voted on:\nTeam 1: ${team1.join(", ")}\nTeam 2: ${team2.join(", ")}`);
      queues[message.channel.id].peopleInQueue.length = 0;

      matchReady = true;
      }
     
  function resolvedTeamsOutput() {
    console.log("match successfully resolved");                                      // crashes below this console.log
      let resolvedTeams = queues[message.channel.id].peopleWaitingMatchmake;  //crash?
      let y = resolvedTeams.length;                                             //crash?
      let halfResolvedTeams = resolvedTeams.length / 2;                      //crash?
      let team1 = pplDoneScrambling.slice(0, halfResolvedTeams);               //crash?
      let team2 = pplDoneScrambling.slice(halfResolvedTeams, y);             //crash?
    console.log("yes1");                                                             //does not reach here before crashing
      message.channel.send(`A new ${queues[message.channel.id].name} match is ready to be **played**:\nTeam 1: ${team1.join(", ")}\nTeam 2: ${team2.join(", ")}`);
    console.log("yes2");
      queues[message.channel.id].peopleWaitingMatchmake.length = 0;
  }
  

  if (command === "unreg") {
    if (!queues[message.channel.id].peopleInQueue.includes(message.author)) { //do not let user unreg from a queue they are not in
      message.channel.send(`You are not even registered to the ${queues[message.channel.id].name} queue.`);
    } else { 
      queues[message.channel.id].peopleInQueue = queues[message.channel.id].peopleInQueue.filter(function(returnUnreg) { //unreg command to remove user.
      return returnUnreg != message.author;
      })
      message.channel.send(`${message.author} has been removed from the ${queues[message.channel.id].name} queue.`);
    }
  }

  if (command === "reg") {
    if (queues[message.channel.id].peopleInQueue.includes(message.author)) { //Do not let the user register twice in the same queue
      message.channel.send(`You are already in the ${queues[message.channel.id].name} queue.`);
    } else if (message.channel.id === "560025232375676938") {
      if (queues["560025232375676938"].peopleInQueue.length === 1) { //If a second player ?regs for the 1v1 queue, put him into the people in queue and start a match
        queues["560025232375676938"].peopleInQueue.push(message.author);  
        message.channel.send(`${message.author} has been added to the ${queues[message.channel.id].name} queue.`);
        message.channel.send(`A new ${message.channel} match is ready:\nTeam 1: ${queues["560025232375676938"].peopleInQueue[0]}\nTeam 2: ${queues["560025232375676938"].peopleInQueue[1]}`);
        queues["560025232375676938"].peopleInQueue.length = 0;
        clearTimeout(chan1v1);
      } else if (!queues["560025232375676938"].peopleInQueue.includes(message.author)) { // if the user is not yet registered in the 1v1 queue, add him to queue
        queues["560025232375676938"].peopleInQueue.push(message.author); 
        clearTimeout(chan1v1);
        countdown1v1();
        message.channel.send(`${message.author} has been added to the ${queues[message.channel.id].name} queue.\n${queues["560025232375676938"].peopleInQueue.*} Player(s) currently in queue.`);
      }
    } else if (message.channel.id !== "560025232375676938") { //code for non 1v1 channels (different and requires scrambling with emoji collectors, and also needs to add time out timer)
      if (queues[message.channel.id].peopleInQueue.length == queues[message.channel.id].nearMaxPlayerCount) {
        queues[message.channel.id].peopleInQueue.push(message.author);
        message.channel.send(`${message.author} has been added to the ${queues[message.channel.id].name} queue.`);
        queues[message.channel.id].peopleWaitingMatchmake.length = 0;
        queues[message.channel.id].peopleWaitingMatchmake.push(queues[message.channel.id].peopleInQueue);
        scramblerTeamOutput();
      } else if (!queues[message.channel.id].peopleInQueue.includes(message.author)) {
        queues[message.channel.id].peopleInQueue.push(message.author);
        message.channel.send(`${message.author} has been added to the ${queues[message.channel.id].name} queue.\n${queues[message.channel.id].peopleInQueue.length} Player(s) currently in queue.`);
      }
    }
  }

  //show command finished and works perfectly I think
  if (command === "show") {
    if (queues[message.channel.id].peopleInQueue.length === 0) {
      message.channel.send(`There are currently no players in the ${queues[message.channel.id].name} queue.`);
    } else if (queues[message.channel.id].peopleInQueue.length > 0) {
      let showCurrentQueuePlayers = [];
      for (i in queues[message.channel.id].peopleInQueue) showCurrentQueuePlayers.push(queues[message.channel.id].peopleInQueue[i].username);
      message.channel.send(`There are currently ${queues[message.channel.id].peopleInQueue.length} player(s) in the ${queues[message.channel.id].name} queue: ${showCurrentQueuePlayers.join(", ")}`);
    } 
  }

  if (command === "promote") {
    if (message.channel.id === "560025232375676938") {
      message.channel.send(`You cannot ?promote 1v1s.`);
    } else if (queues[message.channel.id].peopleInQueue.length < (queues[message.channel.id].nearMaxPlayerCount - 1) ) {
      message.channel.send(`You need to have at least ${(queues[message.channel.id].nearMaxPlayerCount - 1) - (queues[message.channel.id].peopleInQueue.length)} more player(s) in queue in order to ?promote.`);
    } else if (args[0] === "2.0"){
      message.channel.send(`@here https://cdn.discordapp.com/attachments/436141514461020181/564643231133073428/reg_or_ur_gay.png`); // this doesnt work for some reason
    } else {
      message.channel.send(`@here ${(queues[message.channel.id].nearMaxPlayerCount + 1) - (queues[message.channel.id].peopleInQueue.length)} more player(s) needed for a ${queues[message.channel.id].name} match.`);
    }
*/
 
client.login(private_data.token); // login using token
