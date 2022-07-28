const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction, MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const { getApp } = require('firebase/app')
const { getFirestore, doc, updateDoc } = require('firebase/firestore');
const { sprintf } = require('sprintf-js');
const CONSTANT = require("../helper/const");
const myCache = require("../helper/cache");

require("dotenv").config()

module.exports = {
    commandName: "check",
    description: "Output channels without description",

    data: null,

    generateData() {
        this.data = new SlashCommandBuilder()
            .setName(this.commandName)
            .setDescription(this.description)
    },

    /**
     * @param  {CommandInteraction} interaction
     */
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        const selected = myCache.get("ChannelsWithoutTopic");

        if (Object.keys(selected).length == 0) {
            const achieveChannels = myCache.get("GuildSetting").achieve_category_channel;
            if (achieveChannels.length != 0){
                await interaction.followUp({
                    content: "Channel checking starts, please wait for a while."
                })
                await this.fetchChannelWithoutDescription(interaction);
                return interaction.editReply({
                    content: "Initial checking is done. Please run this command again to output results"
                }) 
            }

            const replyMsg = await interaction.followUp({
                content: "You have not set achieve category channels, would you like set them up first?\n\n✅ **Yes** -- Show you how to add an achieve category.\n\n❌ **No** -- Fetch all channels without description.",
                components: [
                    new MessageActionRow()
                        .addComponents([
                            new MessageButton()
                                .setCustomId("yes")
                                .setLabel("Yes")
                                .setEmoji("✅")
                                .setStyle("PRIMARY"),
                            new MessageButton()
                                .setCustomId("no")
                                .setLabel("No")
                                .setEmoji("❌")
                                .setStyle("SECONDARY")
                        ])
                ],
                fetchReply: true,
            });
            const filter = (i) => 1;
            const buttonCollector = replyMsg.createMessageComponentCollector({
                filter,
                max: 1,
                time: CONSTANT.BOT_NUMERICAL_VALUE.CHANNEL_CHECK_BUTTON_COLLECTOR_INTERNAL
            });

            buttonCollector.on("end", async(collected) => {
                if (collected.size == 0){
                    return replyMsg.edit({
                        content: "Sorry, time out. Please run this command again.",
                        components: []
                    })
                }else{
                    const btnInteraction = collected.first();
                    await btnInteraction.deferUpdate();
                    if (btnInteraction.customId == "yes"){
                        return interaction.editReply({
                            content: "Please use \`/set achieve_category_channel\` command to add an achieve category channel",
                            components: []
                        })
                    }else{
                        await interaction.editReply({
                            content: "Channel checking starts, please wait for a while.",
                            components: []
                        });
                        await this.fetchChannelWithoutDescription(interaction);
                        return interaction.editReply({
                            content: "Initial checking is done. Please run this command again to output results"
                        })
                    }
                }
            });
        }else{
            let counter = 0
            const limit = CONSTANT.BOT_NUMERICAL_VALUE.CHANNEL_VOLUME_PER_MSG;
            const length = Object.keys(selected).length;
            const msgArray = []
            while(true){
                let msg = [];
                Object.keys(selected).slice(counter, counter + limit).forEach((channelId) => {
                    if (selected[channelId].status){
                        msg.push(sprintf(CONSTANT.CONTENT.CHANNEL_STATUS_MSG_SENT), {
                            channelId: channelId,
                            messageLink: sprintf(CONSTANT.LINK.DISCORD_MSG, {
                                guildId: process.env.GUILDID,
                                channelId: channelId,
                                messageId: selected[channelId].messageId,
                            }),
                            timestamp: selected[channelId].timestamp
                        });
                    }else{
                        msg.push(sprintf(CONSTANT.CONTENT.CHANNEL_STATUS_MSG_UNSENT, {
                            channelId: channelId,
                        }));
                    }
                });
                msgArray.push(msg)
                if (counter + limit > length) break;
                else counter += limit;
            }
            const embedMsgPromiseArray = []
            msgArray.forEach((element, index) => {
                let msg = "";
                element.forEach((value) => {
                    msg += value
                });
                embedMsgPromiseArray.push(
                    interaction.followUp({
                        embeds: [
                            new MessageEmbed()
                                .setTitle(`Channel without description Group ${index + 1}`)
                                .setDescription(msg)
                        ],
                        ephemeral: true
                    })
                )
            });
            return await Promise.all(embedMsgPromiseArray)
        }
    },

    /**
     * @param  {CommandInteraction} interaction
     */
    async fetchChannelWithoutDescription(interaction){
        const channels = await interaction.guild.channels.fetch();
        const result = {}
        channels.filter((channel) => (
            channel.type == "GUILD_TEXT" && !channel.topic 
        )).forEach((value) => {
            result[value.id] = {
                channelName: value.name,
                parentName: value.parentId,
                status: false,
                messageId: "",
                timestamp: 0
            }
        })
        const db = getFirestore(getApp("devDAO"));
        const guildRef = doc(db, "Guild", process.env.GUILDID);
        await updateDoc(guildRef, {
            channelsWithoutTopic: result
        });
        myCache.set("ChannelsWithoutTopic", result);
    }

}