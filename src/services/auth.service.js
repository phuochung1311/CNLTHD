const prisma = require('../config/database');
const AppError = require('../utils/AppError');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Định nghĩa số vòng lặp và băm mật khẩu (10 vòng)
const saltRounds = 10;

const authSelectFields = {
    id: true,
    email: true,
    fullName: true,
    role: true,
    createdAt: true,
    updatedAt: true,
};


const login = async(data) => {
    const { email, password } = data;

    const user = await prisma.users.findUnique({
        where: { email }
    });

    const isMatch = user && await bcrypt.compare(password, user.password);

    if (!isMatch) {
        throw new AppError('Email hoặc mật khẩu không đúng', 401);
    }

    const token = jwt.sign({ id: user.id, role: user.role }, 
        process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );

    return {
        accessToken: token,
        user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
        }
    };
}

const changePassword = async (userId, data) => {
    const { oldPassword, newPassword } = data;

    const user = await prisma.users.findUnique({
        where: { id: userId },
    });

    const isMatch = user && await bcrypt.compare(oldPassword, user.password);

    if (!isMatch) {
        throw new AppError('Mật khẩu cũ không đúng', 401);
    }

    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    return await prisma.users.update({
        where: { id: userId },
        data: {
            password: hashedPassword,
        },
        select: authSelectFields,
    });

};

module.exports = {
    login,
    changePassword,
};