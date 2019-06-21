declare namespace CNodeJs {

    interface Error {
        status: number,
        originalError?: any
        message: string;
    }
}
