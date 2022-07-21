const CONSTANT = require("../helper/const");
const myCache = require("./cache");
const sprintf = require("sprintf-js").sprintf

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
    if (myCache.get("OnboardingSchedule").length == 0) return CONSTANT.CONTENT.ONBOARDING_END;
    
    return myCache.get("OnboardingSchedule")
            .map((value, index) => (sprintf(CONSTANT.CONTENT.ONBOARDING, {
                ...value,
                index: index + 1
            })))
            .toString().replace(/,/g, '');
}

module.exports = { awaitWrap, isValidHttpUrl, memberRolesCheck, fetchOnboardingSchedule }