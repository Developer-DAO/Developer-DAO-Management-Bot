const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction, MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const CONSTANT = require("../helper/const");
const sprintf = require("sprintf-js").sprintf

module.exports = {
    commandName: "devdao",
    description: "Developer DAO Assistant",

    data: null,

    generateData() {
        this.data = new SlashCommandBuilder()
            .setName(this.commandName)
            .setDescription(this.description)
            .addStringOption(option =>
                option.setName("query")
                    .setDescription("Search resources of Developer DAO")
                    .setAutocomplete(true)
                    .setRequired(true))
            .addUserOption(option =>
                option.setName("target")
                    .setDescription("User to mention"))
    },

    /**
     * @param  {CommandInteraction} interaction
     */
    async execute(interaction) {
        const user = interaction.options.getUser("target");
        const query = interaction.options.getString("query");
        const res = CONSTANT.DOCS[query];

        if (!res) return interaction.reply({
            content: "Sorry, the query you input is invalid.",
            ephemeral: true
        })

        if (user && user.bot) return interaction.reply({
            content: "Sorry, you cannot choose a bot as a target.",
            ephemeral: true
        })

        const resEmbed = new MessageEmbed()
            .setTitle(res.index)
            .setDescription(sprintf("**Channel**: <#%s>\n**Description**: %s\n**Meeting Arrangemnet**: %s\n**Meeting Channel**: <#%s>",
                res.channel, res.description, res.meeting, res.meetingChannel))
            .setThumbnail("https://cdn.discordapp.com/attachments/1003702354882867343/1016275984623865876/unknown.png");
        const resActionRow = new MessageActionRow()
            .addComponents([
                new MessageButton()
                    .setLabel(res.buttonLabel)
                    .setStyle('LINK')
                    .setURL(res.link)
                    .setEmoji(res.emoji)
            ]);
        if (user){
            return interaction.reply({
                content: `<@${user.id}>`,
                components: [resActionRow],
                embeds: [resEmbed]
            })
        }else {
            return interaction.reply({
                components: [resActionRow],
                embeds: [resEmbed],
                ephemeral: true
            })
        }
        
    }

}