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
        message: "La solicitud tiene formato incorrecto!"
    },
    Unauthorized: {
        status: 401,
        message: "Credenciales de autenticación no validas!"
    },
    Forbidden: {
        status: 403,
        message: "You're missing permission to execute this request."
    }
};
