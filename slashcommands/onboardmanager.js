const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction, MessageEmbed } = require("discord.js");
const { ChannelType } = require("discord-api-types/payloads/v10")
const { sprintf } = require('sprintf-js');
const { awaitWrap, fetchOnboardingSchedule, convertTimeStamp, updateDb } = require('../helper/util');
const { stickyMsgHandler } = require('../stickymessage/handler');
const myCache = require("../helper/cache");
const CONSTANT = require("../helper/const");

require("dotenv").config();

module.exports = {
    commandName: "onboardmanager",
    description: "Handle affairs related to onboarding progress",

    data: null,

    generateData() {
        this.data = new SlashCommandBuilder()
            .setName(this.commandName)
            .setDescription(this.description)
            .addSubcommandGroup(group =>
                group.setName("set")
                    .setDescription("Onboarding management setting")
                    .addSubcommand(command =>
                        command.setName("introduction")
                            .setDescription("Set an introduction channel")
                            .addChannelOption(option =>
                                option.setName("channel")
                                    .setDescription("The channel for introduction")
                                    .addChannelTypes(ChannelType.GuildText)
                                    .setRequired(true)))
                    .addSubcommand(command =>
                        command.setName("onboarding")
                            .setDescription("Set an onboarding voice channel")
                            .addChannelOption(option =>
                                option.setName("channel")
                                    .setDescription("The voice channel for onboarding call")
                                    .addChannelTypes(ChannelType.GuildVoice)
                                    .setRequired(true)))
                    .addSubcommand(command =>
                        command.setName("schedule")
                            .setDescription("Set onboarding schedule for this week")
                            .addStringOption(option =>
                                option.setName("link")
                                    .setDescription("Event message link from sesh bot")
                                    .setRequired(true))
                            .addUserOption(option =>
                                option.setName("host")
                                    .setDescription("The host of this onboarding call")
                                    .setRequired(true))))
            .addSubcommand(command =>
                command.setName("read")
                    .setDescription("Read current settings of onboarding management"))
            .addSubcommand(command =>
                command.setName("remove")
                    .setDescription("Remove onboarding schedule for this week")
                    .addStringOption(option =>
                        option.setName("schedule")
                            .setDescription("Which schedule you would like to remove")
                            .setRequired(true)
                            .setAutocomplete(true)))
    },

    /**
     * @param  {CommandInteraction} interaction
     */
    async execute(interaction) {
        if (interaction.options.getSubcommandGroup() == "set"){
            const subCommandName = interaction.options.getSubcommand();
            if (subCommandName == "introduction" || subCommandName == "onboarding"){
                const targetChannel = interaction.options.getChannel("channel");

                if (targetChannel.id == myCache.get("GuildSetting").introduction_channel
                    || targetChannel.id == myCache.get("GuildSetting").onboarding_channel){
                    return interaction.reply({
                        content: sprintf("<#%s> is set as a %s Channel", targetChannel.id, subCommandName),
                        ephemeral: true
                    })
                }
                const attributeName = subCommandName + "_channel"
                await updateDb(attributeName, targetChannel.id)

                myCache.set("GuildSetting", {
                    ...myCache.get("GuildSetting"),
                    [attributeName]: targetChannel.id
                })

                if (subCommandName == "introduction") stickyMsgHandler(targetChannel, true);
                
                return interaction.reply({
                    content: sprintf("<#%s> is set as a %s Channel", targetChannel.id, subCommandName),
                    ephemeral: true
                })
            }

            if (subCommandName == "schedule"){
                const scheduleLink = interaction.options.getString("link");

                if (!myCache.get("GuildSetting").introduction_channel) return interaction.reply({
                    content: `Please set up introduction channel first using \`/${this.commandName}\`.`,
                    ephemeral: true
                });

                await interaction.deferReply({
                    ephemeral: true
                }) 

                const prefixLinks = scheduleLink.match(/https:\/\/discord.com\/channels\//g);
                if (!prefixLinks) return interaction.followUp({
                    content: "You link is wrong, please check it",
                })

                const [guildId, channelId, messageId] = scheduleLink.replace(prefixLinks[0], '').split('/')

                const targetChannel = interaction.guild.channels.cache.get(channelId);
                if (guildId != interaction.guild.id || !targetChannel) return interaction.followUp({
                    content: "You link is wrong, please check it",
                })

                const { targetMessage, error } = await awaitWrap(targetChannel.messages.fetch(messageId), "targetMessage");
                if (error) return interaction.followUp({
                    content: "Message is unfetchable."
                })

                const embeds = targetMessage.embeds;
                if (embeds.length == 0) return interaction.followUp({
                    content: "Please use the link of an event."
                })

                let time = null;
                let outDatedFlag = false;
                for (const embed of embeds){
                    const embedContent = embed.toJSON();
                    if (!embedContent.fields.length) continue;
                    const targetField = embedContent.fields.filter((field) => (field.name === "Time"));
                    if (!targetField.length) continue;
                    const timeArray = targetField[0].value.match(/\d{10}/g);
                    if (!timeArray.length) continue
                    const currentTimeStamp = Math.floor((new Date().getTime()) / 1000);
                    if (currentTimeStamp > timeArray[0]) {
                        outDatedFlag = true;
                        continue
                    }
                    time = timeArray[0];
                }

                if (outDatedFlag) return interaction.followUp({
                    content: "The event you chose is out of date."
                })

                if (!time) return interaction.followUp({
                    content: "Please choose an event with timestamp"
                });
                
                const host = interaction.options.getUser("host");

                myCache.set("OnboardingSchedule", [
                    ...myCache.get("OnboardingSchedule"),
                    { 
                        timestamp: parseInt(time), 
                        hostId: host.id,
                        eventLink: scheduleLink,
                        hostName: host.username
                    }
                ], CONSTANT.BOT_NUMERICAL_VALUE.ONBOARDING_SCHEDULE_UPDATE_INTERNAL);
                
                await updateDb("onboarding_schedule", myCache.get("OnboardingSchedule"))

                return interaction.followUp({
                    embeds: [fetchOnboardingSchedule()],
                    ephemeral: true
                })
            }
        }

        if (interaction.options.getSubcommand() == "read"){
            let { onboarding_channel, introduction_channel } = myCache.get("GuildSetting");
            onboarding_channel = onboarding_channel ? `<#${onboarding_channel}>` : "Unavailable";
            introduction_channel = introduction_channel ? `<#${introduction_channel}>` : "Unavailable";
            
            return interaction.reply({
                embeds: [
                    new MessageEmbed()
                        .setName(`${interaction.guild.name} Channel Manager Setting`)
                        .addFields([
                            { name: "Onboarding Channel", value: onboarding_channel, inline: true },
                            { name: "Introduction Channel", value: introduction_channel, inline: true}
                        ]),
                        fetchOnboardingSchedule()
                ],
                ephemeral: true
            })
        }

        if (interaction.options.getSubcommand() == "remove"){
            const index = parseInt(interaction.options.getString("schedule"));

            if (!myCache.get("GuildSetting").introduction_channel) return interaction.reply({
                content: `Please set up introduction channel first using \`/${this.commandName}\`.`,
                ephemeral: true
            });

            if (!index) return interaction.reply({
                content: "Please choose a valid schedule.",
                ephemeral: true
            })

            if (index < 0) return interaction.reply({
                content: "There is no onboarding call schedule now. Please add one first",
                ephemeral: true
            });

            await interaction.deferReply({ ephemeral: true })
            const newCache = myCache.get("OnboardingSchedule");
            const removedSchedule = newCache.splice(index - 1, 1)[0];
            const removedContent = sprintf(CONSTANT.CONTENT.ONBOARDING_OPTION, {
                ...removedSchedule,
                index: index,
                timestamp: convertTimeStamp(removedSchedule.timestamp),
            })

            myCache.set("OnboardingSchedule", newCache, CONSTANT.BOT_NUMERICAL_VALUE.ONBOARDING_SCHEDULE_UPDATE_INTERNAL);
            await updateDb("onboarding_schedule", myCache.get("OnboardingSchedule"))

            return interaction.followUp({
                content: `\`${removedContent}\` has been removed successfully.`,
                embeds: [fetchOnboardingSchedule()]
            })

        }

        
    }

}