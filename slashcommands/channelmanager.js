const { SlashCommandBuilder } = require('@discordjs/builders');
const { ChannelType, ComponentType } = require("discord-api-types/payloads/v10");
const { CommandInteraction, MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const { commandRunCheck, updateDb, awaitWrapSendRequest, awaitWrap } = require('../helper/util');
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
            .addSubcommandGroup(group =>
                group.setName("set")
                    .setDescription("Onboarding management setting")
                    .addSubcommand(command =>
                        command.setName("notification")
                            .setDescription("Set a notification channel")
                            .addChannelOption(option =>
                                option.setName("channel")
                                    .setDescription("The channel for notification")
                                    .addChannelTypes(ChannelType.GuildText)
                                    .setRequired(true)))
                    .addSubcommand(command =>
                        command.setName("archive")
                            .setDescription("Add an archive channel category")
                            .addChannelOption(option =>
                                option.setName("channel")
                                    .setDescription("The channel category for archive")
                                    .addChannelTypes(ChannelType.GuildCategory)
                                    .setRequired(true)))
                
            )
            .addSubcommandGroup(group =>
                group.setName("view")
                    .setDescription("Check current channel status")
                    .addSubcommand(command =>
                        command.setName("all")
                            .setDescription("Read all channel status"))
                    .addSubcommand(command =>
                        command.setName("category")
                            .setDescription("Read channel status of a category channel")
                            .addChannelOption(option =>
                                option.setName("channel")
                                    .setDescription("The channel category")
                                    .addChannelTypes(ChannelType.GuildCategory)
                                    .setRequired(true)))
            )
            .addSubcommand(command =>
                command.setName("read")
                    .setDescription("Read current settings of channel management"))
            .addSubcommand(command =>
                command.setName("init")
                    .setDescription("Initiate channel management"))
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
        //to-do view two version: 1. choose category 2. view all using page style
        if (interaction.options.getSubcommand() == "read"){
            let { notification_channel, archive_category_channel } = myCache.get("GuildSetting");
            notification_channel = notification_channel ? `<#${notification_channel}>` : "\`Unavailable\`";

            archive_category_channel = archive_category_channel.map(value => `<#${value}>\n`);
            if (archive_category_channel.length == 0) archive_category_channel = "\`Unavailable\`";
            else archive_category_channel = archive_category_channel.toString().replaceAll(',', '');
            
            return interaction.reply({
                embeds: [
                    new MessageEmbed()
                        .setTitle(`${interaction.guild.name} Channel Manager Setting`)
                        .addFields([
                            { name: "Notification Channel", value: notification_channel },
                            { name: "Archive Channels", value: archive_category_channel}
                        ])
                ],
                ephemeral: true
            })
        }

        if (interaction.options.getSubcommand() == "init"){
            await interaction.deferReply({ ephemeral: true });
            const selected = myCache.get("ChannelsWithoutTopic");
            if (Object.keys(selected).length == 0) {
                const achieveChannels = myCache.get("GuildSetting").archive_category_channel;
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
                                content: "Please use \`/set archive_category_channel\` command to add an achieve category channel",
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
            return
        }

        if (interaction.options.getSubcommand() == "broadcast"){
            const checkResult = commandRunCheck();
            if (checkResult){
                return interaction.reply({
                    content: checkResult,
                    ephemeral: true
                })
            }
            await interaction.deferReply({ ephemeral: true });

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

            let changedComponents = replyMsg.components;
            changedComponents[0].components.forEach((value) => {
                value.disabled = true;
            }) 

            buttonCollector.on("end", async(collected) => {
                if (collected.size == 0){
                    return interaction.editReply({
                        content: "Sorry, time out. Please run this command again.",
                        components: changedComponents
                    })
                }else{
                    const btnInteraction = collected.first();
                    await btnInteraction.deferUpdate();
                    if (btnInteraction.customId == "yes"){
                        await interaction.editReply({
                            content: "Broadcast is going on, please wait patiently.",
                            components: changedComponents
                        });
                        const predefinedMsg = sprintf(CONSTANT.EMBED_STRING.DESCRIPTION, `<t:${Math.floor(new Date().getTime() / 1000) + 3600 * 48}:R>`);
                        const sendMsgRequestArray = [];
                        const unfetchableChannelNameArray = [];
                        let unfetchableChannelNameContent = '';
                        let failSendMsgChannelIdContent = '';
                        let cached = myCache.get("ChannelsWithoutTopic");
                        let broadcastResult = {};
                        for (const parentId in cached){
                            const channels = cached[parentId];
                            for (const channelId in channels){
                                if (channelId == "parentName") continue;

                                const channel = interaction.guild.channels.cache.get(channelId);
                                broadcastResult[channelId] = '';
                                if (!channel) unfetchableChannelNameArray.push(channels[channelId].channelName);
                                else {
                                    sendMsgRequestArray.push(
                                        awaitWrapSendRequest(
                                            channel.send({ content: predefinedMsg }),
                                            channel.id
                                        )
                                    )
                                }
                            }
                        }

                        let {result, error} = await awaitWrap(Promise.all(sendMsgRequestArray));

                        if (error) interaction.editReply({
                            content: `Broadcast failed, error occured: \`${error}\``,
                            components: changedComponents
                        })

                        result.forEach((value) => {
                            if (value.error) failSendMsgChannelIdContent += `> <#${value.value}>\n`;
                            else broadcastResult[value.channelId] = {
                                messageId: value.messageId,
                                timestamp: value.value
                            };
                        });

                        if (failSendMsgChannelIdContent == '') failSendMsgChannelIdContent = '> -'

                        if (unfetchableChannelNameArray.length == 0) unfetchableChannelNameContent = '> -';
                        else unfetchableChannelNameArray.forEach((value) => {
                            unfetchableChannelNameContent += `> \`${value}\`\n`
                        })

                        cached = myCache.get("ChannelsWithoutTopic");
                        Object.keys(cached).forEach((parentId) => {
                            const channels = cached[parentId];
                            Object.keys(channels).forEach((channelId) => {
                                if (broadcastResult[channelId]){
                                    cached[parentId][channelId] = {
                                        ...cached[parentId][channelId],
                                        status: true,
                                        messageId: broadcastResult[channelId].messageId,
                                        timestamp: broadcastResult[channelId].timestamp,
                                        lastMessageTimestamp: broadcastResult[channelId].timestamp
                                    }
                                }
                            })
                        });

                        myCache.set("ChannelsWithoutTopic", cached);

                        return interaction.editReply({
                            embeds: [
                                new MessageEmbed()
                                    .setTitle("📣 Broadcast Report")
                                    .setDescription("**Unfetchable**: The bot cannot fetch information of these channels.\n\n**Unsendable**: The bot cannot send messages to these channels with unknown reason.")
                                    .addFields([
                                        { name: "Unfetchable Channel", value: unfetchableChannelNameContent, inline: true },
                                        { name: "Fail to send", value: failSendMsgChannelIdContent, inline: true },
                                    ])
                            ],
                            components: [],
                            content: 'Broadcast is done, please run \`/channelmanager view\` again to view results'
                        })
                    }else{
                        return interaction.editReply({
                            content: "Thanks for using this service, have a nice day!",
                            components: []
                        })
                    }
                }
            });
            return
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

            const parentId = targetChannel.parentId ?? CONSTANT.CONTENT.CHANNEL_WITHOUT_PARENT_PARENTID;
            const cached = myCache.get("ChannelsWithoutTopic");

            if (!cached[parentId] || !cached[parentId][targetChannel.id]) return interaction.followUp({
                content: "Sorry, this channel is not under management."
            })

            const channelRecord = cached[parentId][targetChannel.id];
            await interaction.deferReply({ ephemeral: true });

            const result = await awaitWrapSendRequest(targetChannel.send({
                content: sprintf(CONSTANT.EMBED_STRING.DESCRIPTION, `<t:${Math.floor(new Date().getTime() / 1000) + 3600 * 48}:R>`)
            }))

            if (result.error) return interaction.followUp({
                content: "Sorry, I cannot send message to this channel"
            })

            //to-do re-setup timer
            cached[parentId][targetChannel.id] = {
                ...channelRecord,
                status: true,
                messageId: message.id,
                timestamp: Math.floor(message.createdTimestamp / 1000)
            }

            //await updateDb("channelsWithoutTopic", cached);
            myCache.set("ChannelsWithoutTopic", cached);
            return
        }

        if (interaction.options.getSubcommandGroup() == "set"){
            const subCommandName = interaction.options.getSubcommand();
            if (subCommandName == "notification"){
                const targetChannel = interaction.options.getChannel("channel");

                if (targetChannel.id == myCache.get("GuildSetting").notification_channel){
                    return interaction.reply({
                        content: sprintf("<#%s> is set as Notification Channel", targetChannel.id),
                        ephemeral: true
                    })
                }

                await updateDb("notification_channel", targetChannel.id)
                
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

            if (subCommandName == "archive"){

                const targetChannel = interaction.options.getChannel("channel");
                const currentCache = myCache.get("GuildSetting");

                if (currentCache.archive_category_channel.includes(targetChannel.id)){
                    return interaction.reply({
                        content: sprintf("<#%s> has been added into achieve parent channels", targetChannel.id),
                        ephemeral: true
                    })
                }
                const newAchieveParentChannel = [...currentCache.archive_category_channel, targetChannel.id];
                await updateDb("archive_category_channel", newAchieveParentChannel);

                myCache.set("GuildSetting", {
                    ...currentCache,
                    archive_category_channel: newAchieveParentChannel
                })

                return interaction.reply({
                    content: sprintf("<#%s> has been added into achieve parent channels", targetChannel.id),
                    ephemeral: true
                })
            }
        }

        //Partition for one category, like maybe one category have many channels without description, it may exceed byte limits
        if (interaction.options.getSubcommandGroup() == "view"){
            const subCommandName = interaction.options.getSubcommand();
            await interaction.deferReply({ ephemeral: true });
            const selected = myCache.get("ChannelsWithoutTopic");
            if (Object.keys(selected).length == 0){
                return interaction.followUp({
                    content: "Please init channel management first using \`/channelmanager init\`"
                })
            }

            const embedFieldsFactory = (channels) => {
                let channelField = '', lasMsgTimeField = '', statusField = '';
                Object.keys(channels).forEach((channelId) => {
                    //skip `parentName` key
                    if (channelId == "parentName") return;
                    channelField = channelField.concat(`> <#${channelId}>\n`);

                    const lastTimestamp = channels[channelId].lastMessageTimestamp;
                    if (lastTimestamp){
                        lasMsgTimeField = lasMsgTimeField.concat(`> <t:${lastTimestamp}:R>\n`);
                    }else{
                        //fetch failed
                        lasMsgTimeField = lasMsgTimeField.concat("> \`Unfetchable\`\n");
                    }

                    if (channels[channelId].status){
                        const messageLink = sprintf(CONSTANT.LINK.DISCORD_MSG, {
                            guildId: interaction.guild.id,
                            channelId: channelId,
                            messageId: channels[channelId].messageId,
                        })
                        statusField = statusField.concat(`> [Sent](${messageLink}) (<t:${channels[channelId].timestamp}:R>)\n`);
                    }else{
                        statusField = statusField.concat("> \`Unsent\`\n");
                    }
                });
                return [channelField, lasMsgTimeField, statusField]
            }
            
            if (subCommandName == "all"){
                const embedContentArray = [];
                Object.keys(selected).forEach((parentId, index) => {
                    const channels = selected[parentId];
                    const embedTitle = `Channel Category: ${channels.parentName}`;
                    const [channelField, lasMsgTimeField, statusField] = embedFieldsFactory(channels);
                    embedContentArray.push([
                        new MessageEmbed()
                            .setTitle(embedTitle)
                            .addFields([
                                { name: "📣 Channel", value: channelField, inline: true},
                                { name: "📨 Last Message", value: lasMsgTimeField, inline: true},
                                { name: "⚙️ Status", value: statusField, inline: true}
                            ])
                            .setFooter({ text: `Group ${index + 1}` })
                        ]);
                });

                const buttonGenerator = (index) => {
                    return [
                        new MessageActionRow()
                            .addComponents([
                                new MessageButton()
                                    .setCustomId("first")
                                    .setLabel("First Page")
                                    .setEmoji("⏮️")
                                    .setStyle("PRIMARY"),
                                new MessageButton()
                                    .setCustomId("previous")
                                    .setEmoji("⬅️")
                                    .setStyle("SECONDARY")
                                    .setDisabled(index == 0),
                                new MessageButton()
                                    .setCustomId("next")
                                    .setEmoji("➡️")
                                    .setStyle("SECONDARY")
                                    .setDisabled(index == embedContentArray.length - 1),
                                new MessageButton()
                                    .setCustomId("last")
                                    .setLabel("Last Page")
                                    .setEmoji("⏭️")
                                    .setStyle("PRIMARY")
                            ])
                    ]
                };
                let page = 0;
                const filter = (i) => (true);
                const msg = await interaction.followUp({
                    embeds: embedContentArray[page],
                    components: buttonGenerator(page),
                });

                const collector = msg.createMessageComponentCollector({
                    filter,
                    time: CONSTANT.BOT_NUMERICAL_VALUE.VIEW_CHANNEL_DURATION,
                    componentType: ComponentType.Button
                });

                collector.on("collect", async(btnInteraction) => {
                    if (!btnInteraction) return;
                    switch (btnInteraction.customId) {
                        case "next":
                            page++;
                            break;
                        case "previous":
                            page--;
                            break;
                        case "first":
                            page = 0;
                            break;
                        case "last":
                            page = embedContentArray.length - 1;
                    }
                    await interaction.editReply({
                        embeds: embedContentArray[page],
                        components: buttonGenerator(page),
                    });
                    await btnInteraction.deferUpdate();
                });

                collector.on("end", async(collected) => {
                    await interaction.editReply({
                        embeds: msg.embeds,
                        components: []
                    })
                })

            }else{
                //to-do auto String
                //to-do remember to allow users to check channels without a parent
                //category channel id
                const { id } = interaction.options.getChannel("channel");
                const result = selected[id];
                if (!result) return interaction.followUp({
                    content: "Sorry, the category channel you chose does not have channels without description.",
                })

                const [channelField, lasMsgTimeField, statusField] = embedFieldsFactory(result);
                return interaction.followUp({
                    embeds: [
                        new MessageEmbed()
                            .setTitle(`Channel Category: ${result.parentName}`)
                            .addFields([
                                { name: "📣 Channel", value: channelField, inline: true},
                                { name: "📨 Last Message", value: lasMsgTimeField, inline: true},
                                { name: "⚙️ Status", value: statusField, inline: true}
                            ])
                    ]
                })

            }
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
            const parentId = channel.parentId ?? CONSTANT.CONTENT.CHANNEL_WITHOUT_PARENT_PARENTID;
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
                        CONSTANT.CONTENT.CHANNEL_WITHOUT_PARENT_PARENTID ? channel.parent.name : CONSTANT.CONTENT.CHANNEL_WITHOUT_PARENT_PARENTNAME
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