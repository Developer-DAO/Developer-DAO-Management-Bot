const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { Client } = require("discord.js");
const { initializeApp } = require('firebase/app')
const { getFirestore, setDoc, getDoc, doc} = require("firebase/firestore");
const { stickyMsgHandler } = require('../stickymessage/handler');
const myCache = require('../helper/cache');
const logger = require("../helper/logger");
const CONSTANT = require("../helper/const");
const { checkOnboardingSchedule, awaitWrap } = require('../helper/util');

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
                { key: "ChannelsWithoutTopic", val: guildSnap.data().channelsWithoutTopic ?? {} },
                { key: "GuildSetting", val: {
                    notification_channel: guildSnap.data().notification_channel,
                    introduction_channel: guildSnap.data().introduction_channel,
                    onboarding_channel: guildSnap.data().onboarding_channel,
                    birthday_channel: guildSnap.data().birthday_channel,
                    archive_category_channel: guildSnap.data().archive_category_channel ?? [],
                    archive_channels: guildSnap.data().archive_channels ?? [],
                    admin_role: guildSnap.data().admin_role ?? [],
                    admin_member: guildSnap.data().admin_member ?? [],
                    admin_command: guildSnap.data().admin_command ?? []
                }}
            ])
        }else{

            const channelInformInit = {
                notification_channel: null,
                introduction_channel: null,
                onboarding_channel: null,
                birthday_channel: null,
                archive_category_channel: [],
                archive_channels: [],
                admin_role: [],
                admin_member: [],
                admin_command: [] 
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

        setInterval(async() => {
            const cached = myCache.get("ChannelsWithoutTopic");
            if (Object.keys(cached).length == 0) return;
            const current = Math.floor(new Date().getTime() / 1000);
            console.log(current, '   ' ,current + 15);
            let toBeArchived = [];
            let moveToArchivePromise = [];
            for (const parentId in cached){
                const channels = cached[parentId];
                toBeArchived.push(
                    ...Object.keys(channels).filter((channelId) => {
                        if (channelId == "parentName") return false;
                        if (channels[channelId].timestamp != 0 && current > channels[channelId].timestamp) return true;
                        else return false
                    }).map((channelId) => ({
                        parentId: parentId,
                        channelId: channelId
                    }))
                )
            };
            if (toBeArchived.length == 0) return;
            // 先查看当前所有的归档频道，找最后面的那个，查看还剩下多少可用的频道数目，决定要创建几个额外的归档频道，把归档频道的ID存起来，然后创建好
            // 使用while来循环，直到所有的频道都放到了归档频道
            // 必须创建notification频道运行命令之前
            const { archive_channels, notification_channel } = myCache.get("GuildSetting");
            let counter = toBeArchived.length;
            while (counter != 0){
                const archiveChannelId = _.last(archive_channels);
                let archiveChannel;
                if (!archiveChannelId){
                    
                }
            }
            
            toBeArchived.forEach(async(channelId) =>{
                const targetChannel = guild.channels.cache.get(channelId);
                const {result, error} = await awaitWrap(targetChannel.setParent(null, {
                    reason: "Inactive Channels"
                }));
                if (error) console.log(error)
            })
        }, CONSTANT.BOT_NUMERICAL_VALUE.ARCHIVE_INTERVAL);

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