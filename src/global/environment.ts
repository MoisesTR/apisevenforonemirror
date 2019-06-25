interface IEnvironment {
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
}

const EnvVar: IEnvironment = {
    SERVER_PORT: !!process.env.PORT ? +process.env.PORT : 3000,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "380320064033-bs2uivmdsj2fs5v68h2kg57p5k9kgtv7.apps.googleusercontent.com",
    JWT_SECRET: process.env.JWT_SECRET || "NIC@R46U@",
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "R3@CT_Cl13nt_7X0ne",
    PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID || 'AfDe_RWKoxHwsgbPRCXsuvZDXnIys9hUN56brSbuxZVHdHWHXihW-0IbBeyiTJ7I1aSzYKE_NiRGKI01',
    PAYPAL_CLIENT_SECRET: process.env.PAYPAL_CLIENT_SECRET || 'EEBR4UR-qPQZTX-jVjoFsQweU0ndzkan91Rx_dA0_DplomO_qaE-AJkjTCB2bS5tk0IVZykg7CL_XCOo',
    ENVIRONMENT: process.env.ENVIRONMENT || 'development',
    URL_HOST: process.env.URL_HOST || 'http://localhost:4200',

    // Mongodb connection
    MONGO_DB_USERNAME:  process.env.MONGO_DB_USERNAME || "appuser",
    MONGO_DB_USER_PWD:  process.env.MONGO_DB_USER_PWD || "user",
    MONGO_DB_URL: process.env.MONGO_DB_URL || "127.0.0.1:27017",
    MONGO_DB_QUERY_PARAMS: process.env.MONGO_DB_QUERY_PARAMS || "retryWrites=true",

    // RULE GAME 7X1
    MAX_MEMBERS_PER_GROUP: !!process.env.MAX_MEMBERS_PER_GROUP ? +process.env.MAX_MEMBERS_PER_GROUP: 6,

};

export default EnvVar;
