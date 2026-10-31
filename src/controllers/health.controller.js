// Health check CÓ KIỂM TRA CƠ SỞ DỮ LIỆU.
//   200 { status: 'ok',    db: 'up'   }  khi MySQL trả lời trong thời gian cho phép
//   503 { status: 'error', db: 'down' }  khi MySQL lỗi hoặc không trả lời kịp
//
// Dùng 503 (Service Unavailable) thay vì 500 vì máy chủ Express vẫn chạy,
// chỉ là chưa phục vụ được do thiếu một thành phần phụ thuộc (CSDL).
// Response KHÔNG chứa chi tiết lỗi gốc (tránh lộ thông tin hệ thống);
// request id vẫn có ở header X-Request-Id để truy lại log khi cần.
const prisma = require('../config/database');

const DEFAULT_TIMEOUT_MS = 2000;

// Hỏi CSDL bằng câu đơn giản nhất (SELECT 1). Quá thời gian chờ thì coi như CSDL không phản hồi,
// để request không bị treo hàng chục giây khi MySQL đã tắt.
function pingDatabase(timeoutMs) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('Database ping timeout')), timeoutMs);
  });
  return Promise.race([prisma.$queryRaw`SELECT 1`, timeout]).finally(() => clearTimeout(timer));
}

exports.check = async (req, res) => {
  const timeoutMs = Number(process.env.HEALTH_DB_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS;
  const startedAt = Date.now();
  try {
    await pingDatabase(timeoutMs);
    res.status(200).json({
      status: 'ok',
      message: 'Hệ thống Phân công Giảng dạy API đang chạy',
      db: 'up',
      dbLatencyMs: Date.now() - startedAt,
      uptime: Math.round(process.uptime()),
    });
  } catch (err) {
    // TODO: ghi log lỗi gốc bằng logger (pino) của nhóm để truy vết theo requestId
    res.status(503).json({
      status: 'error',
      message: 'Không kết nối được cơ sở dữ liệu',
      db: 'down',
    });
  }
};
