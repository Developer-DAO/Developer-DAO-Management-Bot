const {MessageComponentInteraction, CommandInteraction} = require("discord.js");
const {memberRolesCheck} = require("../helper/util")
const logger = require("../helper/logger");
const myCache = require("../helper/cache");
const _ = require("lodash");
require("dotenv").config();

module.exports = {
    name: "interactionCreate",
    once: false,
    
    /**
     * @param  {CommandInteraction | MessageComponentInteraction} interaction
     */
    async execute (interaction){
        //interaction => CommandInteraction
        if (interaction.isCommand()){
            //Get command object through the property of interaction, coomandName
            const command = interaction.client.commands.get(interaction.commandName);
            
            if (myCache.has("GuildSetting")){
                const { access_role, access_member, access_command } = myCache.get("GuildSetting");
                if (access_command.includes(interaction.commandName)){
                    if (
                        !access_member.includes(interaction.member.id) 
                        && _.intersection(access_role, interaction.member.roles.cache.keys()).length == 0
                    ){
                        return interaction.reply({
                            content: "Sorry, you don't have permission to run this command. Please contact community manager.",
                            ephemeral: true
                        })
                    }
                }
            }else {
                return interaction.reply({
                    content: "Command is initiating, please try again",
                    ephemeral: true
                })
            }

            //TODO Need to handle this error
            if (!command) return interaction.reply({
                content: "Sorry, you chose a non-existent command",
                ephemeral: true
            })
        
            try{
                await command.execute(interaction);
            }catch (err){
                if (interaction.deferred){
                    interaction.editReply({
                        content: "Unknown error occurs, please contact admins.",
                        components: [],
                        button: []
                    });
                }
                return logger.error(`User: ${interaction.user.username} Error: ${err.name} occurs when executing ${interaction.commandName} command. Msg: ${err.message} Stack: ${err.stack}`);
            }
        }

        if(interaction.isButton()){

            const button = interaction.client.buttons.get(interaction.customId)

            if(!button) return interaction.reply({
                content: "Sorry, you chose a non-existent button.",
                ephemeral: true
            })

            try{
                await button.execute(interaction);
            }catch(err){
                //console.error(err)
                return logger.error(`User: ${interaction.user.username} Error: ${err.name} occurs when interacting ${interaction.customId} button. Msg: ${err.message} Stack: ${err.stack}`);
            }
        }

        if (interaction.isAutocomplete()){
            const option = interaction.options.getFocused(true).name;
            const command = interaction.client.auto.get(`${interaction.commandName}${option}`);

            if (!command || !option) return;

            try {
                await command.execute(interaction);
            } catch (err) {
                return logger.error(`User: ${interaction.user.username} Error: ${err.name} occurs when executing ${interaction.commandName} command. Msg: ${err.message} Stack: ${err.stack}`);
            }
        }
    }
}