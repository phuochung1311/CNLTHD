// Error handler tập trung.
// PHẢI đủ 4 tham số (err, req, res, next) thì Express mới coi đây là middleware
// xử lý lỗi, và phải đặt cuối cùng trong app.js.
const { ZodError } = require('zod');

const errorHandler = (err, req, res, next) => {
    let statusCode = 500;
    let message = 'Lỗi máy chủ nội bộ';
    let errors = null;

    if (err instanceof ZodError) {
        // Dữ liệu sai theo Zod -> 400, kèm danh sách lỗi theo từng trường
        statusCode = 400;
        message = 'Dữ liệu đầu vào không hợp lệ';
        errors = err.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
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
        statusCode = 400;
        message = 'Khóa ngoại không hợp lệ';
    } 
    else if (err.statusCode && err.statusCode < 500) {
        // AppError (hoặc lỗi có statusCode 4xx): message do mình viết nên trả ra an toàn
        statusCode = err.statusCode;
        message = err.message;
        errors = err.errors || null;
    }

    // Chỉ log lỗi 5xx, và KHÔNG trả chi tiết lỗi hệ thống ra ngoài
    if (statusCode >= 500) console.error('Lỗi hệ thống:', err);

    res.status(statusCode).json({ success: false, message, errors });
};

module.exports = errorHandler;
