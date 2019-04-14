// const MONGO_DB_URL = 'cluster0-wduyd.mongodb.net';

module.exports = app => {
    // mongoURI: `mongodb+srv://${process.env.MONGO_DB_USERNAME}:${process.env.MONGO_DB_USER_PWD}@${MONGO_DB_URL}/${process.env.MONGO_DB_NAME}?retryWrites=true`,

    return {
        mongoURI: `mongodb://${process.env.MONGO_DB_USERNAME}:${process.env.MONGO_DB_USER_PWD}@${process.env.MONGO_DB_URL}/${process.env.MONGO_DB_NAME}?${process.env.MONGO_DB_QUERY_PARAMS}`,
        secretOrKey: 'genaroTPalacios'
    }
};