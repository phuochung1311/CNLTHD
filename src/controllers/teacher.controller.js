const teacherService = require('../services/teacher.service');
const { success } = require('../utils/responseFormat');

const getTeachers = async (req, res) => {
    const data = await teacherService.getAllTeachers();
    return success(res, data, 'Lấy danh sách giảng viên thành công');
};

const getTeacher = async (req, res) => {
    const data = await teacherService.getTeacherById(req.validated.params.id);
    return success(res, data, 'Lấy thông tin giảng viên thành công');
};

const createTeacher = async (req, res) => {
    const data = await teacherService.createTeacher(req.validated.body);
    return success(res, data, 'Tạo giảng viên thành công', 201);
};

const updateTeacher = async (req, res) => {
    const data = await teacherService.updateTeacher(
        req.validated.params.id,
        req.validated.body,
    );
    return success(res, data, 'Cập nhật giảng viên thành công');
};

const deleteTeacher = async (req, res) => {
    await teacherService.deleteTeacher(req.validated.params.id);
    return success(res, null, 'Xóa giảng viên thành công');
};

module.exports = {
    getTeachers,
    getTeacher,
    createTeacher,
    updateTeacher,
    deleteTeacher,
};