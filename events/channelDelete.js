const { GuildChannel, DMChannel, MessageEmbed } = require("discord.js")
const myCache = require('../helper/cache');
const { updateDb } = require("../helper/util");
const { sprintf } = require("sprintf-js");
const CONSTANT = require("../helper/const");
require("dotenv").config()

module.exports = {
    name: "channelDelete",
    once: false,
    /**
     * @param  { DMChannel | GuildChannel } deleteChannel
     */
    async execute( deleteChannel ) {
        if (!myCache.has("ChannelsWithoutTopic") || !myCache.has("GuildSetting")) return
        const parentId = deleteChannel.parentId ?? CONSTANT.CONTENT.CHANNEL_WITHOUT_PARENT_PARENTID;
        const parentName = parentId != 
            CONSTANT.CONTENT.CHANNEL_WITHOUT_PARENT_PARENTID ? deleteChannel.parent.name : CONSTANT.CONTENT.CHANNEL_WITHOUT_PARENT_PARENTNAME;
        let cached = myCache.get("ChannelsWithoutTopic");

        if (parentId in cached && cached[parentId][deleteChannel.id]){
            delete cached[parentId][deleteChannel.id];
            if (Object.keys(cached[parentId]).length == 1){
                delete cached[parentId];
            }
            await updateDb("channelsWithoutTopic", cached);
            myCache.set("ChannelsWithoutTopic", cached);

            const notificationChannelId = myCache.get("GuildSetting").notification_channel;
            const targetChannel = deleteChannel.guild.channels.cache.get(notificationChannelId);
            if (!targetChannel) return
            return targetChannel.send({
                embeds:[
                    new MessageEmbed()
                        .setTitle("Channal Report")
                        .addFields([
                            { name: "Parent", value: `${parentName} (${parentId})` },
                            { name: "Channel", value: `\`${deleteChannel.name}\`` },
                            { name: "Action", value: "Delete" }
                        ])
                ]
            })
        }       
    }
}