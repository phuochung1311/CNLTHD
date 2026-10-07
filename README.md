# Hệ thống Phân công Giảng dạy API

Đề tài: Tìm hiểu và xây dựng dịch vụ Backend hệ thống hỗ trợ quản lý và phân công giảng dạy cho các khoa trong trường đại học với Express.js.

## Yêu cầu môi trường
- Node.js: v22.20.0 (xem bằng `node -v`)
- Database: MySQL 8.x (chạy qua XAMPP)

## Hướng dẫn cài đặt
1. Clone dự án về máy.
2. Chạy lệnh `npm install` để tải thư viện.
3. Sao chép `.env.example` thành `.env`, sửa `DATABASE_URL` theo MySQL trên máy (tài khoản cần quyền tạo database vì `prisma migrate dev` dùng database tạm).
4. Bật MySQL trong XAMPP, rồi chạy `npx prisma migrate dev` để tạo bảng (áp dụng các migration có sẵn trong `prisma/migrations`).
5. Chạy server: `npm run dev`.

Server chạy tại `http://localhost:3000`. Các API nằm dưới `/api/v1`.

## Kiểm tra nhanh (dùng Postman)

| Request | Kết quả mong đợi |
|---|---|
| `GET /health` | 200, `{ "status": "ok", ... }` |
| `GET /api/v1/ping` | 200, `pong` |
| `GET /api/v1/khong-ton-tai` | 404, JSON `{ success: false, ... }` |
| `GET /api/v1/debug/async-error` | 409, lỗi ném từ hàm async đi qua error handler |
| `GET /api/v1/debug/crash` | 500, không lộ chi tiết lỗi |
| `POST /api/v1/debug/validate` body `{}` | 400, kèm `errors` theo từng trường |
| `POST /api/v1/debug/validate` body `{"name":"An"}` | 200 |

Các route `/debug` chỉ bật khi `NODE_ENV` khác `production`.

## Định dạng response
- Thành công: `{ "success": true, "message": "...", "data": ... }`
- Thất bại: `{ "success": false, "message": "...", "errors": ... }`

Mã lỗi dùng trong dự án: 400 dữ liệu sai, 401 chưa xác thực, 403 không đủ quyền, 404 không tìm thấy, 409 xung đột (trùng lớp, trùng lịch), 429 quá giới hạn, 500 lỗi hệ thống.

## Tài liệu
- [ERD](docs/erd.md)
- [Sơ đồ đường đi của request](docs/middleware-flow.md)

## Tài khoản Test (Seed)
Sẽ có sau khi hoàn thành file seed ở tuần 2.

## Quy ước làm việc nhóm
- Không commit thẳng vào `main`. Tạo nhánh `<tên của thành viên>` (ví dụ: phuochung, anhkhang...), tạo Pull Request, người khác review rồi mới merge.
- Không commit file `.env` hoặc bất kỳ bí mật nào.