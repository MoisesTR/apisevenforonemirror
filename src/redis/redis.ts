import Redis from 'ioredis';
import envVars from '../global/environment';

console.log('Envvars', envVars);
export const redisPub = new Redis({
    host: envVars.REDIS_HOST,
    port: envVars.REDIS_PORT,
    password: envVars.REDIS_PASSWORD,
    connectTimeout: 25000,
});

export const redisSub = new Redis({
    host: envVars.REDIS_HOST,
    port: envVars.REDIS_PORT,
    password: envVars.REDIS_PASSWORD,
    connectTimeout: 25000,
});

// redisPub.on("message", function(channel, message) {
//     // Receive message Hello world! from channel news
//     // Receive message Hello again! from channel music
//     console.log("Receive message %s from channel %s", message, channel);
// });

redisSub.on("message", function(channel, message) {
    // Receive message Hello world! from channel news
    // Receive message Hello again! from channel music
    console.log("Receive message %s from channel %s", message, channel);
});