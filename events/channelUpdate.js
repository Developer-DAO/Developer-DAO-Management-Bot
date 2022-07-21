const { GuildChannel, DMChannel, MessageEmbed } = require("discord.js");
const { sprintf } = require("sprintf-js");
const myCache = require('../helper/cache');
const CONSTANT = require("../helper/const");
require("dotenv").config()

module.exports = {
    name: "channelUpdate",
    once: false,
    /**
     * @param  { DMChannel | GuildChannel } oldChannel
     * @param  { DMChannel | GuildChannel } newChannel
     */
    async execute(oldChannel, newChannel) {
        if (!myCache.has("ChannelsWithoutTopic")) return
        if (
            oldChannel.type == "GUILD_TEXT" 
            && !oldChannel.topic 
            && oldChannel.parentId != CONSTANT.CHANNEL.PARENT
            && newChannel.type == "GUILD_TEXT" 
            && newChannel.topic 
            && newChannel.parentId != CONSTANT.CHANNEL.PARENT
        ){
            const index = myCache.get("ChannelsWithoutTopic").indexOf(oldChannel.id);
            if (index != -1){
                const tmp = myCache.get("ChannelsWithoutTopic");
                tmp.splice(index, 1);
                myCache.set("ChannelsWithoutTopic", tmp);
                const channelExists = myCache.get("GuildSetting").notification_channel;
                if (!channelExists) return
                const targetChannel = newChannel.guild.channels.cache.get(channelExists);
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
            && oldChannel.parentId != CONSTANT.CHANNEL.PARENT
            && newChannel.type == "GUILD_TEXT" 
            && !newChannel.topic 
            && newChannel.parentId != CONSTANT.CHANNEL.PARENT
        ){
            const index = myCache.get("ChannelsWithoutTopic").indexOf(oldChannel.id);
            if (index == -1){
                myCache.set("ChannelsWithoutTopic", [
                    ...myCache.get("ChannelsWithoutTopic"),
                    newChannel.id
                ]);
                const channelExists = myCache.get("GuildSetting").notification_channel;
                if (!channelExists) return
                const targetChannel = newChannel.guild.channels.cache.get(channelExists);
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
}