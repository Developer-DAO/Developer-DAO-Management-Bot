const { GuildChannel, DMChannel, MessageEmbed } = require("discord.js")
const myCache = require('../helper/cache');
const { updateDb } = require("../helper/util");
const sprintf = require("sprintf-js").sprintf
require("dotenv").config()

module.exports = {
    name: "channelCreate",
    once: false,
    /**
     * @param  { DMChannel | GuildChannel } newChannel
     */
    async execute(newChannel) {
        if (!myCache.has("ChannelsWithoutTopic") || !myCache.has("GuildSetting")) return
        const achieveChannels = myCache.get("GuildSetting").achieve_category_channel;
        if (
            newChannel.type == "GUILD_TEXT" 
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
                        .setDescription(sprintf("<#%s> was created without description!", newChannel.id))
                ]
            })
            
        }
    }
}