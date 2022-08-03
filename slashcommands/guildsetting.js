const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction, MessageEmbed } = require("discord.js");
const myCache = require("../helper/cache");
const { updateDb } = require('../helper/util');
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
                command.setName("access")
                    .setDescription("Set access role of this bot")
                        .addRoleOption(option =>
                            option.setName("role")
                                .setDescription("The channel for notification")
                                .setRequired(true)))
            .addSubcommand(command =>
                command.setName("read")
                    .setDescription("Read current guild setting"))
    },

    /**
     * @param  {CommandInteraction} interaction
     */
    async execute(interaction) {

        if (interaction.options.getSubcommand() == "access"){
            const role = interaction.options.getRole("role");
            let { access_role } = myCache.get("GuildSetting");
            if (access_role.includes(role.id)) return interaction.reply({
                content: `${role.name} is added into access role set`,
                ephemeral: true 
            })

            access_role = [...access_role, role.id];            
            await updateDb("access_role", access_role);
            myCache.set("GuildSetting", {
                ...myCache.get("GuildSetting"),
                access_role: access_role
            })

            return interaction.reply({
                content: `${role.name} is added into access role set`,
                ephemeral: true 
            })
        }

        if (interaction.options.getSubcommand() == "read"){
            let { access_role } = myCache.get("GuildSetting");
            access_role = access_role.map(value => interaction.guild.roles.cache.get(value)?.name ?? "unfetchable");
            if (access_role.length == 0) access_role = 'everyone';
            else access_role = access_role.toString().replaceAll(',', '');

            return interaction.reply({
                embeds: [
                    new MessageEmbed()
                        .setTitle(`${interaction.guild.name} Guild Setting`)
                        .addFields([
                            { name: "Access Role", value: `\`${access_role}\``, inline: true }
                        ])
                ]
            })
        }
        
    }

}