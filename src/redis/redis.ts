import Redis from 'ioredis';
import envVars from '../global/environment';
import {EQueryCache} from '../controllers/enums/EQueryCache';
import {mquery, Query} from 'mongoose';

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

export const getQueryCache = (query: EQueryCache, extra?: string) => {
    return redisClient.get('query-' + query + extra);
};

export const setQueryCache = (query: EQueryCache, extra: string, value: any, expiration: number = 300) => {
    return redisClient.setex('query-' + query + extra, expiration, value);
};

export const clearQueryCache = (query: EQueryCache, extra?: string) => {
    return redisClient.del('query-' + query + extra);
};
//
// export const getCacheIfExist = async <Q extends Query<any>>(
//     mdQuery: Q,
//     query: EQueryCache,
//     extra: string,
//     expiration: number = 1000,
// ) => {
//     let data: Q | string;
//     const cacheObject = await getQueryCache(query, extra);
//     if (!cacheObject) {
//         data = await mdQuery.exec();
//         await setQueryCache(query, extra, JSON.stringify(data), expiration);
//         return data;
//     }
//     return cacheObject;
// };
