const { ButtonInteraction} = require("discord.js");
const myCache = require("../helper/cache");
const { getCurrentTimeMin } = require("../helper/util");
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

        await interaction.deferReply({ ephemeral:true });

        const eligibleAttendees = Object.values(attendee)
            .filter((value) => (value.timestamp !=0 && current - value.timestamp >= duration))
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
        
        return interaction.followUp({
            files: [
                {
                    name: "Eligible_Members.csv",
                    attachment: Buffer.from(csvContent, "utf-8")
                }
            ]
        })
    }
}