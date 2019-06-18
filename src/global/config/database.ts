// const MONGO_DB_URL = 'cluster0-wduyd.mongodb.net';

export default {
    mongoURI: `mongodb://${process.env.MONGO_DB_USERNAME}:${process.env.MONGO_DB_USER_PWD}@${process.env.MONGO_DB_URL}/${process.env.MONGO_DB_NAME}?${process.env.MONGO_DB_QUERY_PARAMS}`,
    secretOrKey: 'genaroTPalacios'
}
