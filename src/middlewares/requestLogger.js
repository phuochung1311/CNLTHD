const logger = require('../utils/logger');

module.exports = (req, res, next) => {
    const start = process.hrtime.bigint();

    res.on('finish', () => {
        const ms = Number(process.hrtime.bigint() - start) / 1e6;
        const status = res.statusCode;
        const level = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';

        logger[level](
            {
                requestId: req.id,
                method: req.method,
                url: req.originalUrl,
                status,
                responseTime: Math.round(ms * 100) / 100,
            },
            'request completed'
        );
    });

    next();
};