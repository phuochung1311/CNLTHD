const router = require('express').Router();

router.get('/ping', (req, res) => res.json({ success: true, message: 'pong' }));

// Route kiểm chứng, chỉ bật khi không phải production
if (process.env.NODE_ENV !== 'production') {
    router.use('/debug', require('./debug.routes'));
}

// Sau này TV1, TV2, TV3 sẽ gắn các route con vào đây. Ví dụ:
router.use('/classes', require('./class.routes'));

module.exports = router;
