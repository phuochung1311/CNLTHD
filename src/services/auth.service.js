const prisma = require('../config/database');
const AppError = require('../utils/AppError');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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

module.exports = {
    login,
};