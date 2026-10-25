const prisma = require('../config/database');
const AppError = require('../utils/AppError');

// Service quản lý phân công giảng dạy.
const ACTIVE_STATUSES = ['PENDING', 'CONFIRMED'];
const MAX_ASSIGNMENTS_PER_TEACHER = 3;

const include = {
  class: { include: { course: true } },
  teacher: { select: { id: true, fullName: true, email: true } },
};
// Hai khoảng thời gian giao nhau khi startA < endB và endA > startB.
async function findScheduleConflict(
  teacherId,
  startTime,
  endTime,
  excludeClassId = null,
  db = prisma,
) {
  return db.assignments.findFirst({
    where: {
      teacherId,
      status: { in: ACTIVE_STATUSES },
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
  return prisma.$transaction(async (tx) => {
    // Khóa giảng viên để các phân công đồng thời phải xếp hàng.
    await tx.$queryRaw`SELECT id FROM Users WHERE id = ${teacherId} FOR UPDATE`;

    const cls = await tx.classes.findUnique({ where: { id: classId } });
    if (!cls) throw new AppError('Lớp học không tồn tại', 404);

    const teacher = await tx.users.findUnique({ where: { id: teacherId } });
    if (!teacher) throw new AppError('Giảng viên không tồn tại', 404);
    if (teacher.role !== 'TEACHER') throw new AppError('Người dùng này không phải giảng viên', 400);

    const taken = await tx.assignments.findUnique({ where: { classId } });
    if (taken) throw new AppError('Lớp này đã có giảng viên phụ trách', 409);

    const assignmentCount = await tx.assignments.count({
      where: { teacherId, status: { in: ACTIVE_STATUSES } },
    });
    if (assignmentCount >= MAX_ASSIGNMENTS_PER_TEACHER) {
      throw new AppError('Giảng viên đã được phân công tối đa 3 lớp', 409);
    }

    const conflict = await findScheduleConflict(
      teacherId,
      cls.startTime,
      cls.endTime,
      null,
      tx,
    );
    if (conflict) {
      throw new AppError(`Giảng viên trùng lịch với lớp ${conflict.class.classCode}`, 409);
    }
    // Giới hạn: mỗi giảng viên dạy tối đa 3 lớp (vượt thì 409)
    const total = await tx.assignments.count({ where: { teacherId } });
    if (total >= 3) throw new AppError('Giảng viên đã được phân công tối đa 3 lớp', 409);
    
    // Unique classId của DB chặn phân công trùng cùng một lớp.
    return tx.assignments.create({ data: { classId, teacherId }, include });
  }, { isolationLevel: 'Serializable' });
}

async function remove(id) {
  await getById(id);
  await prisma.assignments.delete({ where: { id } });
}

module.exports = { list, getById, create, remove, findScheduleConflict };