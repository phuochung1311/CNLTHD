const { z } = require('zod');

const loginSchema = {
    body: z.object({
        email: z.string().trim().toLowerCase().pipe(z.email("Email không đúng định dạng")),
        password: z.string().min(1, 'Mật khẩu không được để trống'),
    }),
};

module.exports = {
    loginSchema,
};