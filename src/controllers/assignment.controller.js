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