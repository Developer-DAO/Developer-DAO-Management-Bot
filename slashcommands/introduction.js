const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction } = require("discord.js");
const { getApp } = require('firebase/app')
const { getFirestore, doc, updateDoc } = require('firebase/firestore');
const { sprintf } = require('sprintf-js');
const { isValidHttpUrl, awaitWrap, fetchOnboardingSchedule } = require('../helper/util');
const { stickyMsgHandler } = require('../stickymessage/handler');
const myCache = require("../helper/cache");
const CONSTANT = require("../helper/const");

require("dotenv").config();

module.exports = {
    commandName: "onboarding",
    description: "Handle affairs related to onboarding progress",

    data: null,

    generateData() {
        this.data = new SlashCommandBuilder()
            .setName(this.commandName)
            .setDescription(this.description)
            .addSubcommand(command =>
                command.setName("set_channel")
                    .setDescription("Set an introduction channel")
                    .addChannelOption(option =>
                        option.setName("introduction_channel")
                            .setDescription("The channel for introduction")
                            .setRequired(true)))
            .addSubcommand(command =>
                command.setName("set_schedule")
                    .setDescription("Set onboarding schedule for this week")
                    .addStringOption(option =>
                        option.setName("schedule_link")
                            .setDescription("Event message link from sesh bot")
                            .setRequired(true))
                    .addUserOption(option =>
                        option.setName("host")
                            .setDescription("The host of this onboarding call")
                            .setRequired(true)))
            
    },

    /**
     * @param  {CommandInteraction} interaction
     */
    async execute(interaction) {
        const db = getFirestore(getApp("devDAO"));
        const guildRef = doc(db, "Guild", process.env.GUILDID);

        if (interaction.options.getSubcommand() == "set_channel"){
            const targetChannel = interaction.options.getChannel("introduction_channel");
            if (targetChannel.id == myCache.get("GuildSetting").introduction_channel){
                return interaction.reply({
                    content: sprintf("<#%s> is set as Introduction Channel", targetChannel.id),
                    ephemeral: true
                })
            }

            await updateDoc(guildRef, {
                introduction_channel: targetChannel.id
            })
            myCache.set("GuildSetting", {
                ...myCache.get("GuildSetting"),
                introduction_channel: targetChannel.id
            })

            stickyMsgHandler(targetChannel, true)
            return interaction.reply({
                content: sprintf("<#%s> is set as Introduction Channel", targetChannel.id),
                ephemeral: true
            })
        }

        if (interaction.options.getSubcommand() == "set_schedule"){
            const scheduleLink = interaction.options.getString("schedule_link");

            if (!isValidHttpUrl(scheduleLink)) return interaction.reply({
                content: "Please input a valid message link.",
                ephemeral: true
            });
            await interaction.deferReply({
                ephemeral: true
            })

            const [guildId, channelId, messageId] = scheduleLink.match(/\d{18}/g);
            const targetChannel = interaction.guild.channels.cache.get(channelId);
            if (guildId != process.env.GUILDID || !targetChannel || targetChannel.type != "GUILD_TEXT") return interaction.followUp({
                content: "You link is wrong, please check it",
            })

            const {targetMessage, error} = await awaitWrap(targetChannel.messages.fetch(messageId), "targetMessage");
            if (error) return interaction.followUp({
                content: "Message is unfetchable."
            })

            const embeds = targetMessage.embeds;
            if (embeds.length == 0) return interaction.followUp({
                content: "Please use the link of an event."
            })

            let time = null;
            for (const embed of embeds){
                const embedContent = embed.toJSON();
                if (!embedContent.fields.length) continue;
                const targetField = embedContent.fields.filter((field) => (field.name === "Time"));
                if (!targetField.length) continue;
                const timeArray = targetField[0].value.match(/\d{10}/g);
                if (!timeArray.length) continue
                time = timeArray[0];
            }

            if (!time) return interaction.followUp({
                content: "Please choose an event with timestamp"
            });

            const host = interaction.options.getUser("host");

            myCache.set("OnboardingSchedule", [
                ...myCache.get("OnboardingSchedule"),
                { timestamp: time, hostName: host.username}
            ], 60);
            
            await updateDoc(guildRef, {
                onboarding_schedule: myCache.get("OnboardingSchedule")
            })

            return interaction.followUp({
                content: fetchOnboardingSchedule(),
                ephemeral: true
            })
        }

        
    }

}