const { z } = require('zod');

const id = z.coerce.number().int().positive();

const courseFields = {
    courseCode: z.string()
        .trim()
        .regex(/^[A-Z0-9]+$/, 'Mã môn chỉ gồm chữ HOA và số'),
    name: z.string().trim().min(1, 'Tên môn không được để trống'),
    credits: z.number().int().positive().max(10, 'Số tín chỉ không được lớn hơn 10'),
};

// Kiểm tra dữ liệu bắt buộc khi tạo môn học.
const createCourse = {
    body: z.object(courseFields).strict(),
};

// Kiểm tra dữ liệu cập nhật một phần của môn học.
const updateCourse = {
    params: z.object({ id }),
    body: z.object(courseFields)
        .partial()
        .strict()
        .refine((data) => Object.keys(data).length > 0, {
            message: 'Cần gửi ít nhất một trường để sửa',
        }),
};

// Kiểm tra ID môn học trên các route chi tiết.
const courseIdParam = {
    params: z.object({ id }),
};

module.exports = { createCourse, updateCourse, courseIdParam };
