const prisma = require('../config/database');
const AppError = require('../utils/AppError');
const assignmentService = require('./assignment.service');

const teacherSelect = { id: true, fullName: true, email: true };

const classInclude = {
  course: true,
  assignment: { include: { teacher: { select: teacherSelect } } },
};

function toResponse(cls) {
  const { assignment, ...rest } = cls;
  return {
    ...rest,
    teacher: assignment ? assignment.teacher : null,
    assignmentStatus: assignment ? assignment.status : null,
  };
}

async function assertCourseExists(courseId) {
  const course = await prisma.courses.findUnique({ where: { id: courseId } });
  if (!course) throw new AppError('Không tìm thấy môn học', 404);
}

async function findOrFail(id) {
  const cls = await prisma.classes.findUnique({ where: { id }, include: classInclude });
  if (!cls) throw new AppError('Không tìm thấy lớp học', 404);
  return cls;
}

async function list() {
  const rows = await prisma.classes.findMany({ include: classInclude, orderBy: { id: 'asc' } });
  return rows.map(toResponse);
}

async function getById(id) {
  return toResponse(await findOrFail(id));
}

async function create(data) {
  await assertCourseExists(data.courseId);
  return toResponse(await prisma.classes.create({ data, include: classInclude }));
}

async function update(id, data) {
  const current = await findOrFail(id);
  if (data.courseId !== undefined) await assertCourseExists(data.courseId);

  const startTime = data.startTime ?? current.startTime;
  const endTime = data.endTime ?? current.endTime;
  if (endTime <= startTime) {
    throw new AppError('Thời gian kết thúc phải sau thời gian bắt đầu', 400);
  }

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

  return toResponse(await prisma.classes.update({ where: { id }, data, include: classInclude }));
}

async function remove(id) {
  const current = await findOrFail(id);
  if (current.assignment) {
    throw new AppError('Lớp đã được phân công, hãy hủy phân công trước khi xóa', 409);
  }
  await prisma.classes.delete({ where: { id } });
}

module.exports = { list, getById, create, update, remove };
