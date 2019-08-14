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
