const router = require('express').Router();
const validate = require('../middlewares/validate.middleware');
const schema = require('../validations/assignment.schema');
const ctrl = require('../controllers/assignment.controller');

router.get('/', ctrl.list);
router.get('/:id', validate(schema.idParam), ctrl.getById);
router.post('/', validate(schema.createAssignment), ctrl.create);
router.delete('/:id', validate(schema.idParam), ctrl.remove);

module.exports = router;