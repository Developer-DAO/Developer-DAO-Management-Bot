const { ButtonInteraction} = require("discord.js");
const { sprintf } = require("sprintf-js");
const myCache = require("../helper/cache");
const CONSTANT = require("../helper/const");
const { awaitWrap, updateDb, getParentInform, getNotificationMsg } = require("../helper/util");
require('dotenv').config();

module.exports = {
    customId: ["send", "delete"],
    /**
     * @param  {ButtonInteraction} interaction
     */
    async execute(interaction){
        
        if (!myCache.has("ChannelsWithoutTopic")) return interaction.reply({
            content: "Sorry, some error occured in data side.",
            ephemeral: true
        });
        const message = interaction.message;
        const embedFields = message.embeds[0].fields;
        const channelId = embedFields.filter((value) => value.name == "Channel")[0].value.slice(2, -1);
        const targetChannel = interaction.guild.channels.cache.get(channelId);
        if (!targetChannel) return interaction.reply({
            content: "Sorry, this channel is unfetchable",
            ephemeral: true
        })

        let cached = myCache.get("ChannelsWithoutTopic");
        const { parentId, parentName } = getParentInform(targetChannel.parentId, targetChannel.parent);
        
        if (interaction.customId == this.customId[0]){
            await interaction.deferReply({
                ephemeral: true
            });

            const { msg, error } = await awaitWrap(targetChannel.send({
                content: getNotificationMsg(channelId, Math.floor(new Date().getTime() / 1000) + CONSTANT.BOT_NUMERICAL_VALUE.EXPIRY_TIME)
            }), "msg");

            if (error) return interaction.reply({
                content: "Sorry, cannot send msg to this channel",
                ephemeral: true
            })

            const timestamp = Math.floor(msg.createdTimestamp / 1000);
            if (parentId in cached){
                cached[parentId][channelId] = {
                    channelName: targetChannel.name,
                    status: true,
                    messageId: msg.id,
                    timestamp: timestamp + CONSTANT.BOT_NUMERICAL_VALUE.EXPIRY_TIME,
                    lastMessageTimestamp: timestamp
                };
            }else{
                cached[parentId] = {
                    [channelId]: {
                        channelName: targetChannel.name,
                        status: true,
                        messageId: msg.id,
                        timestamp: timestamp + CONSTANT.BOT_NUMERICAL_VALUE.EXPIRY_TIME,
                        lastMessageTimestamp: timestamp
                    }
                }
            }
            
            cached[parentId]["parentName"] = parentName;

            myCache.set("ChannelsWithoutTopic", cached);
            await updateDb("channelsWithoutTopic", cached);

            const messageLink = sprintf(CONSTANT.LINK.DISCORD_MSG, {
                guildId: interaction.guild.id,
                channelId: channelId,
                messageId: msg.id,
            })

            return interaction.followUp({
                content: `Message has been sent to <#${channelId}>. [Message Link](${messageLink})`
            })
        }

        if (interaction.customId == this.customId[1]){
            await interaction.deferReply({ ephemeral: true });
            if (parentId in cached && cached[parentId][channelId]){
                delete cached[parentId][channelId];
                if (Object.keys(cached[parentId]).length == 1){
                    delete cached[parentId];
                }
                myCache.set("ChannelsWithoutTopic", cached);
                await updateDb("channelsWithoutTopic", cached);

                return interaction.followUp({
                    content: "Record of this channel has been deleted."
                })
            }

            return interaction.followUp({
                content: "Error occurs when deleting this record, please report to the admin."
            })            
        }
    }
}