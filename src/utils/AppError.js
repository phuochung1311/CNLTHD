// Lỗi nghiệp vụ có kèm HTTP status.
// Service ném ra: throw new AppError('Lớp đã có giảng viên', 409)
// Error handler bắt lại và trả đúng status.
class AppError extends Error {
  constructor(message, statusCode = 400, errors = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

module.exports = AppError;
