const authService = require('../services/auth.service');
const { success } = require('../utils/responseFormat');

const login = async (req, res) => {
    const data = await authService.login(req.validated.body);

    return success(res, data, 'Đăng nhập thành công', 200);
};

const changePassword = async (req, res) => {
    const data = await authService.changePassword(
        req.user.id,
        req.validated.body
    );

    return success(res, data, 'Đổi mật khẩu thành công');
};

module.exports = {
    login,
    changePassword,
};