import {DurationInputArg2} from 'moment';

export interface IEnvironment {
    SERVER_PORT: number;
    GOOGLE_CLIENT_ID: string;
    PAYPAL_CLIENT_ID: string;
    PAYPAL_CLIENT_SECRET: string;
    JWT_REFRESH_SECRET: string;
    JWT_SECRET: string;
    ENVIRONMENT: string;
    URL_HOST: string;
    MAX_MEMBERS_PER_GROUP: number;
    MONGO_DB_USER_PWD: string;
    MONGO_DB_USERNAME: string;
    MONGO_DB_URL: string;
    MONGO_DB_QUERY_PARAMS: string;
    SOCKETIO_PATH: string;
    REDIS_HOST: string;
    REDIS_PORT: number;
    REDIS_PASSWORD: string;
    SENDGRID_KEY: string;
    ADMON_EMAIL: string;
    ACCESS_TOKEN_DURATION: number;
    ACCESS_TOKEN_MEASURE: DurationInputArg2;
    REFRESH_TOKEN_DURATION: number;
    REFRESH_TOKEN_MEASURE: DurationInputArg2;
}
