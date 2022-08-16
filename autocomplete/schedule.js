const { AutocompleteInteraction } = require("discord.js");
const { sprintf } = require("sprintf-js");
const CONSTANT = require("../helper/const");
const myCache = require("../helper/cache");
const { convertTimeStamp } = require("../helper/util");

module.exports = {
    attachedCommand: ["onboardmanager"],
    options: ["schedule_list"],

    /**
     * @param  { AutocompleteInteraction } interaction
     */
    async execute(interaction){
        const focusedOption = interaction.options.getFocused(true);
        if (this.options.includes(focusedOption.name)){
            const choices = myCache.get("OnboardingSchedule").map((value, index) => (sprintf(CONSTANT.CONTENT.ONBOARDING_OPTION, {
                index: index + 1,
                timestamp: convertTimeStamp(value.timestamp),
                hostName: value.hostName
            }))).slice(0, CONSTANT.BOT_NUMERICAL_VALUE.AUTO_COMPLETE_OPTIONS_LIMIT);

            if (choices.length == 0) return interaction.respond([{ name: "No onboarding call schedule", value: "-1" }])

            return interaction.respond(
                choices.map((value, index) => ({
                    name: value,
                    value: (index + 1).toString()
                }))
            )
        }
    }
}
