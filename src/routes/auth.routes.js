const router = require('express').Router();
const validate = require('../middlewares/validate.middleware');
const authController = require('../controllers/auth.controller');
const { loginSchema, changePasswordSchema } = require('../validations/auth.schema');
const { verifyToken } = require('../middlewares/auth.middleware');

router.post('/login', validate(loginSchema), authController.login);
router.post('/change-password', verifyToken, validate(changePasswordSchema), authController.changePassword);

module.exports = router;