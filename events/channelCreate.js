const { GuildChannel, DMChannel, MessageEmbed, MessageActionRow, MessageButton } = require("discord.js")
const myCache = require('../helper/cache');
const { updateDb } = require("../helper/util");
const CONSTANT = require("../helper/const");
require("dotenv").config()

module.exports = {
    name: "channelCreate",
    once: false,
    /**
     * @param  { DMChannel | GuildChannel } newChannel
     */
    async execute(newChannel) {
        if (!myCache.has("ChannelsWithoutTopic") || !myCache.has("GuildSetting")) return
        const achieveChannels = myCache.get("GuildSetting").archive_category_channel;
        if (
            newChannel.type == "GUILD_TEXT" 
            && !newChannel.topic 
            && !achieveChannels.includes(newChannel.parentId)
        ){
            const parentId = newChannel.parentId ?? CONSTANT.CONTENT.CHANNEL_WITHOUT_PARENT_PARENTID;
            const parentName = parentId != 
                CONSTANT.CONTENT.CHANNEL_WITHOUT_PARENT_PARENTID ? newChannel.parent.name : CONSTANT.CONTENT.CHANNEL_WITHOUT_PARENT_PARENTNAME;
            let cached = myCache.get("ChannelsWithoutTopic");
            cached[parentId][newChannel.id] = {
                channelName: newChannel.name,
                status: false,
                messageId: "",
                timestamp: 0,
                lastMessageTimestamp: 0
            }
            cached[parentId]["parentName"] = parentName;
            
            await updateDb("channelsWithoutTopic", cached);
            myCache.set("ChannelsWithoutTopic", cached);

            const notificationChannelId = myCache.get("GuildSetting").notification_channel;
            const targetChannel = newChannel.guild.channels.cache.get(notificationChannelId);
            if (!targetChannel) return
            return targetChannel.send({
                embeds:[
                    new MessageEmbed()
                        .setTitle("Channal Report")
                        .addFields([
                            { name: "Parent", value: `${parentName} (${parentId})` },
                            { name: "Channel", value: `<#${newChannel.id}>` },
                            { name: "Action", value: "Creation" }
                        ])
                ],
                components: [
                    new MessageActionRow()
                        .addComponents([
                            new MessageButton()
                                    .setCustomId("send")
                                    .setLabel("Send Notification Message")
                                    .setEmoji("📨")
                                    .setStyle("PRIMARY"),
                                new MessageButton()
                                    .setCustomId("delete")
                                    .setLabel("Delete this record")
                                    .setEmoji("❌")
                                    .setStyle("SECONDARY")                                
                        ])
                ]
            })
        }
    }
}