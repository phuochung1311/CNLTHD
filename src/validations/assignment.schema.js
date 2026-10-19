const { z } = require('zod');


const createAssignment = {
    body: z.object({
        classId: z.number().int().positive(),
        teacherId: z.number().int().positive(),
    }),
};

const idParam = {
    params: z.object({
        id: z.coerce.number().int().positive(),
    }),
};

// ID trong request phải là số nguyên dương để tránh truy vấn bản ghi không hợp lệ.
const positiveId = z.coerce.number().int().positive();

// Kiểm tra dữ liệu tạo hoặc cập nhật một phân công giảng dạy.
const assignmentSchema = z.object({
	classId: positiveId,
	teacherId: positiveId,
	status: z.enum(['PENDING', 'CONFIRMED', 'REJECTED']).optional(),
}).strict();

// Kiểm tra dữ liệu lớp học và bảo đảm giờ kết thúc lớn hơn giờ bắt đầu.
const classSchema = z.object({
	classCode: z.string()
		.trim()
		.min(1, 'Mã lớp không được rỗng')
		.regex(/^[A-Z0-9-]+$/, 'Mã lớp phải viết hoa và chỉ gồm A-Z, 0-9 hoặc dấu gạch ngang'),
	courseId: positiveId,
	room: z.string().trim().min(1, 'Phòng học không được rỗng'),
	startTime: z.coerce.date({ message: 'Tiết bắt đầu phải là ngày giờ hợp lệ' }),
	endTime: z.coerce.date({ message: 'Tiết kết thúc phải là ngày giờ hợp lệ' }),
}).strict().superRefine((data, context) => {
	if (data.endTime <= data.startTime) {
		context.addIssue({
			code: z.ZodIssueCode.custom,
			path: ['endTime'],
			message: 'Tiết kết thúc phải lớn hơn tiết bắt đầu',
		});
	}
});

// Schema cho id trên các route dạng /assignments/:id.
const assignmentIdSchema = z.object({
	id: positiveId,
}).strict();

module.exports = {
    createAssignment,
    idParam,
    assignmentSchema,
    classSchema,
    assignmentIdSchema,
};
