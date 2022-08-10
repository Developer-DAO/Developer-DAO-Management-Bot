//to-do role chekcing

const EMBED_STRING = Object.freeze({
    DESCRIPTION: "As there has been no action taken on our request to add a description to this channel, we have interpreted this as the channel is not of material importance to the server. Therefore it has been queued for archiving.\n\nChannels that do not have a description, fall out of compliance with the new standards being established by the Server Architecture Team — as it makes it difficult for Developer DAO members to be easily navigate our Discord, and find information quickly.\n\n**__We are going to archive this channel 48 hours (%s) from this notice being sent out__**⚠️\n\nIf you believe that this channel is important and should remain, please let us know in the <#993496711798456380> channel, by creating a thread using the format below:\n\nThread Name: \`re [Your Channel Name]\`\n\nThanks for your understanding! 🧰",
    TITLE: "Hi, D_Ds in %s Channel!"
})

const LINK = Object.freeze({
    DISCORD_MSG: "https://discord.com/channels/%(guildId)s/%(channelId)s/%(messageId)s",
})

//to-do predefined msg to be changed
const CONTENT = Object.freeze({
    INTRODUCTION: "Hi, I am onboarding assistant 👋.... Below you can check out the schedule to attend our 🔥 group onboarding calls or chat with a D_D community manager 🤝",
    ONBOARDING: "%(index)d. <t:%(timestamp)s:F>(<t:%(timestamp)s:R>) hosted by <@%(hostId)s>. RSVP [here](<%(eventLink)s>)\n",
    //todo channel mentions
    ONBOARDING_GOINGON: "%(index)d. Group onboarding Call is currently live in %(channelInform)s  🔥🔥🔥 hosted by <@%(hostId)s> Started (<t:%(timestamp)s:R>)\n",
    ONBOARDING_END: "Onboarding calls for this week have ended. We will update the latest ones this Sunday or next Monday.",
    ONBOARDING_OPTION: "%(index)d. %(timestamp)s hosted by %(hostName)s",
    THREAD_WELCOME_MSG: "",
    CHANNEL_STATUS_MSG_SENT: "> **Channel**: <#%(channelId)s> **State**: [Message Sent](%(messageLink)s) **Sending Date**: <t:%(timestamp)d:R>\n",
    CHANNEL_STATUS_MSG_UNSENT: "> **Channel**: <#%(channelId)s> **State**: Message Unsent\n",
    CHANNEL_WITHOUT_PARENT_PARENTID: "0",
    CHANNEL_WITHOUT_PARENT_PARENTNAME: "Without Category",
}) 

const BOT_NUMERICAL_VALUE = Object.freeze({
    STICKY_MSG_INTERNAL: 1,
    ONBOARDING_SCHEDULE_UPDATE_INTERNAL: 30,
    ONBOARDING_DURATION: 60,
    CHANNEL_CHECK_BUTTON_COLLECTOR_INTERNAL: 1 * 60 * 1000,
    VIEW_CHANNEL_DURATION: 5 * 60 * 1000
})

const WEEK = Object.freeze([
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
])

const MONTH = Object.freeze([
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
])

module.exports = { 
    EMBED_STRING, 
    LINK,
    CONTENT, 
    BOT_NUMERICAL_VALUE,
    WEEK,
    MONTH
}