const { MessageEmbed } = require("discord.js")
const { getApp } = require('firebase/app')
const { getFirestore, doc, updateDoc } = require('firebase/firestore');
const CONSTANT = require("../helper/const");
const myCache = require("./cache");
const sprintf = require("sprintf-js").sprintf;

require("dotenv").config();

/**
 * @param  {Promise} promise
 * @param  {string} renamedObject="result"
 * @param  {string} renamedError="error"
 */
async function awaitWrap(promise, renamedObject = "result", renamedError = "error") {
    return promise
        .then((data) => {
            return {
                [renamedObject]: data,
                [renamedError]: null
            }
        })
        .catch((err) => {
            return {
                [renamedObject]: null,
                [renamedError]: err
            }
        });
}

function isValidHttpUrl(string){
    let url;
    try {
        url = new URL(string);
    } catch (error) {
        return false;  
    }
    return true;
}


function memberRolesCheck (rolesArray, guildMember){
    const result = Array.from(guildMember.roles.cache.keys()).filter(value => rolesArray.includes(value));
    return result.length == 0 ? false : true;
}

function fetchOnboardingSchedule(){
    let description;
    if (myCache.get("OnboardingSchedule").length == 0) {
        description = CONSTANT.CONTENT.ONBOARDING_END;
    }else {
        const time = Math.floor((new Date().getTime()) / 1000);
        description = myCache.get("OnboardingSchedule")
            .sort((a, b) => a.timestamp - b.timestamp)
            .map((value, index) => {
                if (time > value.timestamp && time < value.timestamp + CONSTANT.BOT_NUMERICAL_VALUE.ONBOARDING_DURATION){
                    return sprintf(CONSTANT.CONTENT.ONBOARDING_GOINGON, {
                        ...value,
                        index: index + 1,
                        channelId: CONSTANT.CHANNEL.ONBOARDING
                    })
                }
                return sprintf(CONSTANT.CONTENT.ONBOARDING, {
                    ...value,
                    index: index + 1
                })
            }).toString().replace(/,/g, '');
        }

    return new MessageEmbed()
        .setTitle("Onboarding Schedule")
        .setDescription(description)
}

function convertTimeStamp(timestampInSec){
    const timestampInMiliSec = timestampInSec * 1000;
    const date = new Date(timestampInMiliSec);
    return sprintf("%(week)s, %(month)s %(day)d, %(year)d %(hour)d:%(min)d", {
        week:CONSTANT.WEEK[date.getDay()],
        month: CONSTANT.MONTH[date.getUTCMonth()],
        day: date.getUTCDate(),
        year: date.getUTCFullYear(),
        hour: date.getUTCHours(),
        min: date.getUTCMinutes()
    }, )
}

async function checkOnboardingSchedule(value){
    const time = Math.floor((new Date().getTime()) / 1000);
    const newCache = value.filter(value => value.timestamp + CONSTANT.BOT_NUMERICAL_VALUE.ONBOARDING_DURATION > time);
    if (newCache.length != value.length){
        myCache.set("OnboardingSchedule", newCache, CONSTANT.BOT_NUMERICAL_VALUE.ONBOARDING_SCHEDULE_UPDATE_INTERNAL);
        const db = getFirestore(getApp("devDAO"));
        const guildRef = doc(db, "Guild", process.env.GUILDID);
        await updateDoc(guildRef, {
            onboarding_schedule: newCache
        });
    }else{
        myCache.set("OnboardingSchedule", value, CONSTANT.BOT_NUMERICAL_VALUE.ONBOARDING_SCHEDULE_UPDATE_INTERNAL);
    }
}

async function updateDb(attribute, data){
    const db = getFirestore(getApp("devDAO"));
    const guildRef = doc(db, "Guild", process.env.GUILDID);
    await updateDoc(guildRef, {
        [attribute]: data
    });
}

module.exports = { awaitWrap, isValidHttpUrl, memberRolesCheck, fetchOnboardingSchedule, convertTimeStamp, checkOnboardingSchedule, updateDb }
