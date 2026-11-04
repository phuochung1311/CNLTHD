const { randomUUID } = require('crypto');

// Chỉ nhận id gồm chữ, số, '.', '_', '-', dài 1-64 ký tự.
const VALID_ID = /^[A-Za-z0-9._-]{1,64}$/;

module.exports = (req, res, next) => {
    const incoming = req.get('X-Request-Id');
    const id = incoming && VALID_ID.test(incoming) ? incoming : randomUUID();

    req.id = id;
    res.setHeader('X-Request-Id', id);
    next();
};