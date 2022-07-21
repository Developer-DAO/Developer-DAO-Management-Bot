const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction } = require("discord.js");
const { getApp } = require('firebase/app')
const { getFirestore, doc, updateDoc } = require('firebase/firestore');
const { sprintf } = require('sprintf-js');
const myCache = require("../helper/cache");
require("dotenv").config();

module.exports = {
    commandName: "notification",
    description: "Set a notification channel for SAT",

    data: null,

    generateData() {
        this.data = new SlashCommandBuilder()
            .setName(this.commandName)
            .setDescription(this.description)
            .addChannelOption(option =>
                option.setName("notification_channel")
                    .setDescription("The channel for notification")
                    .setRequired(true))
    },

    /**
     * @param  {CommandInteraction} interaction
     */
    async execute(interaction) {
        const targetChannel = interaction.options.getChannel("notification_channel");
        const db = getFirestore(getApp("devDAO"));
        const guildRef = doc(db, "Guild", process.env.GUILDID);
        await updateDoc(guildRef, {
            notification_channel: targetChannel.id
        })

        if (targetChannel.id == myCache.get("GuildSetting").notification_channel){
            return interaction.reply({
                content: sprintf("<#%s> is set as Notification Channel", targetChannel.id),
                ephemeral: true
            })
        }
        
        myCache.set("GuildSetting", {
            ...myCache.get("GuildSetting"),
            notification_channel: targetChannel.id
        })
        await targetChannel.send({
            content: "This channel has been set as Notification Channel"
        })
        return interaction.reply({
            content: sprintf("<#%s> is set as Notification Channel", targetChannel.id),
            ephemeral: true
        })
    }

}