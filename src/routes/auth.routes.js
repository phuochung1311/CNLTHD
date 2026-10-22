const router = require('express').Router();
const validate = require('../middlewares/validate.middleware');
const authController = require('../controllers/auth.controller');
const { loginSchema } = require('../validations/auth.schema');

router.post('/login', validate(loginSchema), authController.login);

module.exports = router;