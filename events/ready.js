const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { Client } = require("discord.js");
const { initializeApp } = require('firebase/app')
const { getFirestore, setDoc, getDoc, doc} = require("firebase/firestore");
const myCache = require('../helper/cache');
const logger = require("../helper/logger");
const CONSTANT = require("../helper/const")
require("dotenv").config()

module.exports = {
    //event name
    name: "ready",
    //execute once only
    once: true,
    
    /**
     * @param  {Client} client
     * @param  {JSON} commands
     */
    async execute (client, commands){

        logger.info('Bot is online');
        const guild = client.guilds.cache.get(process.env.GUILDID);
        //Cache guild members
        await guild.channels.fetch()

        const clientId = client.user.id;
        const rest = new REST({ version: '9' }).setToken(process.env.TOKEN);
        const app = initializeApp({
            projectId: process.env.FIRESTORE_PROJECTID,
        }, "devDAO");
        const db = getFirestore(app);
        const guildRef = doc(db, "Guild", process.env.GUILDID);
        const guildSnap = await getDoc(guildRef);
        if (guildSnap.exists()){
            myCache.set("ChannelsWithoutTopic", guildSnap.data().channelsWithoutTopic);
            myCache.set("GuildSetting", guildSnap.data().notification_channel)
        }else{
            const channels = guild.channels.cache;
            const selected = channels.filter((channel) => (
                channel.type == "GUILD_TEXT" && !channel.topic && channel.parentId != CONSTANT.CHANNEL.PARENT
            )).map((value) => (value.id));
            await setDoc(doc(db, "Guild", process.env.GUILDID), {
                channelsWithoutTopic: selected
            });
            myCache.set("ChannelsWithoutTopic", selected);
        }

        try{
            if (process.env.ENV == "production"){
                await rest.put(Routes.applicationCommands(clientId), {
                    //JSON Format
                    body: commands 
                });
                logger.info("Commands are set globally");
            }else{
                //Set commands only available in this guild 
                await rest.put(Routes.applicationGuildCommands(clientId, process.env.GUILDID), {
                    //JSON Format
                    body: commands 
                });
                logger.info("Commands are set locally");
            }
        }catch (err){
            logger.info(err);
        }
        
    
    }
}