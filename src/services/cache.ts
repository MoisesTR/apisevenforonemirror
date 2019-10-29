// import mongoose, {DocumentQuery} from 'mongoose';
// import {ICacheOptions} from './interfaces/CacheOptions';
// import {redisClient} from '../redis/redis';
//
// const originalExec = mongoose.Query.prototype.exec;
//
// mongoose.Query.prototype.cache = function(options: ICacheOptions) {
//     mongoose.mquery.ca;
//     this.useCache = true;
//     // Avoid JSON.stringify on typescript
//     this._hashKey = options.key;
//     return this;
// };
//
// mongoose.Query.prototype.exec = async function() {
//     // On nodejs versions older, <= 6.7
//     // Object.assign({}, this.getQuery(), {
//     //     collection: this.mongooseCollection.name
//     // });
//     if (!this.useCache) {
//         return await originalExec.apply(this, arguments);
//     }
//     // Latest node.js versions
//     const key = JSON.stringify({
//         ...this.getQuery(),
//         collection: this.mongooseCollection.name,
//     });
//     // See if we have a value for 'key' in redis
//     const cacheValue = await redisClient.hget(this._hashKey, key);
//
//     // If we do, return that
//     if (cacheValue) {
//         const parsedValue = JSON.parse(cacheValue);
//         console.log('Cache is working', cacheValue);
//         if (Array.isArray(parsedValue)) {
//             return parsedValue.map(d => this.model(d));
//         }
//         return this.model(parsedValue);
//     }
//
//     // Otherwise, issue the query and store the result in redis
//     const result = await originalExec.apply(this, arguments);
//     if (this._hash) redisClient.hset(this._hashKey, key, JSON.stringify(result), 'EX', 30);
//     return result;
// };
//
// module.exports = {
//     clearHash(hashKey) {
//         redisClient.del(JSON.stringify(hashKey));
//     },
// };
