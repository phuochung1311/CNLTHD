// Error handler tập trung.
// PHẢI đủ 4 tham số (err, req, res, next) thì Express mới coi đây là middleware
// xử lý lỗi, và phải đặt cuối cùng trong app.js.
const { ZodError } = require('zod');
const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
    let statusCode = 500;
    let message = 'Lỗi máy chủ nội bộ';
    let errors = null;

    if (err instanceof ZodError) {
        // Dữ liệu sai theo Zod -> 400, kèm danh sách lỗi theo từng trường
        statusCode = 400;
        message = 'Dữ liệu đầu vào không hợp lệ';
        errors = err.issues.map((issue) => ({
            field: issue.path.length ? issue.path.join('.') : 'body',
            message: issue.message,
        }));
    } 
    else if (err.type === 'entity.parse.failed') {
        // JSON body sai cú pháp
        statusCode = 400;
        message = 'JSON không hợp lệ';
    } 
    else if (err.code === 'P2002') {
        statusCode = 409;
        message = 'Dữ liệu bị trùng (vi phạm unique)';
    } 
    else if (err.code === 'P2025') {
        statusCode = 404;
        message = 'Không tìm thấy bản ghi';
    } 
    else if (err.code === 'P2003') {
        // Bản ghi đang được tham chiếu nên thao tác hiện tại xung đột với dữ liệu liên quan.
        statusCode = 409;
        message = 'Không thể xóa bản ghi vì đang được tham chiếu bởi dữ liệu khác';
    } 
    else if (err.statusCode && err.statusCode < 500) {
        // AppError (hoặc lỗi có statusCode 4xx): message do mình viết nên trả ra an toàn
        statusCode = err.statusCode;
        message = err.message;
        errors = err.errors || null;
    }

    // Log kèm requestId để truy vết. Lỗi 5xx ghi cả stack; chi tiết hệ thống KHÔNG trả ra ngoài.
    if (statusCode >= 500) {
        logger.error({ requestId: req.id, err }, 'Lỗi hệ thống');
    } else {
        logger.warn({ requestId: req.id, statusCode, message }, 'Lỗi nghiệp vụ');
    }

    res.status(statusCode).json({ success: false, message, errors });
};

module.exports = errorHandler;
