// Nhận schema dạng { body?, params?, query? } (mỗi phần là một schema Zod).
// Ví dụ: validate({ body: z.object({ name: z.string() }) })
//
// Hai điểm khác bản cũ:
// 1. Lỗi không trả response trực tiếp mà chuyển cho error handler (next(error)),
//    để toàn bộ lỗi đi qua một nơi duy nhất.
// 2. Không gán đè req.query: trong Express 5, req.query là getter chỉ đọc.
//    Dữ liệu đã kiểm tra và ép kiểu được đặt vào req.validated
//    (req.validated.body / .params / .query).
const { z } = require('zod');

const validate = (schemas) => {
    const schema = z.object(schemas);
    return (req, res, next) => {
        const result = schema.safeParse({
            body: req.body,
            params: req.params,
            query: req.query,
        });
        if (!result.success) return next(result.error); // ZodError -> error handler -> 400
        req.validated = result.data;
        return next();
    };
};

module.exports = validate;
