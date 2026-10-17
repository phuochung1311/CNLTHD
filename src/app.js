const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const routes = require('./routes');
const errorHandler = require('./middlewares/error.middleware');
const requestLogger = require('./middlewares/requestLogger');
const requestId = require('./middlewares/requestId.middleware');

const app = express();

app.use(requestId);
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Tiêu chí Tuần 1: GET /health trả 200
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Hệ thống Phân công Giảng dạy API đang chạy' });
});

// Gắn router chính
app.use('/api/v1', routes);

// Tiêu chí Tuần 1: Đường dẫn không tồn tại trả 404 dạng JSON
app.use((req, res, next) => {
    res.status(404).json({ success: false, message: 'Đường dẫn không tồn tại' });
});

// Middleware xử lý lỗi tập trung phải nằm cuối cùng
app.use(errorHandler);

module.exports = app;