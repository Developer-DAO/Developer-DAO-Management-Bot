const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { Client } = require("discord.js");
const { initializeApp } = require('firebase/app')
const { getFirestore, setDoc, getDoc, doc} = require("firebase/firestore");
const { stickyMsgHandler } = require('../stickymessage/handler');
const myCache = require('../helper/cache');
const logger = require("../helper/logger");
const CONSTANT = require("../helper/const");
const { checkOnboardingSchedule } = require('../helper/util');

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

        const app = initializeApp({
            projectId: process.env.FIRESTORE_PROJECTID,
        }, "devDAO");
        const db = getFirestore(app);
        const guildRef = doc(db, "Guild", process.env.GUILDID);
        const guildSnap = await getDoc(guildRef);

        if (guildSnap.exists()){
            await checkOnboardingSchedule(guildSnap.data().onboarding_schedule ?? []);
            myCache.mset([
                { key: "ChannelsWithoutTopic", val: guildSnap.data().channelsWithoutTopic },
                { key: "GuildSetting", val: {
                    notification_channel: guildSnap.data().notification_channel,
                    introduction_channel: guildSnap.data().introduction_channel,
                    achieve_category_channel: guildSnap.data().achieve_category_channel
                }}
            ])
        }else{

            const channelInformInit = {
                notification_channel: null,
                introduction_channel: null,
                achieve_category_channel: []
            }
            const selected = {}

            await setDoc(doc(db, "Guild", process.env.GUILDID), {
                channelsWithoutTopic: selected,
                ...channelInformInit
            });

            myCache.mset([
                { key: "ChannelsWithoutTopic", val: selected },
                { key: "GuildSetting", val: channelInformInit },
                { key: "OnboardingSchedule", val: [], ttl: CONSTANT.BOT_NUMERICAL_VALUE.ONBOARDING_SCHEDULE_UPDATE_INTERNAL}
            ])
            logger.info("Database initiated.")
        }

        myCache.on("expired", async(key, value) => {
            if (key == "OnboardingSchedule"){
                await checkOnboardingSchedule(value)
            }
        })

        const stickMsgChannel = guild.channels.cache.get(myCache.get("GuildSetting").introduction_channel);

        if (stickMsgChannel) {
            stickyMsgHandler(stickMsgChannel, true);
        }

        const clientId = client.user.id;
        const rest = new REST({ version: '9' }).setToken(process.env.TOKEN);

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