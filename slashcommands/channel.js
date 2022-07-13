const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction, MessageEmbed } = require("discord.js");
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
        const selected = myCache.get("ChannelsWithoutTopic")
        let counter = 0
        const limit = 40;
        const msgArray = []
        while(true){
            let msg = []
            selected.slice(counter, counter + limit).forEach((channelId) => {
                msg.push(`<#${channelId}>\n`)
            });
            msgArray.push(msg)
            if (counter + limit > selected.length) break;
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
                            .setTitle(`Channel without description ${index + 1}`)
                            .setDescription(msg)
                    ],
                    ephemeral: true
                })
            )
        });
        return await Promise.all(embedMsgPromiseArray)
    }

}