const router = require('express').Router();
const validate = require('../middlewares/validate.middleware');
const { verifyToken, checkRole } = require('../middlewares/auth.middleware');
const schema = require('../validations/assignment.schema');
const ctrl = require('../controllers/assignment.controller');

// GET: chưa yêu cầu đăng nhập (chờ nhóm chốt)
router.get('/', ctrl.list);
router.get('/:id', validate(schema.idParam), ctrl.getById);

// Thao tác ghi: chỉ ADMIN. Thứ tự bắt buộc: verifyToken -> checkRole -> validate -> controller
router.post('/', verifyToken, checkRole('ADMIN'), validate(schema.createAssignment), ctrl.create);
router.delete('/:id', verifyToken, checkRole('ADMIN'), validate(schema.idParam), ctrl.remove);

module.exports = router;