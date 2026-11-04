const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');

const verifyToken = (req, res, next) => {
    const [schema, token] = (req.headers.authorization || '').split(' ');

    if (schema !== 'Bearer' || !token) {
        throw new AppError('Thiếu token xác thực', 401);
    }
    
    let payload;
    try {
        payload = jwt.verify(token, process.env.JWT_SECRET);
    }
    catch (err) {
        throw new AppError(err.name === "TokenExpiredError" ? 'Token hết hạn' : 'Token không hợp lệ', 401);
    }

    req.user = { id: payload.id, role: payload.role };
    next();
}

const checkRole = (...roles) => (req, res, next) => {
    if (!req.user) {
        throw new AppError('Chưa xác thực', 401);
    }
    if (!roles.includes(req.user.role)) {
        throw new AppError('Không đủ quyền thực hiện thao tác này', 403)
    }
    next();
}

module.exports = {
    verifyToken,
    checkRole,
};