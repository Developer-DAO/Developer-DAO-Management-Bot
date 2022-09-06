const { AutocompleteInteraction } = require("discord.js");
const CONSTANT = require("../helper/const");

module.exports = {
    attachedCommand: ["devdao"],
    options: ["query"],

    /**
     * @param  { AutocompleteInteraction } interaction
     */
    async execute(interaction){
        const { value } = interaction.options.getFocused(true);
        const doc = CONSTANT.DOCS;
        const res = Object.keys(doc).map((key) => ({
            name: doc[key]["index"],
            value: key
        }))
        if (value == '') return interaction.respond(res);

        const filter = res.filter((value) => value.name.includes(value));
        if (filter.length == 0) return interaction.respond([]);
        else return interaction.respond(filter)
    }
}
