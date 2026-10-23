const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const routes = require('./routes');
const errorHandler = require('./middlewares/error.middleware');
const requestLogger = require('./middlewares/requestLogger');
const requestId = require('./middlewares/requestId.middleware');
const { loginRateLimit } = require('./middlewares/rateLimit.middleware');
const AppError = require('./utils/AppError');

const app = express();

app.use(requestId);
app.use(requestLogger);
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Giới hạn request cho API để giảm spam và bảo vệ các endpoint dùng chung.
const apiRateLimit = rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    limit: Number(process.env.RATE_LIMIT_MAX) || 100,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Quá nhiều yêu cầu, vui lòng thử lại sau',
        errors: null,
    },
});

// Tiêu chí Tuần 1: GET /health trả 200
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Hệ thống Phân công Giảng dạy API đang chạy' });
});

// Gắn router chính
app.use('/api/v1/auth/login', loginRateLimit);
app.use('/api/v1', apiRateLimit, routes);

// Tiêu chí Tuần 1: Đường dẫn không tồn tại trả 404 dạng JSON
app.use((req, res, next) => {
    next(new AppError('Đường dẫn không tồn tại', 404));
});

// Middleware xử lý lỗi tập trung phải nằm cuối cùng
app.use(errorHandler);

module.exports = app;