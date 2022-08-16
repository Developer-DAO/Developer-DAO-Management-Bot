const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction, MessageEmbed } = require("discord.js");
const { ChannelType } = require("discord-api-types/payloads/v10");
const myCache = require("../helper/cache");
const { updateDb } = require('../helper/util');
const { sprintf } = require('sprintf-js');
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
                                value: roleField
                            },
                            {
                                name: "Admin Member",
                                value: memberField
                            },
                            {
                                name: "Admin Command",
                                value: commandField
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
            const {admin_role, admin_member, admin_command} = cached;

            if (subCommand == "add"){
                const options = [
                    {
                        name: "admin_role",
                        addValue: interaction.options.getRole("role").id,
                        addPadding: interaction.options.getRole("role").name,
                        removeValue: interaction.options.getString("role"),
                        removePadding: interaction.guild.roles.cache.get(interaction.options.getString("role"))?.name ?? "Unknown Role"
                    },
                    {
                        name: "admin_member",
                        addValue: interaction.options.getRole("member").id,
                        addPadding: interaction.options.getRole("member").name,
                        removeValue: interaction.options.getString("member"),
                        removePadding: interaction.guild.members.cache.get(interaction.options.getString("member"))?.displayName ?? "Unknown Member"
                    },
                    {
                        name: "admin_command",
                        addValue: interaction.options.getString("command"),
                        addPadding: interaction.options.getString("command"),
                        removeValue: interaction.options.getString("command"),
                        removePadding: interaction.options.getString("command")
                    }
                ];
                [admin_role, admin_member, admin_command].forEach(async(cachedValue, index) => {
                    const {name, addValue, removeValue, addPadding, removePadding} = options[index];
                    if (subCommandGroup == name){
                        if (subCommand == "add"){
                            if (!cachedValue.includes(addValue)){
                                const update = [...cachedValue, addValue];
                                await updateDb(name, update);
                                myCache.set("GuildSetting", {
                                    ...cached,
                                    [name]: update
                                })
                            }
                            reply = sprintf(addReply, addPadding)
                        }else{
                            if (!cachedValue.includes(removeValue)) reply = "Please feed a valid input.";
                            else{
                                const update = cachedValue.filter((value) => (value != removeValue));
                                await updateDb(name, update);
                                myCache.set("GuildSetting", {
                                    ...cached,
                                    [name]: update
                                })
                            }
                            reply = sprintf(removeReply, removePadding)
                        }
                    }
                })

                return interaction.followUp({
                    content: reply
                })
            }
        }
    }

}