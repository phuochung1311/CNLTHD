const router = require('express').Router();
const validate = require('../middlewares/validate.middleware');
const schema = require('../validations/class.schema');
const controller = require('../controllers/class.controller');

// TODO (tuần 3, TV3): thêm verifyToken và checkRole('ADMIN') cho POST, PATCH, DELETE
router.get('/', controller.list);
router.get('/:id', validate(schema.classIdParam), controller.getById);
router.post('/', validate(schema.createClass), controller.create);
router.patch('/:id', validate(schema.updateClass), controller.update);
router.delete('/:id', validate(schema.classIdParam), controller.remove);

module.exports = router;
