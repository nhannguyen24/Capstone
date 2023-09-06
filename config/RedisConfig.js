const { createClient } = require('redis');
require("dotenv").config();

const client = createClient({
    legacyMode: true,
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
    }
});

client.connect().catch(console.error);

module.exports = client;