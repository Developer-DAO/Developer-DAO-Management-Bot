const { ButtonInteraction, MessageActionRow, MessageButton} = require("discord.js");
const myCache = require("../helper/cache");
const { getCurrentTimeMin, awaitWrap } = require("../helper/util");
const CONSTANT = require("../helper/const");
const { sprintf } = require("sprintf-js");
require('dotenv').config();

module.exports = {
    customId: ["end"],
    /**
     * @param  {ButtonInteraction} interaction
     */
    async execute(interaction){
        if (!myCache.has("VoiceContext") || Object.keys(myCache.get("VoiceContext")).length == 0){
            myCache.set("VoiceContext", {});
            return interaction.reply({
                content: "Sorry, data error occurs. Please report it to the admin",
                ephemeral: true
            })
        }

        const { hostId, attendee, duration } = myCache.get("VoiceContext");
        if (interaction.user.id != hostId) return interaction.reply({
            content: "Sorry, only the host can end this event.",
            ephemeral: true
        });

        const current = getCurrentTimeMin();
        let { embeds, components } = interaction.message;
        embeds[0].title = "Town Hall Assistant Ended";
        embeds[0].description += `\n**Ended**: <t:${current}:f>`;
        components[0].components[0].disabled = true;

        await interaction.message.edit({
            embeds: embeds,
            components: components
        });

        await interaction.deferReply({ ephemeral: true });

        const eligibleAttendees = Object.values(attendee)
            .filter((value) => (current - value.timestamp >= duration))
            .map((value) => (value.name));
        myCache.set("VoiceContext", {});
        if (eligibleAttendees.length == 0) return interaction.followUp({
            content: "Sorry, none of eligible member in this event"
        })
        const universalBOM = "\uFEFF"
        let csvContent = universalBOM + "Discord Name\r\n";
        csvContent = eligibleAttendees.reduce((pre, cur) => {
            return pre + cur + "\r\n"
        }, csvContent);
        
        const fileMsg = await interaction.channel.send({
            files: [
                {
                    name: "Eligible_Members.csv",
                    attachment: Buffer.from(csvContent, "utf-8")
                }
            ]
        });
        const msgLink = sprintf(CONSTANT.LINK.DISCORD_MSG, {
            guildId: interaction.guild.id,
            channelId: interaction.channel.id,
            messageId: fileMsg.id
        });

        return interaction.followUp({
            content: `File has been sent to <#${interaction.channel.id}>`,
            components: [
                new MessageActionRow()
                    .addComponents([
                        new MessageButton()
                            .setLabel("Link to this file")
                            .setStyle("LINK")
                            .setURL(msgLink)
                            .setEmoji("🔗")
                    ])
            ]
        })
    }
}