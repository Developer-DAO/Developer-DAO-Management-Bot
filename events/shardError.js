const logger = require("../helper/logger");
require("dotenv").config()

module.exports = {
    name: "shardError",
    once: false,

    /*When error occurs, this event will be triggered until connection resumes*/
    /**
     * @param  {error} error
     * @param  {number} shardId
     */
    async execute(error, shardId) {
        logger.error(`Connection error occurs in shard ${shardId}`);
    }
}