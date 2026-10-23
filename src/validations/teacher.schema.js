const { z } = require('zod');

const createTeacherSchema = {
    body: z.object({
        email: z.string().trim().toLowerCase().pipe(z.email("Email không đúng định dạng")),
        password: z.string().min(6, 'Mật khẩu phải từ 6 ký tự trở lên'),
        fullName: z.string().min(1, 'Họ tên không được để trống'),
    }),
};

const updateTeacherSchema = {
    params: z.object({
        id: z.string().regex(/^\d+$/, 'ID phải là số nguyên').transform(Number),
    }),
    body: z.object({
        fullName: z.string().min(1, 'Họ tên không được để trống').optional(),
    }).strict('Chỉ được phép cập nhật họ tên'),
};

const updateTeacherPasswordSchema = {
    params: z.object({
        id: z.string().regex(/^\d+$/, 'ID phải là số nguyên').transform(Number),
    }),
    body: z.object({
        password: z.string().min(6, 'Mật khẩu phải từ 6 ký tự trở lên'),
    }).strict('Chỉ cho phép cập nhật mật khẩu'),
};

const teacherIdParamSchema = {
    params: z.object({
        id: z.string().regex(/^\d+$/, 'ID phải là số nguyên').transform(Number),
    }),
};

module.exports = {
    createTeacherSchema,
    updateTeacherSchema,
    teacherIdParamSchema,
    updateTeacherPasswordSchema,
};