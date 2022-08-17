const { AutocompleteInteraction } = require("discord.js");
const CONSTANT = require("../helper/const");
const myCache = require("../helper/cache");

module.exports = {
    attachedCommand: ["channelmanager"],
    options: ["channel"],

    /**
     * @param  { AutocompleteInteraction } interaction
     */
    async execute(interaction){
        const focusedOption = interaction.options.getFocused(true);
        if (this.options.includes(focusedOption.name)){
            if (myCache.has("ChannelsWithoutTopic")){
                const cached = myCache.get("ChannelsWithoutTopic");
                const choices = Object.keys(cached)
                    .filter((parentId) => cached[parentId]["parentName"].startsWith(focusedOption.value))
                    .map((parentId) => ({
                        name: cached[parentId]["parentName"],
                        value: parentId
                    })).slice(0, CONSTANT.BOT_NUMERICAL_VALUE.AUTO_COMPLETE_OPTIONS_LIMIT);
                
                if (choices.length == 0) return interaction.respond([]);
                else return interaction.respond(choices);
            }else{
                return interaction.respond([]);
            }
        }
    }
}
