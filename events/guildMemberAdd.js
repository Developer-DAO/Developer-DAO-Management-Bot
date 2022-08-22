const { GuildMember } = require("discord.js");
const logger = require("../helper/logger");

module.exports = {
    name: "guildMemberAdd",
    once: false,
    
    /**
     * @param  { GuildMember } guildMember
     */
    async execute (guildMember){
        try{
            //stupid matching
            const name = guildMember.displayName;
            const nameLowerCase = name.toLocaleLowerCase();
            const reg_1 = /(Developer\s*DAO)|(DevDAO)/g;
            const reg_2 = /(developer\s*dao)|(devdao)/g;
            if (reg_1.test(name) || reg_2.test(nameLowerCase)){
                await guildMember.ban({
                    days: 7
                })
                logger.info(`${guildMember.user.tag} has been banned`);
            }
        }catch(error){
            return logger.error(`Error: ${error.name} occurs when ${this.name}. Msg: ${error.message} Stack: ${error.stack}`);
        }
        
    }
}