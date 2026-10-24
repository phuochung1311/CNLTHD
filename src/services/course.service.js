const prisma = require('../config/database');
const AppError = require('../utils/AppError');

// Lấy danh sách môn học theo thứ tự ID để response ổn định.
async function list() {
    return prisma.courses.findMany({ orderBy: { id: 'asc' } });
}

// Lấy một môn học hoặc trả 404 nếu ID không tồn tại.
async function getById(id) {
    const course = await prisma.courses.findUnique({ where: { id } });
    if (!course) throw new AppError('Không tìm thấy môn học', 404);
    return course;
}

// Tạo môn học; mã môn trùng sẽ được error handler chuyển thành 409.
async function create(data) {
    return prisma.courses.create({ data });
}

// Cập nhật các trường được gửi lên của môn học.
async function update(id, data) {
    await getById(id);
    return prisma.courses.update({ where: { id }, data });
}

// Xóa môn học; P2003 sẽ trả 409 nếu môn còn lớp đang tham chiếu.
async function remove(id) {
    await getById(id);
    await prisma.courses.delete({ where: { id } });
}

module.exports = { list, getById, create, update, remove };
