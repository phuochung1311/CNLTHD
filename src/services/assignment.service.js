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

    // Unique classId của DB chặn phân công trùng cùng một lớp.
    return tx.assignments.create({ data: { classId, teacherId }, include });
  });
}

async function remove(id) {
  await getById(id);
  await prisma.assignments.delete({ where: { id } });
}

async function updateTeacher(id, teacherId) {
  return prisma.$transaction(async (tx) => {
    const assignment = await tx.assignments.findUnique({
      where: { id },
      include: { class: true },
    });
    if (!assignment) throw new AppError('Không tìm thấy phân công', 404);

    if (teacherId !== assignment.teacherId || assignment.status === 'REJECTED') {
      await tx.$queryRaw`SELECT id FROM Users WHERE id = ${teacherId} FOR UPDATE`;
    }

    const teacher = await tx.users.findUnique({ where: { id: teacherId } });
    if (!teacher) throw new AppError('Giảng viên không tồn tại', 404);
    if (teacher.role !== 'TEACHER') {
      throw new AppError('Người dùng này không phải giảng viên', 400);
    }

    if (teacherId !== assignment.teacherId || assignment.status === 'REJECTED') {
      const assignmentCount = await tx.assignments.count({
        where: { teacherId, status: { in: ACTIVE_STATUSES } },
      });
      if (assignmentCount >= MAX_ASSIGNMENTS_PER_TEACHER) {
        throw new AppError('Giảng viên đã được phân công tối đa 3 lớp', 409);
      }

      const conflict = await findScheduleConflict(
        teacherId,
        assignment.class.startTime,
        assignment.class.endTime,
        assignment.classId,
        tx,
      );
      if (conflict) {
        throw new AppError(`Giảng viên trùng lịch với lớp ${conflict.class.classCode}`, 409);
      }
    }

    return tx.assignments.update({
      where: { id },
      data: { teacherId, status: 'PENDING' },
      include,
    });
  });
}

async function resetToPending(id) {
  return prisma.$transaction(async (tx) => {
    const assignment = await tx.assignments.findUnique({
      where: { id },
      include: { class: true },
    });
    if (!assignment) throw new AppError('Không tìm thấy phân công', 404);
    if (assignment.status !== 'REJECTED') {
      throw new AppError('Chỉ phân công đã bị từ chối mới được đặt lại về chờ', 409);
    }

    await tx.$queryRaw`SELECT id FROM Users WHERE id = ${assignment.teacherId} FOR UPDATE`;

    const assignmentCount = await tx.assignments.count({
      where: { teacherId: assignment.teacherId, status: { in: ACTIVE_STATUSES } },
    });
    if (assignmentCount >= MAX_ASSIGNMENTS_PER_TEACHER) {
      throw new AppError('Giảng viên đã được phân công tối đa 3 lớp', 409);
    }

    const conflict = await findScheduleConflict(
      assignment.teacherId,
      assignment.class.startTime,
      assignment.class.endTime,
      assignment.classId,
      tx,
    );
    if (conflict) {
      throw new AppError(`Giảng viên trùng lịch với lớp ${conflict.class.classCode}`, 409);
    }

    return tx.assignments.update({
      where: { id },
      data: { status: 'PENDING' },
      include,
    });
  });
}

async function changeStatus(id, teacherId, status) {
  const assignment = await getById(id);
  if (assignment.teacherId !== teacherId) {
    throw new AppError('Bạn không có quyền cập nhật phân công này', 403);
  }
  if (assignment.status !== 'PENDING') {
    throw new AppError('Chỉ phân công đang chờ mới có thể cập nhật', 409);
  }

  const result = await prisma.assignments.updateMany({
    where: { id, teacherId, status: 'PENDING' },
    data: { status },
  });
  if (result.count === 0) {
    throw new AppError('Chỉ phân công đang chờ mới có thể cập nhật', 409);
  }

  return getById(id);
}

module.exports = {
  list,
  getById,
  create,
  updateTeacher,
  resetToPending,
  confirm: (id, teacherId) => changeStatus(id, teacherId, 'CONFIRMED'),
  reject: (id, teacherId) => changeStatus(id, teacherId, 'REJECTED'),
  remove,
  findScheduleConflict,
};