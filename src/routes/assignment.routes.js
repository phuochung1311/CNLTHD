const router = require('express').Router();
const validate = require('../middlewares/validate.middleware');
const { verifyToken, checkRole } = require('../middlewares/auth.middleware');
const schema = require('../validations/assignment.schema');
const ctrl = require('../controllers/assignment.controller');

// Đọc: cần đăng nhập, ADMIN và TEACHER đều xem được. Thứ tự: verifyToken -> validate -> controller
router.get('/', verifyToken, ctrl.list);
router.get('/:id', verifyToken, validate(schema.idParam), ctrl.getById);

// Thao tác ghi: chỉ ADMIN. Thứ tự bắt buộc: verifyToken -> checkRole -> validate -> controller
router.post('/', verifyToken, checkRole('ADMIN'), validate(schema.createAssignment), ctrl.create);
router.delete('/:id', verifyToken, checkRole('ADMIN'), validate(schema.idParam), ctrl.remove);

module.exports = router;