const router = require('express').Router();
const validate = require('../middlewares/validate.middleware');
const { verifyToken, checkRole } = require('../middlewares/auth.middleware');
const schema = require('../validations/course.schema');
const controller = require('../controllers/course.controller');

// Đọc danh sách và chi tiết môn học không yêu cầu đăng nhập.
router.get('/', controller.list);
router.get('/:id', validate(schema.courseIdParam), controller.getById);

// Chỉ ADMIN được tạo, sửa hoặc xóa danh mục môn học.
router.post('/', verifyToken, checkRole('ADMIN'), validate(schema.createCourse), controller.create);
router.patch('/:id', verifyToken, checkRole('ADMIN'), validate(schema.updateCourse), controller.update);
router.delete('/:id', verifyToken, checkRole('ADMIN'), validate(schema.courseIdParam), controller.remove);

module.exports = router;
