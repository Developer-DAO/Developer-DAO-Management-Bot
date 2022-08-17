const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction, MessageEmbed } = require("discord.js");
const CONSTANT = require("../helper/const");
const { getNotificationMsg } = require('../helper/util');
const sprintf = require("sprintf-js").sprintf
require("dotenv").config();

module.exports = {
    commandName: "preview",
    description: "Preview the messages",

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
        return interaction.reply({
            content: getNotificationMsg(interaction.channel.id, Math.floor(new Date().getTime() / 1000) + CONSTANT.BOT_NUMERICAL_VALUE.EXPIRY_TIME),
            ephemeral: true
        })
    }

}