const { TextChannel, MessageActionRow, MessageButton } = require("discord.js")
const { awaitWrap } = require("../helper/util")
const CONSTANT = require("../helper/const")
require('dotenv').config({ path: "../.env" });

let counter = 0;
let lastMessage;
const reply = {
    components: [
        new MessageActionRow()
            .addComponents([
                new MessageButton()
                    .setCustomId("schedule")
                    .setLabel("Onboarding Call Schedule")
                    .setEmoji("📆")
                    .setStyle("PRIMARY"),
                new MessageButton()
                    .setCustomId("talk")
                    .setLabel("Talk with us")
                    .setEmoji("📢")
                    .setStyle("SECONDARY"),
                new MessageButton()
                    .setCustomId("instruction")
                    .setLabel("DAO Instruction")
                    .setEmoji("📚")
                    .setStyle("SUCCESS")
            ])
    ],
    content: CONSTANT.CONTENT.INTRODUCTION
}
/**
 * @param  {TextChannel} channel
 * @param  {Boolean} flag true => Trigger stickyMsg, false => Keep stickyMsg
 */
async function stickyMsgHandler(channel, flag){
    
    const setUp = async () => {
        counter = 0;
        if (!lastMessage) {
            const previousBotMessage = (await channel.messages.fetch({
                limit: 25
            })).filter(msg => msg.author.bot && msg.content == CONSTANT.CONTENT.INTRODUCTION);
            if (previousBotMessage.size != 0){
                await awaitWrap(previousBotMessage.first().delete());
            }
        }else {
            await awaitWrap(lastMessage.delete());  
        }
        lastMessage = await channel.send(reply);
    }

    if (flag){
        lastMessage = undefined;
        await setUp();
    }else{
        counter ++;
        if (counter == CONSTANT.BOT_NUMERICAL_VALUE.STICKY_MSG_INTERNAL){
            await setUp()
        }
    }
}
module.exports = { stickyMsgHandler }