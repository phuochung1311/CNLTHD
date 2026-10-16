const prisma = require('../config/database');
const AppError = require('../utils/AppError');
const assignmentService = require('./assignment.service');

async function assertCourseExists(courseId) {
  const course = await prisma.courses.findUnique({ where: { id: courseId } });
  if (!course) throw new AppError('Không tìm thấy môn học', 404);
}

async function list() {
  return prisma.classes.findMany({ include: { course: true }, orderBy: { id: 'asc' } });
}

async function getById(id) {
  const cls = await prisma.classes.findUnique({
    where: { id },
    include: { course: true, assignment: true },
  });
  if (!cls) throw new AppError('Không tìm thấy lớp học', 404);
  return cls;
}

async function create(data) {
  await assertCourseExists(data.courseId);
  // Trùng classCode: Prisma ném P2002, error handler tự trả 409.
  return prisma.classes.create({ data, include: { course: true } });
}

async function update(id, data) {
  const current = await getById(id);
  if (data.courseId !== undefined) await assertCourseExists(data.courseId);

  // Zod chỉ so sánh được khi gửi đủ cả hai mốc, nên so lại với dữ liệu hiện có ở đây
  const startTime = data.startTime ?? current.startTime;
  const endTime = data.endTime ?? current.endTime;
  if (endTime <= startTime) {
    throw new AppError('Thời gian kết thúc phải sau thời gian bắt đầu', 400);
  }

  // Sửa giờ của lớp ĐÃ phân công: kiểm tra lại trùng lịch của giảng viên đó
  const timeChanged = data.startTime !== undefined || data.endTime !== undefined;
  if (timeChanged && current.assignment) {
    const conflict = await assignmentService.findScheduleConflict(
      current.assignment.teacherId, startTime, endTime, id
    );
    if (conflict) {
      throw new AppError(
        `Giờ mới trùng lịch của giảng viên với lớp ${conflict.class.classCode}`, 409
      );
    }
  }

  return prisma.classes.update({ where: { id }, data, include: { course: true } });
}

async function remove(id) {
  const current = await getById(id);
  if (current.assignment) {
    throw new AppError('Lớp đã được phân công, hãy hủy phân công trước khi xóa', 409);
  }
  await prisma.classes.delete({ where: { id } });
}

module.exports = { list, getById, create, update, remove };
