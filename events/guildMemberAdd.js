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
            if (name.test(reg_1) || nameLowerCase.test(reg_2)){
                await guildMember.ban({
                    days: 7
                })
            }
        }catch(error){
            return logger.error(`Error: ${err.name} occurs when ${this.name}. Msg: ${err.message} Stack: ${err.stack}`);
        }
        
    }
}