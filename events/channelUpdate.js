const { GuildChannel, DMChannel, MessageEmbed } = require("discord.js");
const { sprintf } = require("sprintf-js");
const { updateDb } = require("../helper/util");
const myCache = require('../helper/cache');
require("dotenv").config()

module.exports = {
    name: "channelUpdate",
    once: false,
    /**
     * @param  { DMChannel | GuildChannel } oldChannel
     * @param  { DMChannel | GuildChannel } newChannel
     */
    async execute(oldChannel, newChannel) {
        if (!myCache.has("ChannelsWithoutTopic") || !myCache.has("GuildSetting")) return
        const achieveChannels = myCache.get("GuildSetting").achieve_category_channel;
        if (
            oldChannel.type == "GUILD_TEXT" 
            && !oldChannel.topic 
            && !achieveChannels.includes(oldChannel.parentId)
            && newChannel.type == "GUILD_TEXT" 
            && newChannel.topic 
            && !achieveChannels.includes(newChannel.parentId)
        ){
            const tmp = myCache.get("ChannelsWithoutTopic");
            if (tmp[oldChannel.id]){
                delete tmp[oldChannel.id];

                await updateDb("channelsWithoutTopic", tmp);
                myCache.set("ChannelsWithoutTopic", tmp);

                const notificationChannelId = myCache.get("GuildSetting").notification_channel;
                const targetChannel = newChannel.guild.channels.cache.get(notificationChannelId);
                if (!targetChannel) return
                return targetChannel.send({
                    embeds:[
                        new MessageEmbed()
                            .setTitle("Good News")
                            .setDescription(sprintf("<#%s> has added its description!", newChannel.id))
                    ]
                })
            }
        }

        if (
            oldChannel.type == "GUILD_TEXT" 
            && oldChannel.topic 
            && !achieveChannels.includes(oldChannel.parentId)
            && newChannel.type == "GUILD_TEXT" 
            && !newChannel.topic 
            && !achieveChannels.includes(newChannel.parentId)
        ){
            
            const data = {
                ...myCache.get("ChannelsWithoutTopic"),
                [newChannel.id]: {
                    channelName: newChannel.name,
                    parentName: newChannel.parentId,
                    status: false,
                    messageId: "",
                    timestamp: 0
                }
            }

            await updateDb("channelsWithoutTopic", data);
            myCache.set("ChannelsWithoutTopic", data);

            const notificationChannelId = myCache.get("GuildSetting").notification_channel;
            const targetChannel = newChannel.guild.channels.cache.get(notificationChannelId);
            if (!targetChannel) return
            return targetChannel.send({
                embeds:[
                    new MessageEmbed()
                        .setTitle("Bad News")
                        .setDescription(sprintf("<#%s> has removed its description!", newChannel.id))
                ]
            })
            
        }
        
    }
}