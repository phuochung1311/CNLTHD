// Ghi log mỗi request đúng một dòng: method, url, status, thời gian xử lý.
module.exports = (req, res, next) => {
    const start = Date.now();

    // Chờ response gửi xong mới biết status code và tổng thời gian.
    res.on('finish', () => {
        console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms`);
    });

    next();
};