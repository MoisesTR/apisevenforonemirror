const isProduction = process.env.NODE_ENV === 'production';

class AppError extends Error {
    status: number;
    code?: string;
    isOperational: boolean;


    /**
     * @param message string
     * @param status number
     */
    constructor(message: string, status: number, code?: string) {
        super(message);
        this.status = status;
        this.code = isProduction ? (`${status}`.startsWith('4') ? 'fail' : 'error') : code;
        this.isOperational = true;

        // Those set the origin of error, at the line code when the AppError was instanziate
        Error.captureStackTrace(this, this.constructor);
    }
}

export default AppError;
