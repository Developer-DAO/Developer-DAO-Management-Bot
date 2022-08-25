
const { VoiceState } = require("discord.js");
const myCache = require("../helper/cache");
const { getCurrentTimeMin } = require("../helper/util");

module.exports = {
    name: "voiceStateUpdate",
    once: false,
    /**
     * @param  {VoiceState} oldState
     * @param  {VoiceState} newState
     */
    async execute(oldState, newState) {
        if (newState.member.user.bot) return;
        if (!myCache.has("VoiceContext") || Object.keys(myCache.get("VoiceContext")).length == 0) return;
        let guildVoiceContext = myCache.get("VoiceContext");
        const current = getCurrentTimeMin();
        //Join this event
        if (oldState?.channel?.id != guildVoiceContext.channelId && newState?.channel?.id == guildVoiceContext.channelId){
            guildVoiceContext.attendee[newState.member.id] = {
                timestamp: current,
                name: newState.member.displayName
            }
        //Jump out from this event
        }else if (oldState?.channel?.id == guildVoiceContext.channelId && newState?.channel?.id != guildVoiceContext.channelId){
            delete guildVoiceContext.attendee[newState.member.id];
        }else return;
        myCache.set("VoiceContext", guildVoiceContext);
    }
}