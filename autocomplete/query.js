const { AutocompleteInteraction } = require("discord.js");
const CONSTANT = require("../helper/const");

module.exports = {
    attachedCommand: ["devdao"],
    options: ["query"],

    /**
     * @param  { AutocompleteInteraction } interaction
     */
    async execute(interaction){
        const { value: inputValue } = interaction.options.getFocused(true);
        const doc = CONSTANT.DOCS;
        const res = Object.keys(doc).map((key) => ({
            name: doc[key]["index"],
            value: key
        }))
        if (inputValue == '') return interaction.respond(res);
        const filter = res.filter((value) => value.name.toLowerCase().includes(inputValue.toLowerCase()));
        if (filter.length == 0) return interaction.respond([]);
        else return interaction.respond(filter)
    }
}
