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
    ARCHIVE_CHANNEL_NAME_TEMPLATE: "ARCHIVE--%s",
    NOTIFICATION_MSG: "Hi, D_Ds in <#%(channelId)s>\n\nAs there has been no action taken on our request to add a description to this channel, we have interpreted this as the channel is not of material importance to the server. Therefore it has been queued for archiving.\n\nChannels that do not have a description, fall out of compliance with the new standards being established by the Server Architecture Team — as it makes it difficult for Developer DAO members to be easily navigate our Discord, and find information quickly.\n\n**We are going to archive this channel <t:%(timestamp)s:R> from this notice being sent out ⚠️**\n\nIf you believe that this channel is important and should remain, please let us know in the <#993496711798456380> channel, by creating a thread using the format below:\n\n**Thread Name**: \`re [insert channel name]\`\n\nThanks for your cooperation! 🧰"
}) 

const BOT_NUMERICAL_VALUE = Object.freeze({
    STICKY_MSG_INTERNAL: 1,
    ONBOARDING_SCHEDULE_UPDATE_INTERNAL: 30,
    ONBOARDING_DURATION: 60,
    CHANNEL_CHECK_BUTTON_COLLECTOR_INTERNAL: 1 * 60 * 1000,
    VIEW_CHANNEL_DURATION: 5 * 60 * 1000,
    AUTO_COMPLETE_OPTIONS_LIMIT: 25,
    EXPIRY_TIME: 1 * 100,
    ARCHIVE_CHANNEL_CHILD_LIMIT: 2,
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
    LINK,
    CONTENT, 
    BOT_NUMERICAL_VALUE,
    WEEK,
    MONTH
}