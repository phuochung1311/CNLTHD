const authService = require('../services/auth.service');
const { success } = require('../utils/responseFormat');

const login = async (req, res) => {
    const data = await authService.login(req.validated.body);

    return success(res, data, 'Đăng nhập thành công', 200);
};

module.exports = {
    login,
};