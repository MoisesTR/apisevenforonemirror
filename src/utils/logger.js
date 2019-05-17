const winston = require('winston');
const {createLogger, format, transports} = winston;
const isDevelopment = (process.env.NODE_ENV || "development") === "development";

module.exports = app => createLogger({
    levels: winston.config.syslog.levels,
    format: format.combine(
        format.colorize()
        , format.timestamp()
        , format.printf( info => `[${info.timestamp}] ${info.level} ${info.message} `)
    )
    , transports: [
        new transports.File({
            maxsize: 512000
            , maxFiles: 5
            , filename: `${app.locals.baseDir}/logs/log_api_combined.log`
        }),
        new transports.File({
            level: 'error',
            filename: `${app.locals.baseDir}/logs/errors.log`
        })
        , new transports.Console({
            level: isDevelopment ?  'debug' : 'error'
        })
    ]
});
