const rateLimit = require('express-rate-limit');

// Giới hạn riêng cho login để giảm thử mật khẩu tự động mà không ảnh hưởng API khác.
const loginRateLimit = rateLimit({
    windowMs: Number(process.env.LOGIN_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    limit: Number(process.env.LOGIN_RATE_LIMIT_MAX) || 5,
    // Đăng nhập thành công không làm giảm số lượt thử sai còn lại.
    skipSuccessfulRequests: true,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Quá nhiều lần đăng nhập thất bại, vui lòng thử lại sau 15 phút',
        errors: null,
    },
});

module.exports = { loginRateLimit };
