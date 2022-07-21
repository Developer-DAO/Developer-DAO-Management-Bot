const {MessageComponentInteraction, CommandInteraction} = require("discord.js");
const {memberRolesCheck} = require("../helper/util")
const CONSTANT = require("../helper/const")
const logger = require("../helper/logger");
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
            if (!memberRolesCheck(CONSTANT.ROLES.ALLOW, interaction.member)){
                return interaction.reply({
                    content: "Sorry, you are not allowed to run this command",
                    ephemeral: true
                });
            }
            //Get command object through the property of interaction, coomandName
            const command = interaction.client.commands.get(interaction.commandName);
            
            //TODO Need to handle this error
            if (!command) return;
        
            try{
                await command.execute(interaction);
            }catch (err){
                if (interaction.deferred){
                    interaction.editReply("Unknown error occurs, please contact admins.")
                }
                return logger.error(`User: ${interaction.user.username} Error: ${err.name} occurs when executing ${interaction.commandName} command. Msg: ${err.message} Stack: ${err.stack}`);
            }
        }

        if(interaction.isButton()){

            const button = interaction.client.buttons.get(interaction.customId)

            if(!button) return;

            try{
                await button.execute(interaction);
            }catch(err){
                //console.error(err)
                return logger.error(`User: ${interaction.user.username} Error: ${err.name} occurs when interacting ${interaction.customId} button. Msg: ${err.message} Stack: ${err.stack}`);
            }
        }
    }
}