// Controller mỏng: lấy dữ liệu đã validate -> gọi service -> trả response.
// Không try/catch: Express 5 tự chuyển lỗi của hàm async tới error handler.
const service = require('../services/class.service');
const { success } = require('../utils/responseFormat');

exports.list = async (req, res) => {
  success(res, await service.list());
};

exports.getById = async (req, res) => {
  success(res, await service.getById(req.validated.params.id));
};

exports.create = async (req, res) => {
  success(res, await service.create(req.validated.body), 'Tạo lớp học thành công', 201);
};

exports.update = async (req, res) => {
  const { id } = req.validated.params;
  success(res, await service.update(id, req.validated.body), 'Cập nhật lớp học thành công');
};

exports.remove = async (req, res) => {
  await service.remove(req.validated.params.id);
  success(res, null, 'Đã xóa lớp học');
};