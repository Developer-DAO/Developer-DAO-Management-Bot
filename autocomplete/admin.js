const { AutocompleteInteraction } = require("discord.js");
const CONSTANT = require("../helper/const");
const myCache = require("../helper/cache");

module.exports = {
    attachedCommand: ["set"],
    options: ["role", "member", "command"],

    /**
     * @param  { AutocompleteInteraction } interaction
     */
    async execute(interaction){
        const focusedOption = interaction.options.getFocused(true);
        if (!myCache.has("GuildSetting")) return interaction.respond([]);
        let choices = [];
        switch(focusedOption.name){
            case "role":
                const { admin_role } = myCache.get("GuildSetting");
                choices = admin_role.map((value) => ({
                    name: interaction.guild.roles.cache.get(value)?.name ?? "Unknow Role",
                    value: value
                })).filter((value) => value.name.includes(focusedOption.value));
                break;
            case "member":
                const { admin_member } = myCache.get("GuildSetting");
                choices = admin_member.map((value) => ({
                    name: interaction.guild.members.cache.get(value)?.displayName,
                    value: value
                })).filter((value) => value.name.includes(focusedOption.value));
                break;
            case "command":
                const { admin_command } = myCache.get("GuildSetting");
                choices = admin_command.map((value) => ({
                    name: value,
                    value: value
                })).filter((value) => value.name.includes(focusedOption.value));
        }
        if (choices.length == 0) return interaction.respond([]);

        return interaction.respond(choices.slice(0, CONSTANT.BOT_NUMERICAL_VALUE.AUTO_COMPLETE_OPTIONS_LIMIT))
    }
}
