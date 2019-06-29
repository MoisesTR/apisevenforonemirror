import Redis from "ioredis";
import envVars from '../global/environment';

export const redisPub = new Redis({
    host: envVars.REDIS_HOST,
    port: envVars.REDIS_PORT,
    // password: envVars.REDIS_PASSWORD,
});

export const redisSub = new Redis({
    host: envVars.REDIS_HOST,
    port: envVars.REDIS_PORT,
    // password: envVars.REDIS_PASSWORD,
});

