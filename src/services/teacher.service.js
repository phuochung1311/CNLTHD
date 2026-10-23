const prisma = require('../config/database');
const AppError = require('../utils/AppError');
const bcrypt = require('bcryptjs');

// Định nghĩa số vòng lặp và băm mật khẩu (10 vòng)
const saltRounds = 10;

const teacherSelectFields = {
    id: true,
    email: true,
    fullName: true,
    role: true,
    createdAt: true,
    updatedAt: true,
};

const getAllTeachers = async () => {
    return await prisma.users.findMany({
        where: { role: 'TEACHER' },
        select: teacherSelectFields,
    });
};

const getTeacherById = async (id) => {
    const teacher = await prisma.users.findFirst({
        where: { id, role: 'TEACHER' },
        select: teacherSelectFields,
    });

    if (!teacher) {
        throw new AppError('Không tìm thấy giảng viên', 404);
    };
    return teacher;
};

const createTeacher = async (data) => {
    const hashedPassword = await bcrypt.hash(data.password, saltRounds);

    const newTeacher = await prisma.users.create({
        data: {
            email: data.email,
            fullName: data.fullName,
            password: hashedPassword,
            role: 'TEACHER',
        },
        select: teacherSelectFields,
    });
    return newTeacher;
};

const updateTeacher = async (id, data) => {
    await getTeacherById(id);
    
    return await prisma.users.update({
        where: { id },
        data,
        select: teacherSelectFields,
    });
};

const updateTeacherPassword = async (id, password) => {
    await getTeacherById(id);
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    return await prisma.users.update({
        where: { id },
        data: {
            password: hashedPassword,
        },
        select: teacherSelectFields,
    });
};

const deleteTeacher = async (id) => {
    await getTeacherById(id);
    await prisma.users.delete({
        where: { id },
    });
    return { id };
};

module.exports = {
    getAllTeachers,
    getTeacherById,
    createTeacher,
    updateTeacher,
    updateTeacherPassword,
    deleteTeacher,
}
