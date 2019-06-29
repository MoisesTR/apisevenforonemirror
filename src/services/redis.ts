import Redis from "ioredis";
import envVars from '../global/environment';

export const redis = new Redis({
    host: envVars.REDIS_HOST,
    port: envVars.REDIS_PORT,
    // password: envVars.REDIS_PASSWORD,
    db: 0
});

