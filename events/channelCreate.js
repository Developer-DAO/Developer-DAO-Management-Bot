const { GuildChannel, DMChannel, MessageEmbed } = require("discord.js")
const myCache = require('../helper/cache');
const CONSTANT = require("../helper/const");
const sprintf = require("sprintf-js").sprintf
require("dotenv").config()

module.exports = {
    name: "channelCreate",
    once: false,
    /**
     * @param  { DMChannel | GuildChannel } newChannel
     */
    async execute(newChannel) {
        if (!myCache.has("ChannelsWithoutTopic")) return
        if (
            newChannel.type == "GUILD_TEXT" 
            && !newChannel.topic 
            && newChannel.parentId != CONSTANT.CHANNEL.PARENT
        ){
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
                        .setDescription(sprintf("<#%s> was created without description!", newChannel.id))
                ]
            })
            
        }
    }
}