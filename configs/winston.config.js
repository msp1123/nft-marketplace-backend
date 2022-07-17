const {createLogger, format, transports} = require('winston');
const {combine, timestamp, json} = format;
const logger = createLogger({
    format: format.json(),
    format: combine(
        timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        json(),
    ),
    transports: [
        new transports.File({
            filename: 'logs/combined.log',
            json: true,
            maxsize: 5242880,
        }),
        new transports.File({
            filename: 'logs/info.log',
            level: 'info',
            json: true,
            maxsize: 5242880, 
        }),
        new transports.File({
            filename: 'logs/error.log',
            level: 'error',
            json: true,
            maxsize: 5242880,
        })
    ],
    exitOnError: false,
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new transports.Console({
        format: format.simple(),
        colorize: true,
    }));
}

module.exports.logger = logger;
