const assignmentService = require('../services/assignment.service');
const { success } = require('../utils/responseFormat');

exports.list = async (req, res) => {
  success(res, await assignmentService.list());
};

exports.getById = async (req, res) => {
  success(res, await assignmentService.getById(req.validated.params.id));
};

exports.create = async (req, res) => {
  success(
    res,
    await assignmentService.create(req.validated.body),
    'Phân công thành công',
    201
  );
};

exports.remove = async (req, res) => {
  await assignmentService.remove(req.validated.params.id);
  success(res, null, 'Xóa phân công thành công');
};

exports.updateTeacher = async (req, res) => {
  success(
    res,
    await assignmentService.updateTeacher(req.validated.params.id, req.validated.body.teacherId),
    'Cập nhật giảng viên thành công',
  );
};

exports.resetStatus = async (req, res) => {
  success(
    res,
    await assignmentService.resetToPending(req.validated.params.id),
    'Đã đặt lại phân công về trạng thái chờ',
  );
};

exports.confirm = async (req, res) => {
  success(
    res,
    await assignmentService.confirm(req.validated.params.id, req.user.id),
    'Đã chấp nhận phân công',
  );
};

exports.reject = async (req, res) => {
  success(
    res,
    await assignmentService.reject(req.validated.params.id, req.user.id),
    'Đã từ chối phân công',
  );
};