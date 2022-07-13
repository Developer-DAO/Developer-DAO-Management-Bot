const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction, MessageEmbed } = require("discord.js");
const CONSTANT = require("../helper/const");
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
        const descriptionEmebed = new MessageEmbed()
            .setTitle(sprintf(CONSTANT.EMBED_STRING.TITLE, interaction.channel.name))
            .setDescription(sprintf(CONSTANT.EMBED_STRING.DESCRIPTION, `<t:${Math.floor(new Date().getTime() / 1000) + 3600 * 48}:R>`))
        return interaction.reply({
            embeds: [descriptionEmebed],
            ephemeral: true
        })
    }

}