const { ButtonInteraction} = require("discord.js");
const { sprintf } = require("sprintf-js");
const myCache = require("../helper/cache");
const CONSTANT = require("../helper/const");
const { awaitWrap, updateDb } = require("../helper/util");
require('dotenv').config();

module.exports = {
    customId: ["send", "delete"],
    /**
     * @param  {ButtonInteraction} interaction
     */
    async execute(interaction){
        if (interaction.customId == this.customId[0]){
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
            const { msg, error } = await awaitWrap(targetChannel.send({
                content: sprintf(CONSTANT.EMBED_STRING.DESCRIPTION, `<t:${Math.floor(new Date().getTime() / 1000) + 3600 * 48}:R>`)
            }), "msg");

            if (error) return interaction.reply({
                content: "Sorry, cannot send msg to this channel",
                ephemeral: true
            })

            await interaction.deferReply({
                ephemeral: true
            });

            const timestamp = Math.floor(msg.createdTimestamp / 1000);
            let cached = myCache.get("ChannelsWithoutTopic");
            const parentId = targetChannel.parentId ?? CONSTANT.CONTENT.CHANNEL_WITHOUT_PARENT_PARENTID;
            const parentName = parentId != 
                CONSTANT.CONTENT.CHANNEL_WITHOUT_PARENT_PARENTID ? targetChannel.parent.name : CONSTANT.CONTENT.CHANNEL_WITHOUT_PARENT_PARENTNAME;
            cached[parentId][channelId] = {
                channelName: targetChannel.name,
                status: true,
                messageId: msg.id,
                timestamp: timestamp,
                lastMessageTimestamp: timestamp
            };
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
    }
   
}