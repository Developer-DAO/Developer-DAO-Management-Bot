const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction, MessageEmbed } = require("discord.js");
require("dotenv").config()

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
            .setTitle("Hi, D_D in XXX channel")
            .setDescription("We are the Server Architecture Team. We oversee the ongoing maintenance of the different categories and channels — and our purpose is to make it easier for Developer DAO's members to navigate Discord, and to quickly find the information that they're looking for (good to use uppercase, so that they know that this is an official group within the DAO, and give a brief summary)\n\nIs there anyone willing to add a description to this channel? Please let us know if you need any help with it.\nThanks for your support!")
        const removeEmebed = new MessageEmbed()
            .setTitle("Hi, D_D in XXX channel")
            .setDescription("We are the Server Architecture Team. We oversee the ongoing maintenance of the different categories and channels — and our purpose is to make it easier for Developer DAO's members to navigate Discord, and to quickly find the information that they're looking for (good to use uppercase, so that they know that this is an official group within the DAO, and give a brief summary)\n\nWe are going to remove/archive this channel in a month. Please let us know here if you think this channel is important to you/this guild\nThanks for your support!")
        return interaction.reply({
            embeds: [descriptionEmebed, removeEmebed],
            ephemeral: true
        })
    }

}