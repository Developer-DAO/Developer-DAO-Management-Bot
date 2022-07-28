const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction } = require("discord.js");
const { getApp } = require('firebase/app')
const { getFirestore, doc, updateDoc } = require('firebase/firestore');
const { sprintf } = require('sprintf-js');
const myCache = require("../helper/cache");
require("dotenv").config();

module.exports = {
    commandName: "set",
    description: "Guild Setting",

    data: null,

    generateData() {
        this.data = new SlashCommandBuilder()
            .setName(this.commandName)
            .setDescription(this.description)
            .addSubcommand(command =>
                command.setName("notification_channel")
                    .setDescription("Set notification channel for the guild")
                        .addChannelOption(option =>
                            option.setName("channel")
                                .setDescription("The channel for notification")
                                .setRequired(true)))
            .addSubcommand(command =>
                command.setName("achieve_category_channel")
                    .setDescription("Set achieve parent channel for the guild")
                        .addChannelOption(option =>
                            option.setName("channel")
                                .setDescription("The parent channel for achieve")
                                .setRequired(true)))
            
    },

    /**
     * @param  {CommandInteraction} interaction
     */
    async execute(interaction) {

        if (interaction.options.getSubcommand() == "notification_channel"){

            const targetChannel = interaction.options.getChannel("channel");

            if (targetChannel.id == myCache.get("GuildSetting").notification_channel){
                return interaction.reply({
                    content: sprintf("<#%s> is set as Notification Channel", targetChannel.id),
                    ephemeral: true
                })
            }

            const db = getFirestore(getApp("devDAO"));
            const guildRef = doc(db, "Guild", process.env.GUILDID);
            await updateDoc(guildRef, {
                notification_channel: targetChannel.id
            })
            
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

        if (interaction.options.getSubcommand() == "achieve_category_channel"){
            const targetChannel = interaction.options.getChannel("channel");
            if (targetChannel.type != "GUILD_CATEGORY") return interaction.reply({
                content: "Sorry, channel you chose is not a \`Category Channel\`",
                ephemeral: true
            })

            const currentCache = myCache.get("GuildSetting");
            if (currentCache.achieve_category_channel.includes(targetChannel.id)){
                return interaction.reply({
                    content: sprintf("<#%s> has been added into achieve parent channels", targetChannel.id),
                    ephemeral: true
                })
            }
            const newAchieveParentChannel = [...currentCache.achieve_category_channel, targetChannel.id];

            const db = getFirestore(getApp("devDAO"));
            const guildRef = doc(db, "Guild", process.env.GUILDID);
            await updateDoc(guildRef, {
                achieve_category_channel: newAchieveParentChannel
            })

            myCache.set("GuildSetting", {
                ...currentCache,
                achieve_category_channel: newAchieveParentChannel
            })

            return interaction.reply({
                content: sprintf("<#%s> has been added into achieve parent channels", targetChannel.id),
                ephemeral: true
            })
        }
        
    }

}