const { SlashCommandBuilder } = require('@discordjs/builders');
const { ChannelType } = require('discord-api-types/v10');
const { CommandInteraction, MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const myCache = require('../helper/cache');
const CONSTANT = require("../helper/const");
const { getCurrentTimeMin } = require('../helper/util');
const sprintf = require("sprintf-js").sprintf

module.exports = {
    commandName: "townhall",
    description: "Help to record town hall",

    data: null,

    generateData() {
        this.data = new SlashCommandBuilder()
            .setName(this.commandName)
            .setDescription(this.description)
            .addSubcommand(command =>
                command.setName("start")
                    .setDescription("Start a town hall")
                        .addChannelOption(option =>
                            option.setName("channel")
                                .setDescription("The voice channel to hold the town hall")
                                .addChannelTypes(ChannelType.GuildVoice)
                                .setRequired(true))
                        .addIntegerOption(option =>
                            option.setName("reward_duration")
                                .setDescription("The duration to be eligible for the reward, measured in minute")
                                .setRequired(true))
            )
    },

    /**
     * @param  {CommandInteraction} interaction
     */
    async execute(interaction) {
        const guildVoiceContext = myCache.get("VoiceContext");
        const subCommand = interaction.options.getSubcommand();

        if (subCommand == "start"){
            if (Object.keys(guildVoiceContext).length != 0){
                return interaction.reply({
                    content: "Sorry, the town hall is going on now.",
                    components: [
                         new MessageActionRow()
                            .addComponents([
                                new MessageButton()
                                    .setLabel("Jump to the dashboard")
                                    .setEmoji("🔗")
                                    .setStyle("LINK")
                                    .setURL(myCache.get("VoiceContext").messageLink)
                            ]) 
                    ],
                    ephemeral: true
                })
            }else{
                const voiceChannel = interaction.options.getChannel("channel");
                const rewardDuration = interaction.options.getInteger("reward_duration");
                if (rewardDuration <= 0) return interaction.reply({
                    content: "Reward duration cannot be smaller than 1.",
                    ephemeral: true
                });
                let toBeCached = {
                    attendee: {}
                };
                const current = getCurrentTimeMin()
                voiceChannel.members.forEach((member, memberId) => {
                    if (member.user.bot) return;
                    toBeCached["attendee"][memberId] = {
                        timestamp: current,
                        name: member.displayName
                    }
                });

                await interaction.deferReply({ ephemeral: true });

                const msg = await voiceChannel.send({
                    embeds: [
                        new MessageEmbed()
                            .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.avatarURL() })
                            .setTitle("Town Hall Assistant Started")
                            .setDescription(`**Channel**: <#${voiceChannel.id}>\n**Reward Duration**: \`${rewardDuration} mins\`\n**Started**: <t:${current}:f>(<t:${current}:R>)`)
                    ],
                    components: [
                        new MessageActionRow()
                            .addComponents([
                                new MessageButton()
                                    .setCustomId("end")
                                    .setLabel("End this event")
                                    .setEmoji("⏹️")
                                    .setStyle("DANGER")
                            ])
                    ]
                });
                const msgLink = sprintf(CONSTANT.LINK.DISCORD_MSG, {
                    guildId: interaction.guild.id,
                    channelId: voiceChannel.id,
                    messageId: msg.id
                });

                myCache.set("VoiceContext", {
                    attendee: {
                        ...toBeCached.attendee
                    },
                    messageLink: msgLink,
                    hostId: interaction.user.id,
                    channelId: voiceChannel.id,
                    duration: rewardDuration * 60
                })

                return interaction.followUp({
                    content: "Town hall assistant has started.",
                    components: [
                         new MessageActionRow()
                            .addComponents([
                                new MessageButton()
                                    .setLabel("Jump to the dashboard")
                                    .setEmoji("🔗")
                                    .setStyle("LINK")
                                    .setURL(msgLink)
                            ]) 
                    ]
                })
            }
        }
    }

}