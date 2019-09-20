import {DurationInputArg2} from 'moment';
import {IEnvironment} from './interfaces/Environment';

const EnvVar: IEnvironment = {
    SERVER_PORT: !!process.env.PORT ? +process.env.PORT : 3000,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '380320064033-bs2uivmdsj2fs5v68h2kg57p5k9kgtv7.apps.googleusercontent.com',
    JWT_SECRET: process.env.JWT_SECRET || 'NIC@R46U@',
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'R3@CT_Cl13nt_7X0ne',
    PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID || 'AZhi6Hy8TF46gXXeLiUZmtFIPhQRQx1-x9M4T1jDMUtHqHNO5iahzV6kzL6SBJxHgudgYafDeBoSECs8',
    PAYPAL_CLIENT_SECRET:
        process.env.PAYPAL_CLIENT_SECRET || 'EIIUo6JixXN5Oc0Bs07Ap0OYE_CSFWz_ur7xjqDfH8a24QO3y_nm4SzxV0F1abvXq8-le6Zy1sbQIAA2',
    ENVIRONMENT: process.env.ENVIRONMENT || 'development',
    URL_HOST: process.env.URL_HOST || 'http://localhost:4200',

    // Mongodb connection
    MONGO_DB_USERNAME: process.env.MONGO_DB_USERNAME || 'appuser',
    MONGO_DB_USER_PWD: process.env.MONGO_DB_USER_PWD || 'user',
    MONGO_DB_URL: process.env.MONGO_DB_URL || '127.0.0.1:27017',
    MONGO_DB_QUERY_PARAMS: process.env.MONGO_DB_QUERY_PARAMS || 'retryWrites=true',

    // RULE GAME 7X1
    MAX_MEMBERS_PER_GROUP: !!process.env.MAX_MEMBERS_PER_GROUP ? +process.env.MAX_MEMBERS_PER_GROUP : 6,
    // Custom Path from sockets
    SOCKETIO_PATH: process.env.SOCKETIO_PATH || '/socket10',
    // Redis host and Credentias
    REDIS_HOST: process.env.REDIS_HOST || 'localhost',
    REDIS_PORT: !!process.env.REDIS_PORT ? +process.env.REDIS_PORT : 6379,
    REDIS_PASSWORD: process.env.REDIS_PASSWORD || 'jose12',
    // Email EnvVars
    SENDGRID_KEY: process.env.SENDGRID_KEY || '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',
    ADMON_EMAIL: process.env.ADMON_EMAIL || 'atomicdevelopersnic@gmail.com',
    WINNER_NOTIFICATION: process.env.WINNER_NOTIFICATION || "d-5bc417d2fd764bfba24331550227d732",
    RECOVER_ACCOUNT: process.env.RECOVER_ACCOUNT || "d-72f36268236e4ef08dfef3807c9b6508",
    CONFIRM_EMAIL: process.env.CONFIRM_EMAIL || "d-3f1db392e2b94207b174951603163934",
    NO_REPLY_EMAIL: process.env.NO_REPLY_EMAIL  || "no-reply@seven.com",
    // Tokens config
    ACCESS_TOKEN_DURATION: !!process.env.ACCESS_TOKEN_DURATION  ? +process.env.ACCESS_TOKEN_DURATION : 1,
    ACCESS_TOKEN_MEASURE: process.env.ACCESS_TOKEN_MEASURE as DurationInputArg2 || 'minute',
    REFRESH_TOKEN_DURATION:!!process.env.REFRESH_TOKEN_DURATION  ? +process.env.REFRESH_TOKEN_DURATION : 2,
    REFRESH_TOKEN_MEASURE: process.env.REFRESH_TOKEN_MEASURE as DurationInputArg2  || 'minutes'
};

export default EnvVar;
