const NodeCache = require("node-cache")
const myCache = new NodeCache({ stdTTL: 0, deleteOnExpire: false, checkperiod: 60 });

module.exports = myCache;