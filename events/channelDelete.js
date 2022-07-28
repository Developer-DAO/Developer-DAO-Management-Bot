const { GuildChannel, DMChannel, MessageEmbed } = require("discord.js")
const myCache = require('../helper/cache');
const { updateDb } = require("../helper/util");
const { sprintf } = require("sprintf-js");
require("dotenv").config()

module.exports = {
    name: "channelDelete",
    once: false,
    /**
     * @param  { DMChannel | GuildChannel } deleteChannel
     */
    async execute( deleteChannel ) {
        if (!myCache.has("ChannelsWithoutTopic") || !myCache.has("GuildSetting")) return
        
        const tmp = myCache.get("ChannelsWithoutTopic");
        if (tmp[deleteChannel.id]){
            delete tmp[deleteChannel.id];
            
            await updateDb("channelsWithoutTopic", tmp);
            myCache.set("ChannelsWithoutTopic", tmp);

            const notificationChannelId = myCache.get("GuildSetting").notification_channel;
            const targetChannel = deleteChannel.guild.channels.cache.get(notificationChannelId);
            if (!targetChannel) return
            return targetChannel.send({
                embeds:[
                    new MessageEmbed()
                        .setTitle("Good News")
                        .setDescription(sprintf("\`#%s\` channel without description has been deleted!", deleteChannel.name))
                ]
            })
        }
        
    }
}