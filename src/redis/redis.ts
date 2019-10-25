import Redis from 'ioredis';
import envVars from '../global/environment';

export const redisClient = new Redis({
    host: envVars.REDIS_HOST,
    port: envVars.REDIS_PORT,
    password: envVars.REDIS_PASSWORD,
    connectTimeout: 25000,
    retryStrategy: () => 1000,
});

export const redisSocketPub = redisClient.duplicate();

export const redisSocketSub = redisSocketPub.duplicate();

// redisPub.on("message", function(channel, message) {
//     // Receive message Hello world! from channel news
//     // Receive message Hello again! from channel music
//     console.log("Receive message %s from channel %s", message, channel);
// });
if (process.env.NODE_ENV === 'development') {
    redisSocketSub.on('message', function(channel, message) {
        // Receive message Hello world! from channel news
        // Receive message Hello again! from channel music
        console.log('Receive message %s from channel %s', message, channel);
    });
}
