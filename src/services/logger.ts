import path from 'path';
import envVars from '../global/environment';
import {config, createLogger, format, transports} from 'winston';

const isDevelopment = envVars.ENVIRONMENT !== 'production';

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
            filename: path.join(baseDir, '/logs/log_api_combined.log'),
        }),
        new transports.File({
            level: 'error',
            maxsize: 12500,
            filename: path.join(baseDir, '/logs/errors.log'),
        }),
    ],
});

if (isDevelopment) {
    logger.add(
        new transports.Console({
            format: format.simple(),
        }),
    );
}

export default logger;
