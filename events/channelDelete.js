const { GuildChannel, DMChannel, MessageEmbed } = require("discord.js")
const myCache = require('../helper/cache');
const CONSTANT = require("../helper/const");
const { sprintf } = require("sprintf-js");
require("dotenv").config()

module.exports = {
    name: "channelDelete",
    once: false,
    /**
     * @param  { DMChannel | GuildChannel } deleteChannel
     */
    async execute( deleteChannel ) {
        if (!myCache.has("ChannelsWithoutTopic")) return
        const index = myCache.get("ChannelsWithoutTopic").indexOf(deleteChannel.id);
        if (index != -1){
            const tmp = myCache.get("ChannelsWithoutTopic");
            tmp.splice(index, 1);
            myCache.set("ChannelsWithoutTopic", tmp);
            if (!myCache.has("GuildSetting")) return
            const targetChannel = deleteChannel.guild.channels.cache.get(myCache.get("GuildSetting"));
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