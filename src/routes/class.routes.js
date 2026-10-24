const router = require('express').Router();
const validate = require('../middlewares/validate.middleware');
const { verifyToken, checkRole } = require('../middlewares/auth.middleware');
const schema = require('../validations/class.schema');
const controller = require('../controllers/class.controller');

// GET: chưa yêu cầu đăng nhập (chờ nhóm chốt)
router.get('/', controller.list);
router.get('/:id', validate(schema.classIdParam), controller.getById);

// Thao tác ghi: chỉ ADMIN. Thứ tự bắt buộc: verifyToken -> checkRole -> validate -> controller
router.post('/', verifyToken, checkRole('ADMIN'), validate(schema.createClass), controller.create);
router.patch('/:id', verifyToken, checkRole('ADMIN'), validate(schema.updateClass), controller.update);
router.delete('/:id', verifyToken, checkRole('ADMIN'), validate(schema.classIdParam), controller.remove);

module.exports = router;