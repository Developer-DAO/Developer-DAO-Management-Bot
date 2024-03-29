const { GuildChannel, DMChannel, MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const { sprintf } = require("sprintf-js");
const { updateDb, getParentInform, awaitWrap } = require("../helper/util");
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
        if (!myCache.has("ChannelsWithoutTopic") || !myCache.has("GuildSetting")) return;
        const achieveChannels = myCache.get("GuildSetting").archive_category_channel;
        let cached = myCache.get("ChannelsWithoutTopic");
        if (
            oldChannel.type == "GUILD_TEXT" 
            && !oldChannel.topic 
            && !achieveChannels.includes(oldChannel.parentId)
            && newChannel.type == "GUILD_TEXT" 
            && newChannel.topic 
            && !achieveChannels.includes(newChannel.parentId)
        ){
            const parentId = oldChannel.parentId ?? CONSTANT.CONTENT.CHANNEL_WITHOUT_PARENT_PARENTID;
            const parentName = parentId != 
                CONSTANT.CONTENT.CHANNEL_WITHOUT_PARENT_PARENTID ? oldChannel.parent.name : CONSTANT.CONTENT.CHANNEL_WITHOUT_PARENT_PARENTNAME;

            if (parentId in cached && cached[parentId][oldChannel.id]){
                delete cached[parentId][oldChannel.id];
                if (Object.keys(cached[parentId]).length == 1){
                    delete cached[parentId];
                }
                
                await updateDb("channelsWithoutTopic", cached);
                myCache.set("ChannelsWithoutTopic", cached);

                const notificationChannelId = myCache.get("GuildSetting").notification_channel;
                const targetChannel = oldChannel.guild.channels.cache.get(notificationChannelId);
                if (!targetChannel) return
                return targetChannel.send({
                    embeds:[
                        new MessageEmbed()
                            .setTitle("Channal Report")
                            .addFields([
                                { name: "Parent", value: `${parentName} (${parentId})` },
                                { name: "Channel", value: `<#${oldChannel.id}>` },
                                { name: "Action", value: "Update with Description" }
                            ])
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
            const {parentId, parentName} = getParentInform(newChannel.parentId, newChannel.parent);
            const { messages, error } = await awaitWrap(newChannel.messages.fetch({
                limit: 1
            }), "messages");
            let lastMsgTime;
            if (error) lastMsgTime = 0;
            else{
                if (messages.size == 0) lastMsgTime = 0;
                else lastMsgTime = Math.floor(messages.first().createdTimestamp / 1000);
            }
            if (parentId in cached){
                cached[parentId][newChannel.id] = {
                    channelName: newChannel.name,
                    status: false,
                    messageId: "",
                    timestamp: 0,
                    lastMessageTimestamp: lastMsgTime
                }
            }else{
                cached[parentId] = {
                    [newChannel.id]: {
                        channelName: newChannel.name,
                        status: false,
                        messageId: "",
                        timestamp: 0,
                        lastMessageTimestamp: lastMsgTime
                    }
                }
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
                            { name: "Action", value: "Update without description" }
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