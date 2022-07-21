const { ButtonInteraction,  } = require("discord.js")
const { fetchOnboardingSchedule } = require("../helper/util");
require('dotenv').config();

module.exports = {
    customId: ["schedule", "talk", "instruction"],
    /**
     * @param  {ButtonInteraction} interaction
     */
    async execute(interaction){
        switch(interaction.customId){
            case this.customId[0]:
                return interaction.reply({
                    content: fetchOnboardingSchedule(),
                    ephemeral: true
                })
            case this.customId[1]:
                await interaction.deferReply({
                    ephemeral: true
                });
                let messageFetch = await interaction.channel.messages.fetch({
                    limit: 100
                });
                messageFetch = messageFetch.filter((msg) => (msg.author.id == interaction.user.id));
                let thread;
                if (!messageFetch.size){
                    thread = await interaction.channel.threads.create({
                        name: `Welcome ${interaction.member.displayName}`,
                    })
                }else{
                    if(messageFetch.first().hasThread){
                        if (messageFetch.first().thread.name.startsWith("Welcome")) return interaction.followUp({
                            content: `You have had a welcome thread here <#${messageFetch.first().id}>`
                        })
                        thread = await interaction.channel.threads.create({
                            name: `Welcome ${interaction.member.displayName}`,
                        })
                    }else{
                        thread = await messageFetch.first().startThread({
                            name: `Welcome ${interaction.member.displayName}`,
                        });
                    }
                }
                thread.send({
                    content: `${interaction.user}, Hello, I am a member from onboarding team. Here is our onboarding call schedule for this week ${fetchOnboardingSchedule()}`
                })
                return interaction.followUp({
                    content: `Your thread has been created <#${thread.id}>`
                })
            case this.customId[2]:
                return interaction.reply({
                    content: "WIP",
                    ephemeral: true
                })
                
        }
    }
   
}