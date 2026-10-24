const router = require('express').Router();
const validate = require('../middlewares/validate.middleware');
const teacherController = require('../controllers/teacher.controller');
const {
    createTeacherSchema,
    updateTeacherSchema,
    teacherIdParamSchema,
    updateTeacherPasswordSchema,
} = require('../validations/teacher.schema');
const { verifyToken, checkRole } = require('../middlewares/auth.middleware');

router.use(verifyToken);
router.use(checkRole('ADMIN'));

router.get('/', teacherController.getTeachers);
router.post('/', validate(createTeacherSchema), teacherController.createTeacher);
router.get('/:id', validate(teacherIdParamSchema), teacherController.getTeacher);
router.patch('/:id', validate(updateTeacherSchema), teacherController.updateTeacher);
router.delete('/:id', validate(teacherIdParamSchema), teacherController.deleteTeacher);
router.patch('/:id/password', validate(updateTeacherPasswordSchema), teacherController.updateTeacherPassword);

module.exports = router;