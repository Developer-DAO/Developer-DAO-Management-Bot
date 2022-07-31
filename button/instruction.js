const { ButtonInteraction, MessageActionRow, MessageButton } = require("discord.js")
const { fetchOnboardingSchedule } = require("../helper/util");
const CONSTANT = require("../helper/const");
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
                    embeds: [fetchOnboardingSchedule()],
                    ephemeral: true
                })
            case this.customId[1]:
                const replyMsg = await interaction.reply({
                    content: "✅ **Yes** -- Create a thread for you and our onboarding team members will reach you out.\n\n❌ **No** -- I'd like to walk through and hang out.",
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
                    ephemeral: true
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
                            components: [],
                        })
                    }else{
                        const btnInteraction = collected.first();
                        await btnInteraction.deferUpdate();
                        if (btnInteraction.customId == "yes"){
                            let messageFetch = await interaction.channel.messages.fetch({
                                limit: 20
                            });
                            messageFetch = messageFetch.filter((msg) => (msg.author.id == interaction.user.id && msg.type != "REPLY"));
                            let thread;
                            if (!messageFetch.size){
                                thread = await interaction.channel.threads.create({
                                    name: `Welcome ${interaction.member.displayName}`,
                                })
                            }else{
                                if(messageFetch.first().hasThread){
                                    if (messageFetch.first().thread.name.startsWith("Welcome")) return interaction.editReply({
                                        content: `You have had a welcome thread here <#${messageFetch.first().id}>`,
                                        components: [],
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
                                content: `${interaction.user}, Hello, I am a member from onboarding team. The following is our onboarding call schedule for this week:`,
                                embeds: [fetchOnboardingSchedule()]
                            })
                            return interaction.editReply({
                                content: `Your thread has been created <#${thread.id}>`,
                                components: [],
                            })
                        }else{
                            return interaction.editReply({
                                content: "Welcome to join in Developer DAO!",
                                components: [],
                            })
                        }
                    }
                })
                break;
            case this.customId[2]:
                return interaction.reply({
                    content: "WIP",
                    ephemeral: true
                })
                
        }
    }
   
}