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

function memberRolesCheck (rolesArray, guildMember){
    const result = Array.from(guildMember.roles.cache.keys()).filter(value => rolesArray.includes(value));
    return result.length == 0 ? false : true;
}

module.exports = { awaitWrap, memberRolesCheck }