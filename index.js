const discord = require('discord.js');
const fs = require("fs");
const path = require('path')
require("dotenv").config();

//Intents mean the functionality of your bot
const client = new discord.Client({ intents: [
    discord.Intents.FLAGS.GUILDS, 
    discord.Intents.FLAGS.GUILD_MESSAGES,
    discord.Intents.FLAGS.GUILD_MEMBERS,
    discord.Intents.FLAGS.GUILD_PRESENCES,
    discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS
]});

client.commands = new discord.Collection();
client.auto = new discord.Collection();
client.buttons = new discord.Collection();


const slashCommandFilesPath = path.join(process.cwd(), "slashcommands");
const slashCommandFiles = fs.readdirSync(slashCommandFilesPath).filter((file) => file.endsWith(".js"));
const slashCommands = [];

//Load command
for (const file of slashCommandFiles){
    const command = require(path.join(slashCommandFilesPath, file));
    command.generateData();
    slashCommands.push(command.data.toJSON());
    //Create a set pair, (commandName, commandPackage), very usefull in events
    client.commands.set(command.data.name, command);
}

const buttonFilesPath = path.join(process.cwd(), "button");
const buttonFiles = fs.readdirSync(buttonFilesPath).filter((file) => file.endsWith(".js"));

//Load button
for (const file of buttonFiles){
    const button = require(path.join(buttonFilesPath, file));
    //Our self-defined customId is an array
    for(const id of button.customId){
        client.buttons.set(id, button);
    }
}

const eventsFilesPath = path.join(process.cwd(), "events");
const eventsFiles = fs.readdirSync(eventsFilesPath).filter((file) => file.endsWith(".js"));

//Loop event
for (const file of eventsFiles){
    const event = require(path.join(eventsFilesPath, file));
    if (event.once){
        //Check specific args from Discord API
        client.once(event.name, (...args) => {event.execute(...args, slashCommands)});
    }else{
        client.on(event.name, (...args) => {event.execute(...args)});
    }
}

client.login(process.env.TOKEN);
