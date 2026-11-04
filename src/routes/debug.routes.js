// Route chỉ để KIỂM CHỨNG cơ chế Tầng 1A (chỉ bật khi NODE_ENV khác production).
// Làm minh chứng báo cáo: "một lỗi async đi qua error handler".
// Xóa file này và dòng đăng ký trong index.js khi đã có route thật.
const router = require('express').Router();
const { z } = require('zod');
const AppError = require('../utils/AppError');
const validate = require('../middlewares/validate.middleware');
const { success } = require('../utils/responseFormat');

// Lỗi nghiệp vụ ném trong hàm async -> error handler -> 409
router.get('/async-error', async () => {
  await Promise.resolve();
  throw new AppError('Lỗi nghiệp vụ mẫu ném từ hàm async', 409);
});

// Lỗi không lường trước -> error handler -> 500, không lộ chi tiết
router.get('/crash', async () => {
  throw new Error('Lỗi không lường trước');
});

// Validation bằng Zod -> sai thì 400
router.post(
  '/validate',
  validate({ body: z.object({ name: z.string().min(1, 'name không được rỗng') }) }),
  (req, res) => success(res, req.validated.body, 'Dữ liệu hợp lệ')
);

module.exports = router;
