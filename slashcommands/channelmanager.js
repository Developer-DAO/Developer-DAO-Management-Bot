const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction, MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const { commandRunCheck, updateDb, awaitWrapSendRequest } = require('../helper/util');
const { sprintf } = require('sprintf-js');
const CONSTANT = require("../helper/const");
const myCache = require("../helper/cache");

require("dotenv").config()

module.exports = {
    commandName: "channelmanager",
    description: "Manage channel",

    data: null,

    generateData() {
        this.data = new SlashCommandBuilder()
            .setName(this.commandName)
            .setDescription(this.description)
            .addSubcommand(command =>
                command.setName("init")
                    .setDescription("Initiate channel management"))
            .addSubcommand(command =>
                command.setName("view")
                    .setDescription("Check current channel status"))
            .addSubcommand(command =>
                command.setName("broadcast")
                    .setDescription("Broadcast predefined messages to channels"))
            .addSubcommand(command =>
                command.setName("send")
                    .setDescription("Send messages to a channel")
                    .addChannelOption(option =>
                        option.setName("channel")
                            .setDescription("Send predefiend messages to this channel and update channel status")
                            .setRequired(true)))
    },

    /**
     * @param  {CommandInteraction} interaction
     */
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        const selected = myCache.get("ChannelsWithoutTopic");

        if (interaction.options.getSubcommand() == "init"){
            if (Object.keys(selected).length == 0) {
                const achieveChannels = myCache.get("GuildSetting").achieve_category_channel;
                if (achieveChannels.length != 0){
                    await interaction.followUp({
                        content: "Channel init starts, please wait for a while."
                    })
                    await this.fetchChannelWithoutDescription(interaction);
                    return interaction.editReply({
                        content: "Channel init is done. Please run \`/channelmanager view\` again to output results"
                    }) 
                }

                const replyMsg = await interaction.followUp({
                    content: "You have not set achieve category channels, would you like set them up first?\n\n✅ **Yes** -- Show you how to add an achieve category.\n\n❌ **No** -- Init channels directly.",
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
                        return interaction.editReply({
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
                                content: "Channel init starts, please wait for a while.",
                                components: []
                            });
                            await this.fetchChannelWithoutDescription(interaction);
                            return interaction.editReply({
                                content: "Channel init is done. Please run \`/channelmanager view\` again to output results"
                            })
                        }
                    }
                });
            }else{
                return interaction.followUp({
                    content: "Sorry, this server has been initiated."
                })
            }
        }

        if (interaction.options.getSubcommand() == "view"){
            if (Object.keys(selected).length == 0){
                return interaction.followUp({
                    content: "Please init channel management first using \`/channelmanager init\`"
                })
            }
            const limit = CONSTANT.BOT_NUMERICAL_VALUE.CHANNEL_VOLUME_PER_MSG;
            const embedContentArray = [];
            Object.keys(selected).forEach((parentId) => {
                let counter = 0
                const channels = selected[parentId];
                const length = Object.keys(channels).length;
                const embedTitle = `Channel Category: ${channels.parentName}`;
                while (true){
                    let channelContents = ``, statusContents = '', lastMsgTimestampContents = '';
                    Object.keys(channels).slice(counter, counter + limit).forEach((channelId) => {
                        //skip `parentName` key
                        if (channelId == "parentName") return;
                        channelContents = channelContents.concat(`> <#${channelId}>\n`);

                        const lastTimestamp = channels[channelId].lastMessageTimestamp;
                        if (lastTimestamp){
                            lastMsgTimestampContents = lastMsgTimestampContents.concat(`> <t:${lastTimestamp}:R>\n`);
                        }else{
                            //fetch failed
                            lastMsgTimestampContents = lastMsgTimestampContents.concat("> \`Unfetchable\`\n");
                        }

                        if (channels[channelId].status){
                            const messageLink = sprintf(CONSTANT.LINK.DISCORD_MSG, {
                                guildId: process.env.GUILDID,
                                channelId: channelId,
                                messageId: channels[channelId].messageId,
                            })
                            statusContents = statusContents.concat(`> [sent](${messageLink}) <t:${channels[channelId].timestamp}:R>\n`);
                        }else{
                            statusContents = statusContents.concat("> \`Unsent\`\n");
                        }
                    });
                    embedContentArray.push([ embedTitle, channelContents, lastMsgTimestampContents, statusContents ])
                    if (counter + limit > length) break;
                    else counter += limit;
                }
            })
            const embedMsgPromiseArray = [];
            embedContentArray.forEach((element, index) => {
                embedMsgPromiseArray.push(
                    interaction.followUp({
                        embeds: [
                            new MessageEmbed()
                                .setTitle(element[0])
                                .addFields([
                                    { name: "📣 Channel", value: element[1], inline: true},
                                    { name: "📨 Last Message", value: element[2], inline: true},
                                    { name: "⚙️ Status", value: element[3], inline: true}
                                ])
                                .setFooter({ text: `Group ${index + 1}` })
                        ],
                        ephemeral: true
                    })
                )
            });
            return await Promise.all(embedMsgPromiseArray)
        }

        if (interaction.options.getSubcommand() == "broadcast"){
            const checkResult = commandRunCheck();
            if (checkResult){
                return interaction.followUp({
                    content: checkResult
                })
            }

            const replyMsg = await interaction.followUp({
                content: "Are you sure that you would like to send a predefined message to all channel without description?",
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
                ]
            });

            const filter = (i) => 1;
            const buttonCollector = replyMsg.createMessageComponentCollector({
                filter,
                max: 1,
                time: CONSTANT.BOT_NUMERICAL_VALUE.CHANNEL_CHECK_BUTTON_COLLECTOR_INTERNAL
            });

            buttonCollector.on("end", async(collected) => {
                if (collected.size == 0){
                    return interaction.editReply({
                        content: "Sorry, time out. Please run this command again.",
                        components: []
                    })
                }else{
                    const btnInteraction = collected.first();
                    await btnInteraction.deferUpdate();
                    if (btnInteraction.customId == "yes"){
                        await interaction.editReply({
                            content: "Broadcast is going on, please wait patiently.",
                            components: []
                        });
                        const predefinedMsg = sprintf(CONSTANT.EMBED_STRING.DESCRIPTION, `<t:${Math.floor(new Date().getTime() / 1000) + 3600 * 48}:R>`);
                        const sendMsgRequestArray = [];
                        const unfetchableChannelArray = [];
                        const cached = myCache.get("ChannelsWithoutTopic");
                        Object.keys(cached).forEach((parentId) => {
                            const channels = cached[parentId];
                            const requestArray = Object.keys(channels).forEach((channelId) => {
                                const channel = interaction.guild.channels.cache.get(channelId);
                                if (!channel) unfetchableChannelArray.push(channels[channelId].channelName)
                            })
                            //to-do
                            // const requests = 
                        })

                    }else{
                        return interaction.editReply({
                            content: "Thanks for using this service, have a nice day!"
                        })
                    }
                }
            });


        }

        //to-do unchecked
        if (interaction.options.getSubcommand() == "send"){
            const checkResult = commandRunCheck();
            if (checkResult) return interaction.followUp({
                content: checkResult
            })

            const targetChannel = interaction.options.getChannel("channel");
            if (targetChannel.type != "GUILD_TEXT") return interaction.followUp({
                content: "Sorry, you have to choose an Text channel"
            })

            const parentId = targetChannel.parentId ?? CONSTANT.CONTENT.CHANNEL_WITHOUT_PARENT_PARENTNAME;
            const cached = myCache.get("ChannelsWithoutTopic");
            let errorFlag = false;
            if(cached[parentId]){
                const message = await targetChannel.send({
                    content: sprintf(CONSTANT.EMBED_STRING.DESCRIPTION, `<t:${Math.floor(new Date().getTime() / 1000) + 3600 * 48}:R>`)
                });

                //to-do re-setup timer
                const channelRecord = cached[parentId][targetChannel.id];
                if (channelRecord){
                    cached[parentId][targetChannel.id] = {
                        ...channelRecord,
                        status: true,
                        messageId: message.id,
                        timestamp: Math.floor(message.createdTimestamp / 1000)
                    }
                }else errorFlag = true;
            }else errorFlag = true;

            //is it possible that we cannot find this channel in our cache? which means someplace is wrong
            if (errorFlag) {
                return interaction.followUp({
                    content: "Sorry, this channel is not under management."
                })
            }

            await updateDb("channelsWithoutTopic", cached);
            myCache.set("ChannelsWithoutTopic", cached);

        }
    },

    //to-do remove bot command
    /**
     * @param  {CommandInteraction} interaction
     */
    async fetchChannelWithoutDescription(interaction){
        let channels = await interaction.guild.channels.fetch();
        const result = {}
        channels = channels.filter((channel) => (
            channel.type == "GUILD_TEXT" && !channel.topic 
        ));
        for (const channel of channels.values()){
            const messages = await channel.messages.fetch({
                limit: 1
            });
            let lastMsgTime;
            if (messages.size == 0) lastMsgTime = 0;
            else lastMsgTime = Math.floor(messages.first().createdTimestamp / 1000);
            const parentId = channel.parentId ?? CONSTANT.CONTENT.CHANNEL_WITHOUT_PARENT_PARENTNAME;
            if (parentId in result){
                result[parentId][channel.id] = {
                    channelName: channel.name,
                    status: false,
                    messageId: "",
                    timestamp: 0,
                    lastMessageTimestamp: lastMsgTime
                }
            }else{
                result[parentId] = {
                    parentName: parentId != 
                        CONSTANT.CONTENT.CHANNEL_WITHOUT_PARENT_PARENTNAME ? channel.parent.name : "Without Category Channel"
                };
                result[parentId][channel.id] = {
                    channelName: channel.name,
                    status: false,
                    messageId: "",
                    timestamp: 0,
                    lastMessageTimestamp: lastMsgTime
                }
            }
        }
        await updateDb("channelsWithoutTopic", result);
        myCache.set("ChannelsWithoutTopic", result);
    }

}