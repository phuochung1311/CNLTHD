const prisma = require('../config/database');
const AppError = require('../utils/AppError');

/**
 * Service quản lý phân công giảng dạy
 */

const include = {
  class: { include: { course: true } },
  teacher: { select: { id: true, fullName: true, email: true } },
};


/**
 * Kiểm tra trùng lịch dạy của giảng viên trong khoảng thời gian [startTime, endTime)
 */
async function findScheduleConflict(teacherId, startTime, endTime, excludeClassId = null) {
  return prisma.assignments.findFirst({
    where: {
      teacherId,
      ...(excludeClassId && { classId: { not: excludeClassId } }),
      class: { startTime: { lt: endTime }, endTime: { gt: startTime } },
    },
    include: { class: true },
  });
}

async function list() {
  return prisma.assignments.findMany({ include, orderBy: { id: 'asc' } });
}

async function getById(id) {
  const assignment = await prisma.assignments.findUnique({ where: { id }, include });
  if (!assignment) throw new AppError('Không tìm thấy phân công', 404);
  return assignment;
}

async function create({ classId, teacherId }) {
  const cls = await prisma.classes.findUnique({ where: { id: classId } });
  if (!cls) throw new AppError('Lớp học không tồn tại', 404);

  const teacher = await prisma.users.findUnique({ where: { id: teacherId } });
  if (!teacher) throw new AppError('Giảng viên không tồn tại', 404);
  if (teacher.role !== 'TEACHER') throw new AppError('Người dùng này không phải giảng viên', 400);

  const taken = await prisma.assignments.findUnique({ where: { classId } });
  if (taken) throw new AppError('Lớp này đã có giảng viên phụ trách', 409);

  const conflict = await findScheduleConflict(teacherId, cls.startTime, cls.endTime);
  if (conflict) {
    throw new AppError(`Giảng viên trùng lịch với lớp ${conflict.class.classCode}`, 409);
  }

  // Giới hạn: mỗi giảng viên dạy tối đa 3 lớp (vượt thì 409)
  const total = await prisma.assignments.count({ where: { teacherId } });
    if (total >= 3) throw new AppError('Giảng viên đã được phân công tối đa 3 lớp', 409);
    // Nếu hai request cùng phân công một lớp cùng lúc, unique classId của DB chặn lại
    // (Prisma ném P2002 -> error handler trả 409). Trùng lịch giảng viên khi chạy đồng
    // thời thì DB chưa chặn được: đây là hạn chế đã biết.
    return prisma.assignments.create({ data: { classId, teacherId }, include });
  }

async function remove(id) {
  await getById(id);
  await prisma.assignments.delete({ where: { id } });
}

module.exports = { list, getById, create, remove, findScheduleConflict };