const { SlashCommandBuilder } = require('@discordjs/builders');
const { ChannelType, ComponentType, PermissionFlagsBits } = require("discord-api-types/payloads/v10");
const { CommandInteraction, MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const { commandRunCheck, updateDb, awaitWrapSendRequest, awaitWrap, getParentInform, getNotificationMsg } = require('../helper/util');
const { sprintf } = require('sprintf-js');

const CONSTANT = require("../helper/const");
const myCache = require("../helper/cache");
const _ = require("lodash")

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
                            .addStringOption(option =>
                                option.setName("channel")
                                    .setDescription("The channel category")
                                    .setAutocomplete(true)
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
                            .addChannelTypes(ChannelType.GuildText)
                            .setRequired(true)))
            .addSubcommand(command =>
                command.setName("archive")
                    .setDescription("Archive all channels"))
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
                    try{
                        await this.fetchChannelWithoutDescription(interaction);
                        return interaction.editReply({
                            content: "Channel init is done. Please run \`/channelmanager view\` again to output results"
                        }) 
                    }catch(err){
                        return interaction.editReply({
                            content: "Error occurs when channel init, please contact admins."
                        }) 
                    }
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
                            try{
                                await this.fetchChannelWithoutDescription(interaction);
                                return interaction.editReply({
                                    content: "Channel init is done. Please run \`/channelmanager view\` again to output results"
                                }) 
                            }catch(err){
                                return interaction.editReply({
                                    content: "Error occurs when channel init, please contact admins."
                                }) 
                            }
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
            if (checkResult) return interaction.reply({
                content: checkResult,
                ephemeral: true
            })
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
                                            channel.send({ content: getNotificationMsg(channel.id, Math.floor(new Date().getTime() / 1000) + CONSTANT.BOT_NUMERICAL_VALUE.EXPIRY_TIME) }),
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
                                        timestamp: broadcastResult[channelId].timestamp + CONSTANT.BOT_NUMERICAL_VALUE.EXPIRY_TIME,
                                        lastMessageTimestamp: broadcastResult[channelId].timestamp
                                    }
                                }
                            })
                        });
                        await updateDb("channelsWithoutTopic", cached);
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
            if (checkResult) return interaction.reply({
                content: checkResult,
                ephemeral: true
            })

            const targetChannel = interaction.options.getChannel("channel");

            const parentId = targetChannel.parentId ?? CONSTANT.CONTENT.CHANNEL_WITHOUT_PARENT_PARENTID;
            let cached = myCache.get("ChannelsWithoutTopic");

            if (!cached[parentId] || !cached[parentId][targetChannel.id]) return interaction.reply({
                content: "Sorry, this channel is not under management.",
                ephemeral: true
            })
            await interaction.deferReply({ ephemeral: true });

            const result = await awaitWrapSendRequest(targetChannel.send({
                content: getNotificationMsg(targetChannel.id, Math.floor(new Date().getTime() / 1000) + CONSTANT.BOT_NUMERICAL_VALUE.EXPIRY_TIME)
            }), targetChannel.id)

            if (result.error) return interaction.followUp({
                content: "Sorry, I cannot send message to this channel"
            })

            cached[parentId][targetChannel.id] = {
                channelName: targetChannel.name,
                status: true,
                messageId: result.messageId,
                timestamp: result.value + CONSTANT.BOT_NUMERICAL_VALUE.EXPIRY_TIME,
                lastMessageTimestamp: result.value
            }

            await updateDb("channelsWithoutTopic", cached);
            myCache.set("ChannelsWithoutTopic", cached);
            const messageLink = sprintf(CONSTANT.LINK.DISCORD_MSG, {
                guildId: interaction.guild.id,
                channelId: targetChannel.id,
                messageId: result.messageId,
            })
            return interaction.followUp({
                content: `Message has been sent to <#${targetChannel.id}>, click [here](${messageLink}) to check the message.`
            })
        }

        if (interaction.options.getSubcommand() == "archive"){
            //to-do archive channel permission checking
            const checkResult = commandRunCheck();
            if (checkResult) return interaction.reply({
                content: checkResult,
                ephemeral: true
            });
            //to-do auto archive
            //to-do using archive_status to auto archive
            const { 
                notification_channel, 
                archive_channels, 
                archive_status, 
                archive_category_channel 
            } = myCache.get("GuildSetting");

            if (!notification_channel) return interaction.reply({
                content: "Please set up a notification channel first",
                ephemeral: true
            })
            const guildChannelManager = interaction.guild.channels;
            let cached = myCache.get("ChannelsWithoutTopic");
            const current = Math.floor(new Date().getTime() / 1000);
            let toBeArchived = [];
            for (const parentId in cached){
                const channels = cached[parentId];
                toBeArchived.push(
                    ...Object.keys(channels).filter((channelId) => {
                        if (channelId == "parentName") return false;
                        if (channels[channelId].timestamp != 0 && current > channels[channelId].timestamp) return true;
                        else return false
                    }).map((channelId) => ({
                        parentId: parentId,
                        channelId: channelId
                    }))
                )
            };
            if (toBeArchived.length == 0) return interaction.reply({
                content: "No channel needs to be archived.",
                ephemeral: true
            })

            const length = toBeArchived.length;
            const notificationChannel = guildChannelManager.cache.get(notification_channel);
            const limit = CONSTANT.BOT_NUMERICAL_VALUE.ARCHIVE_CHANNEL_CHILD_LIMIT;
            let counter = 0;
            let failChannels = [], successChannels = [];
            await interaction.deferReply({ ephemeral: true });
            while (true){
                const archiveChanneJSON = _.last(archive_channels);
                let remainingSpace, targetArchieveChannelId;
                if (!archiveChanneJSON || archiveChanneJSON.remaining == 0){
                    const archiveChannel = await guildChannelManager.create(sprintf(CONSTANT.CONTENT.ARCHIVE_CHANNEL_NAME_TEMPLATE, archive_channels.length + 1), {
                        type: "GUILD_CATEGORY",
                        permissionOverwrites: [
                            {
                                id: interaction.guild.id,
                                deny: [PermissionFlagsBits.ViewChannel]
                            }
                            //to-do deny dev to view this channel
                        ]
                    });
                    archive_channels.push({
                        id: archiveChannel.id,
                        remaining: limit
                    });
                    targetArchieveChannelId = archiveChannel.id;
                    remainingSpace = limit;
                }else{
                    targetArchieveChannelId = archiveChanneJSON.id
                    remainingSpace = archiveChanneJSON.remaining;
                }
                let moveCounter = 0;
                for (const { parentId, channelId } of toBeArchived.slice(counter, counter + remainingSpace)){
                    const channel = guildChannelManager.cache.get(channelId);
                    if (!channel) return failChannels.push({
                        parentId: parentId,
                        channelId: channelId
                    })

                    const { result, error } = await awaitWrap(channel.setParent(targetArchieveChannelId, {
                        lockPermissions: true,
                        reason: "Inactive Channel"
                    }));

                    if (error) return failChannels.push({
                        parentId: parentId,
                        channelId: channelId,
                    })

                    successChannels.push({
                        parentId: parentId,
                        channelId: channelId,
                        currentParentId: targetArchieveChannelId
                    })
                    moveCounter ++;
                }
                archive_channels.splice(archive_channels.length - 1, 1, {
                    id: targetArchieveChannelId,
                    remaining: remainingSpace - moveCounter
                });
                if ( counter + remainingSpace > length ) break;
                counter += remainingSpace;
            }

            const toBeCachedArchiveCategoryChannel = _.uniq([...archive_category_channel, ...archive_channels.map(({id}) => (id))]);
            await updateDb("archive_channels", archive_channels);
            await updateDb("archive_category_channel", toBeCachedArchiveCategoryChannel);
            myCache.set("GuildSetting", {
                ...myCache.get("GuildSetting"),
                archive_channels: archive_channels,
                archive_category_channel: toBeCachedArchiveCategoryChannel
            });

            cached = myCache.get("ChannelsWithoutTopic");
            successChannels.forEach(({ parentId, channelId }) => {
                delete cached[parentId][channelId];
                //Only 'parentName' attribute
                if (Object.keys(cached[parentId]).length == 1){
                    delete cached[parentId];
                }
            });
            await updateDb("channelsWithoutTopic", cached);
            myCache.set("ChannelsWithoutTopic", cached);

            let failChannelsField = '> -', failChannelsParentsField = '> -';
            let successChannelsField = '> -', successChannelsParentsField = '> -', successChannelsPreviousParentsField = '> -';
            successChannels.forEach(({ parentId, channelId, currentParentId }, index) => {
                if (index == 0) {
                    successChannelsField = '';
                    successChannelsParentsField = '';
                    successChannelsPreviousParentsField = '';
                };
                successChannelsField += `<#${channelId}>\n`;
                successChannelsParentsField += `<#${currentParentId}>\n`;
                successChannelsPreviousParentsField += `<#${parentId}>\n`;
            })
            failChannels.forEach(({parentId, channelId}, index) => {
                if (index == 0) {
                    failChannelsField = '';
                    failChannelsParentsField = '';
                }
                failChannelsField += `<#${channelId}>\n`; 
                failChannelsParentsField += `<#${parentId}>\n`; 
            });
            //to-do consider the bytes exceeding the limit partition needed
            await notificationChannel.send({
                embeds: [
                    new MessageEmbed()
                        .setTitle("Archive Success Report")
                        .addFields([
                            { name: 'Channel', value: successChannelsField, inline: true },
                            { name: 'Current Parent', value: successChannelsParentsField, inline: true },
                            { name: 'Previous Parent', value: successChannelsPreviousParentsField, inline: true },
                        ]),
                    new MessageEmbed()
                        .setTitle("Archive Fail Report")
                        .addFields([
                            { name: 'Channel', value: failChannelsField, inline: true },
                            { name: 'Current Parent', value: failChannelsParentsField, inline: true },
                        ]),
                ]
            })
            return interaction.followUp({
                content: `Done, results has been sent to <#${notification_channel}>`
            })
        }   

        if (interaction.options.getSubcommandGroup() == "set"){
            const subCommandName = interaction.options.getSubcommand();
            if (subCommandName == "notification"){
                const targetChannel = interaction.options.getChannel("channel");

                if (!targetChannel.topic) return interaction.reply({
                    content: "Sorry, you cannot set a channel without description as a notification channel.",
                    ephemeral: true
                })

                if (targetChannel.id == myCache.get("GuildSetting").notification_channel){
                    return interaction.reply({
                        content: sprintf("<#%s> is set as Notification Channel", targetChannel.id),
                        ephemeral: true
                    })
                }
                await interaction.deferReply({ ephemeral: true });
                const { result, error } = await awaitWrap(targetChannel.send({
                    content: "This channel has been set as Notification Channel"
                }))

                if (error) return interaction.followUp({
                    content: `Missing Permission: Check permission of this <#${targetChannel.id}>`
                })

                if (!targetChannel.topic) return interaction.followUp({
                    content: `<#${targetChannel.id}> does not have a topic. Please choose a channel with Topic.`
                })

                await updateDb("notification_channel", targetChannel.id)
                
                myCache.set("GuildSetting", {
                    ...myCache.get("GuildSetting"),
                    notification_channel: targetChannel.id
                })

                return interaction.followUp({
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
            const checkResult = commandRunCheck();
            if (checkResult) return interaction.reply({
                content: checkResult,
                ephemeral: true
            })

            const subCommandName = interaction.options.getSubcommand();
            await interaction.deferReply({ ephemeral: true });
            const selected = myCache.get("ChannelsWithoutTopic");
            const embedFieldsFactory = (channels) => {
                let channelFields = [], lastMsgTimeFields = [], statusFields = [];
                //to-do why limit set 8 but get 7?
                const limit = CONSTANT.BOT_NUMERICAL_VALUE.EMBED_CONTENT_LIMIT;
                const length = Object.keys(channels).length;
                let counter = 0;
                while (true){
                    let channelField = '', lastMsgTimeField = '', statusField = '';
                    Object.keys(channels).slice(counter, counter + limit).forEach((channelId) => {
                        if (channelId == "parentName") return;
                        channelField = channelField.concat(`> <#${channelId}>\n`);

                        const lastTimestamp = channels[channelId].lastMessageTimestamp;
                        if (lastTimestamp){
                            lastMsgTimeField = lastMsgTimeField.concat(`> <t:${lastTimestamp}:R>\n`);
                        }else{
                            //fetch failed
                            lastMsgTimeField = lastMsgTimeField.concat("> \`Unfetchable\`\n");
                        }

                        if (channels[channelId].status){
                            const messageLink = sprintf(CONSTANT.LINK.DISCORD_MSG, {
                                guildId: interaction.guild.id,
                                channelId: channelId,
                                messageId: channels[channelId].messageId,
                            })
                            statusField = statusField.concat(`> [Archived](${messageLink}) <t:${channels[channelId].timestamp}:R>\n`);
                        }else{
                            statusField = statusField.concat("> \`Unsent\`\n");
                        }
                    })
                    channelFields.push(channelField);
                    lastMsgTimeFields.push(lastMsgTimeField);
                    statusFields.push(statusField);
                    if (counter + limit > length) break;
                    counter += limit;
                }
                return [channelFields, lastMsgTimeFields, statusFields];
            }
            
            if (subCommandName == "all"){
                let embedContentArray = [];
                let pageIndex = 1;
                Object.keys(selected).forEach((parentId) => {
                    const channels = selected[parentId];
                    const embedTitle = `Channel Category: ${channels.parentName}`;
                    const [channelFields, lastMsgTimeFields, statusFields] = embedFieldsFactory(channels);
                    embedContentArray = [
                        ...embedContentArray,
                        ...channelFields.map((value, index) => (
                            [
                                new MessageEmbed()
                                    .setTitle(embedTitle)
                                    .addFields([
                                        { name: "📣 Channel", value: value, inline: true},
                                        { name: "📨 Last Message", value: lastMsgTimeFields[index], inline: true},
                                        { name: "⚙️ Status", value: statusFields[index], inline: true}
                                    ])
                                    .setFooter({ text: `Group ${pageIndex ++}` })
                            ]
                        ))
                    ]
                });

                const buttonGenerator = (index) => {
                    return [
                        new MessageActionRow()
                            .addComponents([
                                new MessageButton()
                                    .setCustomId("first")
                                    .setLabel("First Page")
                                    .setEmoji("⏮️")
                                    .setStyle("PRIMARY")
                                    .setDisabled(index == 0),
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
                                    .setDisabled(index == embedContentArray.length - 1)
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
                    //to-do partition
                    await interaction.editReply({
                        embeds: embedContentArray[page],
                        components: buttonGenerator(page),
                    });
                    return btnInteraction.deferUpdate();
                });

                collector.on("end", async(collected) => {
                    await interaction.editReply({
                        embeds: msg.embeds,
                        components: []
                    })
                })
            }else{
                const id = interaction.options.getString("channel");
                const result = selected[id];
                if (!result) return interaction.followUp({
                    content: "Please input a valid input."
                })
                const [channelFields, lasMsgTimeFields, statusFields] = embedFieldsFactory(result);
                
                return interaction.followUp({
                    embeds: channelFields.map((value, index) => (
                                new MessageEmbed()
                                    .setTitle(`Channel Category: ${result.parentName}`)
                                    .addFields([
                                        { name: "📣 Channel", value: value, inline: true},
                                        { name: "📨 Last Message", value: lasMsgTimeFields[index], inline: true},
                                        { name: "⚙️ Status", value: statusFields[index], inline: true}
                                    ])
                            ))
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
        const scanResult = {}
        channels = channels.filter((channel) => (
            channel.type == "GUILD_TEXT" && !channel.topic 
        ));
        let channelInform = [];
        let fetchMsgPromise = [];
        Array.from(channels.values()).forEach((channel) => {
            fetchMsgPromise.push(awaitWrap(channel.messages.fetch({
                limit: 1
            }), "messages"));
            channelInform.push({
                channelId: channel.id,
                channelName: channel.name,
                ...getParentInform(channel.parentId, channel.parent)
            })
        });
        const results = await Promise.all(fetchMsgPromise);
        results.forEach((result, index) => {
            const { error, messages } = result;
            let lastMsgTime;
            if (error) lastMsgTime = 0;
            else {
                if (messages.size == 0) lastMsgTime = 0;
                else lastMsgTime = Math.floor(messages.first().createdTimestamp / 1000);
            }
            const { channelId, parentId, parentName, channelName } = channelInform[index];
            if (parentId in scanResult){
                scanResult[parentId][channelId] = {
                    channelName: channelName,
                    status: false,
                    messageId: "",
                    timestamp: 0,
                    lastMessageTimestamp: lastMsgTime
                }
            }else{
                scanResult[parentId] = {
                    parentName: parentName
                };
                scanResult[parentId][channelId] = {
                    channelName: channelName,
                    status: false,
                    messageId: "",
                    timestamp: 0,
                    lastMessageTimestamp: lastMsgTime
                }
            }

        })
        await updateDb("channelsWithoutTopic", scanResult);
        myCache.set("ChannelsWithoutTopic", scanResult);
    }

}