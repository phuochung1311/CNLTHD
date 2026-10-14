const { z } = require('zod');

const id = z.coerce.number().int().positive();

// Các trường của lớp học. startTime/endTime gửi dạng ISO 8601, nên có múi giờ,
// ví dụ "2026-10-12T07:00:00+07:00" (Prisma lưu DateTime theo UTC).
const fields = {
  classCode: z.string().regex(/^[A-Z0-9]+$/, 'Mã lớp chỉ gồm chữ HOA và số'),
  courseId: z.number().int().positive(),
  room: z.string().trim().min(1, 'Phòng không được rỗng'),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
};

const createClass = {
  body: z.object(fields).refine((d) => d.endTime > d.startTime, {
    message: 'Thời gian kết thúc phải sau thời gian bắt đầu',
    path: ['endTime'],
  }),
};

// PATCH: gửi trường nào sửa trường đó. Nếu gửi cả hai mốc thì kiểm tra tại đây;
// nếu chỉ gửi một mốc thì service so với dữ liệu hiện có.
const updateClass = {
  params: z.object({ id }),
  body: z
    .object(fields)
    .partial()
    .refine((d) => Object.keys(d).length > 0, { message: 'Cần gửi ít nhất một trường để sửa' })
    .refine((d) => !(d.startTime && d.endTime) || d.endTime > d.startTime, {
      message: 'Thời gian kết thúc phải sau thời gian bắt đầu',
      path: ['endTime'],
    }),
};

const classIdParam = { params: z.object({ id }) };

module.exports = { createClass, updateClass, classIdParam };
