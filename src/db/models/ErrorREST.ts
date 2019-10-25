export const Errors = {
    BadRequest: {
        status: 400,
        message: 'La solicitud tiene formato incorrecto!',
    },
    NotFound: {
        status: 404,
        message: 'Route not found!',
    },
    Unauthorized: {
        status: 401,
        message: 'Credenciales de autenticación no validas!',
    },
    Forbidden: {
        status: 403,
        message: "You're missing permission to execute this request.",
    },
};
