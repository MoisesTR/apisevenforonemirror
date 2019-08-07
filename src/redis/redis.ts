import Redis from "ioredis";
import envVars from '../global/environment';

console.log('Envvars', envVars)
export const redisPub = new Redis({
    host: envVars.REDIS_HOST,
    port: envVars.REDIS_PORT,
    password: envVars.REDIS_PASSWORD,
    connectTimeout: 25000

});

export const redisSub = new Redis({
    host: envVars.REDIS_HOST,
    port: envVars.REDIS_PORT,
    password: envVars.REDIS_PASSWORD,
    connectTimeout: 25000
});

