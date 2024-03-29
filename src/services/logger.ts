import path from 'path';
import envVars from '../global/environment';
import {config, createLogger, format, transports} from 'winston';

const isDevelopment = envVars.ENVIRONMENT === 'development';

const baseDir = path.resolve(__dirname, '../../');
const logger = createLogger({
    levels: config.syslog.levels,
    format: format.combine(
        format.colorize(),
        format.timestamp(),
        format.printf(
            ({timestamp, level, message, ...rest}) =>
                `[${timestamp}] ${level} ${message} \n meta: ${JSON.stringify(rest)}`,
        ),
    ),
    transports: [
        new transports.File({
            maxsize: 512000,
            maxFiles: 5,
            filename: path.join(baseDir, '/logs/log_api_combined.log'),
        }),
        new transports.File({
            level: 'error',
            filename: path.join(baseDir, '/logs/errors.log'),
        }),
        // , new transports.Console({
        //     level: isDevelopment ? "debug" : "error"
        // })
    ],
});

export default logger;
