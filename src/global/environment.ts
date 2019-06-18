interface IEnvironment {
    SERVER_PORT: number
}

const EnvVar: IEnvironment = {
    SERVER_PORT: !!process.env.PORT ? +process.env.PORT : 3000
};

export default EnvVar;
