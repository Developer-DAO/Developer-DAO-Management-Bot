const { Message } = require("discord.js");
const myCache = require("../helper/cache");
const { stickyMsgHandler } = require("../stickymessage/handler");
require("dotenv").config()

module.exports = {
    name: "messageCreate",
    once: false,
    
    //TODO
    //If a malicious guy is keeping sending !command, will our bot die?
    /**
     * @param  { Message } message
     * @param {[]} messageCommands 
     * @param {[]} webhookHandlers
     */
    async execute (message){
        if (message.guild){
            const { channel, author } = message;
            if (!myCache.has("GuildSetting")) return;
            //to-do error handling
            if (channel.id == myCache.get("GuildSetting").introduction_channel && !author.bot && message.type != "REPLY"){
                stickyMsgHandler(channel, false);
            }
        }
    }
}