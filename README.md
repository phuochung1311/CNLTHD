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
5. Nạp dữ liệu mẫu: `npx prisma db seed`.
6. Chạy server: `npm run dev`.

Server chạy tại `http://localhost:3000`. Các API nằm dưới `/api/v1`.

## Tài khoản Test (Seed)
Mật khẩu của mọi tài khoản: `123456`.

| Vai trò | Email |
|---|---|
| Admin (Trưởng khoa) | `admin@uni.edu` |
| Giảng viên | `teacher1@uni.edu` |
| Giảng viên | `teacher2@uni.edu` |

Dữ liệu mẫu còn có 2 môn (`WEB101`, `DB201`) và 4 lớp. `WEB101A` và `WEB101B` có giờ học giao nhau để thử ca trùng lịch.

## API lớp học (`/api/v1/classes`)

| Method | Đường dẫn | Mô tả | Lỗi chính |
|---|---|---|---|
| GET | `/classes` | Danh sách lớp (kèm môn học) | |
| GET | `/classes/:id` | Chi tiết lớp | 404 |
| POST | `/classes` | Tạo lớp | 400, 404 (môn không tồn tại), 409 (trùng mã lớp) |
| PATCH | `/classes/:id` | Sửa lớp (gửi trường nào sửa trường đó) | 400, 404, 409 |
| DELETE | `/classes/:id` | Xóa lớp (không xóa được nếu đã phân công) | 404, 409 |

Ví dụ body tạo lớp (`startTime`, `endTime` dùng ISO 8601 có múi giờ):

```json
{
  "classCode": "WEB102A",
  "courseId": 1,
  "room": "A105",
  "startTime": "2026-10-15T07:00:00+07:00",
  "endTime": "2026-10-15T10:00:00+07:00"
}
```

Quy tắc: `classCode` chỉ gồm chữ HOA và số; `endTime` phải sau `startTime`.

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
| `POST /api/v1/debug/validate` body `{abc` | 400, "JSON không hợp lệ" |

Các route `/debug` chỉ bật khi `NODE_ENV` khác `production`.

## Định dạng response
- Thành công: `{ "success": true, "message": "...", "data": ... }`
- Thất bại: `{ "success": false, "message": "...", "errors": ... }`

Mã lỗi dùng trong dự án: 400 dữ liệu sai, 401 chưa xác thực, 403 không đủ quyền, 404 không tìm thấy, 409 xung đột (trùng lớp, trùng lịch), 429 quá giới hạn, 500 lỗi hệ thống.

## Tài liệu
- [ERD](docs/erd.md)
- [Sơ đồ đường đi của request](docs/middleware-flow.md)

## Quy ước làm việc nhóm
- Không commit thẳng vào `main`. Tạo nhánh `<tên của thành viên>` (ví dụ: phuochung, anhkhang...), tạo Pull Request, người khác review rồi mới merge.
- Không commit file `.env` hoặc bất kỳ bí mật nào.
