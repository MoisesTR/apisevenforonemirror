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
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
    JWT_SECRET: process.env.JWT_SECRET || "NIC@R46U@",
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "R3@CT_Cl13nt_7X0ne",
    PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID || 'AesFU7Gm3IQFQTtJ_T9KW_a6DQIDebT7FBXizSgYhRaeiHxfyv6WoENa1dcbthiFyidViSkzevyTuauh',
    PAYPAL_CLIENT_SECRET: process.env.PAYPAL_CLIENT_SECRET || 'EAPEBKhXVeGjr6hK9a0qro2GR7y7ef2EtcU3A0iRW_PJF1DLuYY9JQ1J7hLp9aonj7G7bfwcK1ISQQI6',
    ENVIRONMENT: process.env.ENVIRONMENT || 'development',
    URL_HOST: process.env.URL_HOST || 'http://localhost:4200',
    // Mongodb connection
    MONGO_DB_USERNAME:  process.env.MONGO_DB_USERNAME || "",
    MONGO_DB_USER_PWD:  process.env.MONGO_DB_USER_PWD || "",
    MONGO_DB_URL: process.env.MONGO_DB_URL || "",
    //
    MAX_MEMBERS_PER_GROUP: !!process.env.MAX_MEMBERS_PER_GROUP ? +process.env.MAX_MEMBERS_PER_GROUP: 6,
    MONGO_DB_QUERY_PARAMS: process.env.MONGO_DB_QUERY_PARAMS || ""
};

export default EnvVar;
