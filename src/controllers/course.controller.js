const courseService = require('../services/course.service');
const { success } = require('../utils/responseFormat');

// Trả danh sách môn học.
async function list(req, res) {
    return success(res, await courseService.list());
}

// Trả thông tin một môn học theo ID đã validate.
async function getById(req, res) {
    return success(res, await courseService.getById(req.validated.params.id));
}

// Tạo môn học mới.
async function create(req, res) {
    return success(res, await courseService.create(req.validated.body), 'Tạo môn học thành công', 201);
}

// Cập nhật môn học.
async function update(req, res) {
    return success(
        res,
        await courseService.update(req.validated.params.id, req.validated.body),
        'Cập nhật môn học thành công',
    );
}

// Xóa môn học.
async function remove(req, res) {
    await courseService.remove(req.validated.params.id);
    return success(res, null, 'Xóa môn học thành công');
}

module.exports = { list, getById, create, update, remove };
