const pino = require('pino');

const logger = pino({
    level: process.env.NODE_ENV === 'test' ? 'silent' : (process.env.LOG_LEVEL || 'info'),
    base: null,
    timestamp: pino.stdTimeFunctions.isoTime,
});

module.exports = logger;