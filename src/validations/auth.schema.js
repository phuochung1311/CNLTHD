const { z } = require('zod');

const loginSchema = {
    body: z.object({
        email: z.string().trim().toLowerCase().pipe(z.email("Email không đúng định dạng")),
        password: z.string().min(1, 'Mật khẩu không được để trống'),
    }),
};

const changePasswordSchema = {
    body: z.object({
        oldPassword: z.string().min(6, 'Mật khẩu phải từ 6 ký tự trở lên'),
        newPassword: z.string().min(6, 'Mật khẩu phải từ 6 ký tự trở lên'),
    }),
}

module.exports = {
    loginSchema,
    changePasswordSchema,
};