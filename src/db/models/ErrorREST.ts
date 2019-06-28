export class ErrorREST extends Error {
    public status?: number;
    public response: { status: number; message: string; detail: string };

    constructor(error: { status: number, message: string }, detail: string = '', ...args: any) {
        super(...args);
        this.response = {status: error.status, message: error.message, detail: detail};
    }
}

export const Errors = {
    BadRequest: {
        status: 400,
        message: "Request has wrong format."
    },
    Unauthorized: {
        status: 401,
        message: "Authentication credentials not valid."
    },
    Forbidden: {
        status: 403,
        message: "You're missing permission to execute this request."
    }
};
