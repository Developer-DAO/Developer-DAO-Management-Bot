const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction, MessageEmbed } = require("discord.js");
const { ChannelType } = require("discord-api-types/payloads/v10");
const { updateDb } = require('../helper/util');
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
            .addSubcommandGroup(group =>
                group.setName("channel")
                    .setDescription("Set different channels")
                    .addSubcommand(command =>
                        command.setName("birthday")
                            .setDescription("Set birthday channel")
                            .addChannelOption(option =>
                                option.setName("channel")
                                    .setDescription("Choose a channel")
                                    .addChannelTypes(ChannelType.GuildText)
                                    .setRequired(true)))
            )
            .addSubcommandGroup(group =>
                group.setName("admin_role")
                    .setDescription("Admin Rolesetting")
                    .addSubcommand(command =>
                        command.setName("add")
                            .setDescription("Add an Admin Role")
                            .addRoleOption(option =>
                                option.setName("role")
                                    .setDescription("Choose a role")
                                    .setRequired(true)))
                    .addSubcommand(command =>
                        command.setName("remove")
                            .setDescription("Add an Admin Role")
                            .addStringOption(option =>
                                option.setName("role")
                                    .setDescription("Remove a role")
                                    .setAutocomplete(true)
                                    .setRequired(true)))
            )
            .addSubcommandGroup(group =>
                group.setName("admin_member")
                    .setDescription("Admin Member setting")
                    .addSubcommand(command =>
                        command.setName("add")
                            .setDescription("Add an Admin")
                            .addUserOption(option =>
                                option.setName("member")
                                    .setDescription("Choose a member")
                                    .setRequired(true)))
                    .addSubcommand(command =>
                        command.setName("remove")
                            .setDescription("Add an Admin Member")
                            .addStringOption(option =>
                                option.setName("member")
                                    .setDescription("Remove a member")
                                    .setAutocomplete(true)
                                    .setRequired(true)))
            )
            .addSubcommandGroup(group =>
                group.setName("admin_command")
                    .setDescription("Admin Command setting")
                    .addSubcommand(command =>
                        command.setName("add")
                            .setDescription("Add an Admin Command")
                            .addStringOption(option =>
                                option.setName("command")
                                    .setDescription("Choose a command")
                                    .setRequired(true)))
                    .addSubcommand(command =>
                        command.setName("remove")
                            .setDescription("Add an Admin Command")
                            .addStringOption(option =>
                                option.setName("command")
                                    .setDescription("Remove a command")
                                    .setAutocomplete(true)
                                    .setRequired(true)))
            )
            .addSubcommand(command =>
                command.setName("read")
                    .setDescription("Read current guild setting"))
    },

    /**
     * @param  {CommandInteraction} interaction
     */
    async execute(interaction) {

        if (interaction.options.getSubcommand() == "read"){
            const { admin_role, admin_member, admin_command } = myCache.get("GuildSetting");
            //let roleField = '', memberField = '', commandField = '';
            const roleField = admin_role.reduce((pre, cur, index) => {
                if (index == 0) pre = '';
                return pre + `<@&${cur}>\n`
            }, '> -');
            const memberField = admin_member.reduce((pre, cur, index) => {
                if (index == 0) pre = '';
                return pre + `<@${cur}>\n`
            }, '> -');
            const commandField = admin_command.reduce((pre, cur, index) => {
                if (index == 0) pre = '';
                return pre + `\`${cur}\`\n`
            }, '> -');

            return interaction.reply({
                embeds: [
                    new MessageEmbed()
                        .setTitle(`${interaction.guild.name} Admin Dashboard`)
                        .addFields([
                            {
                                name: "Admin Role",
                                value: roleField,
                                inline: true
                            },
                            {
                                name: "Admin Member",
                                value: memberField,
                                inline: true
                            },
                            {
                                name: "Admin Command",
                                value: commandField,
                                inline: true
                            },
                        ])
                ],
                ephemeral: true
            })
        }

        const subCommandGroup = interaction.options.getSubcommandGroup();
        const subCommand = interaction.options.getSubcommand();
        await interaction.deferReply({ ephemeral: true });
        if (subCommandGroup == "channel"){
            if (subCommand == "birthday"){  
                const targetChannel = interaction.options.getChannel("channel");
                await updateDb("birthday_channel", targetChannel.id);
                myCache.set("GuildSetting", {
                    ...myCache.get("GuildSetting"),
                    birthday_channel: targetChannel.id
                });
                await targetChannel.send({
                    content:"This channel has been used as a birthday channel"
                });
                return interaction.followUp({
                    content: `Birthday channel is set to <#${targetChannel.id}>`
                });
            }
        }
        
        if (["admin_role", "admin_member", "admin_command"].includes(subCommandGroup)){
            let addReply = "\`%s\` is set successfully";
            let removeReply = '\`%s\` is removed successfully';
            let reply;
            const cached = myCache.get("GuildSetting");
            const { admin_role, admin_member, admin_command } = cached;
            const options = {
                admin_role: {
                    cachedValue: admin_role,
                    addvalue: (interaction) => ({
                        value: interaction.options.getRole("role")?.id,
                        padding: interaction.options.getRole("role")?.name
                    }),
                    removeValue: (interaction) => ({
                        value: interaction.options.getString("role"),
                        padding: interaction.guild.roles.cache.get(interaction.options.getString("role"))?.name ?? "Unknown Role"
                    })
                },
                admin_member: {
                    cachedValue: admin_member,
                    addvalue: (interaction) => ({
                        value: interaction.options.getUser("member")?.id,
                        padding: interaction.options.getUser("member")?.username,
                        bot: interaction.options.getUser("member")?.bot
                    }),
                    removeValue: (interaction) => ({
                        value: interaction.options.getString("member"),
                        padding: interaction.guild.members.cache.get(interaction.options.getString("member"))?.displayName ?? "Unknown Member"
                    })
                },
                admin_command: {
                    cachedValue: admin_command,
                    addvalue: (interaction) => ({
                        value: interaction.options.getString("command"),
                        padding: interaction.options.getString("command")
                    }),
                    removeValue: (interaction) => ({
                        value: interaction.options.getString("command"),
                        padding: interaction.options.getString("command")
                    })
                }
            }
            if (subCommand == "add"){
                const { cachedValue } = options[subCommandGroup];
                const { value, padding, bot } = options[subCommandGroup]["addvalue"](interaction);
                if (bot) return interaction.followUp({
                    content: "Sorry, you cannot set a bot as an admin."
                })
                if (!cachedValue.includes(value)){
                    const update = [...cachedValue, value];
                    await updateDb(subCommandGroup, update);
                    myCache.set("GuildSetting", {
                        ...cached,
                        [subCommandGroup]: update
                    })
                }
                reply = sprintf(addReply, padding);
            }else{
                const { cachedValue } = options[subCommandGroup];
                const { value, padding } = options[subCommandGroup]["removeValue"](interaction);
                if (!cachedValue.includes(value)) reply = "Please feed a valid input.";
                else{
                    const update = cachedValue.filter((element) => (element != value));
                    await updateDb(subCommandGroup, update);
                    myCache.set("GuildSetting", {
                        ...cached,
                        [subCommandGroup]: update
                    })
                }
                reply = sprintf(removeReply, padding)
            }         

            return interaction.followUp({
                content: reply
            })
            
        }
    }

}