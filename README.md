# Hệ thống Phân công Giảng dạy API

Đề tài: Tìm hiểu và xây dựng dịch vụ Backend hệ thống hỗ trợ quản lý và phân công giảng dạy cho các khoa trong trường đại học với Express.js 5.

Công nghệ: Node.js (JavaScript, CommonJS), Express 5, Prisma 5 + MySQL, Zod 4 (kiểm tra dữ liệu), JWT + bcryptjs (xác thực), helmet, cors, express-rate-limit, pino (log), Jest 30 + Supertest (kiểm thử).

## Yêu cầu môi trường
- Node.js v22 LTS (xem bằng `node -v`)
- Database: MySQL 8.x (chạy qua XAMPP; xem phiên bản bằng câu lệnh SQL `SELECT VERSION();`)

## Hướng dẫn cài đặt
1. Clone dự án về máy.
2. Chạy lệnh `npm install` để tải thư viện.
3. Sao chép `.env.example` thành `.env`, rồi sửa:
   - `DATABASE_URL` theo MySQL trên máy (tài khoản cần quyền tạo database vì `prisma migrate dev` dùng database tạm).
   - `JWT_SECRET`: **bắt buộc**, thiếu thì server không khởi động (cách tạo ở mục Biến môi trường).
4. Bật MySQL trong XAMPP, rồi chạy `npx prisma migrate dev` để tạo bảng (áp dụng các migration có sẵn trong `prisma/migrations`).
5. Nạp dữ liệu mẫu: `npx prisma db seed`.
6. Chạy server: `npm run dev` (hoặc `npm start`).

Server chạy tại `http://localhost:3000` (hoặc cổng đặt bằng `PORT` trong `.env`). Các API nằm dưới `/api/v1`.

## Biến môi trường (`.env`)

| Biến | Ý nghĩa |
|---|---|
| `DATABASE_URL` | Chuỗi kết nối MySQL |
| `PORT` | Cổng chạy server |
| `JWT_SECRET` | **Bắt buộc.** Khóa ký token; thiếu thì server dừng ngay khi khởi động |
| `JWT_EXPIRES_IN` | Thời hạn token, ví dụ `1h` (mặc định `1h`) |
| `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX` | Giới hạn số request tới `/api/v1` trong một khoảng thời gian (mặc định 100 request mỗi 15 phút) |
| `NODE_ENV` | Tùy chọn. Khác `production` thì bật các route `/debug` |
| `LOG_LEVEL` | Tùy chọn. Mức log của pino |

Tạo `JWT_SECRET` ngẫu nhiên rồi dán vào `.env`. Mỗi người tự tạo khóa riêng, không chia sẻ khóa qua chat hay GitHub:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Lưu ý: `node --watch` không theo dõi file `.env`, nên sửa `.env` xong phải khởi động lại server.

## Lệnh npm

| Lệnh | Tác dụng |
|---|---|
| `npm start` | Chạy server (`node server.js`) |
| `npm run dev` | Chạy server và tự khởi động lại khi sửa mã (`node --watch server.js`) |
| `npm test` | Chạy kiểm thử (Jest) |

Migration và dữ liệu mẫu chạy trực tiếp bằng `npx prisma migrate dev` và `npx prisma db seed`.

## Cấu trúc thư mục

```text
server.js              Điểm khởi động: nạp .env, kiểm tra JWT_SECRET, lắng nghe cổng
src/
  app.js               Khai báo chuỗi middleware và gắn router (/api/v1)
  config/database.js   Khởi tạo Prisma Client
  routes/              Khai báo endpoint và chuỗi middleware của từng route
  controllers/         Nhận request, gọi service, trả response
  services/            Nghiệp vụ và truy cập CSDL
  validations/         Schema Zod
  middlewares/         auth, error, requestId, requestLogger, validate
  utils/               AppError, logger, responseFormat
prisma/                schema.prisma, migrations, seed.js
tests/                 Kiểm thử Jest + Supertest
docs/                  Tài liệu (xem mục Tài liệu)
```

## Tài khoản Test (Seed)
Mật khẩu của mọi tài khoản: `123456`. Các tài khoản này chỉ dùng cho môi trường phát triển, không dùng ở môi trường thật.

| Vai trò | Email |
|---|---|
| Admin (Trưởng khoa) | `admin@uni.edu` |
| Giảng viên | `teacher1@uni.edu` |
| Giảng viên | `teacher2@uni.edu` |

Dữ liệu mẫu còn có 2 môn (`WEB101`, `DB201`) và 4 lớp. `WEB101A` và `WEB101B` có giờ học giao nhau để thử ca trùng lịch.

## Xác thực và phân quyền

Đăng nhập để lấy token:

```http
POST /api/v1/auth/login
Content-Type: application/json

{ "email": "admin@uni.edu", "password": "123456" }
```

Response thành công có `data.accessToken` và thông tin người dùng (id, email, fullName, role). Các request cần đăng nhập gửi kèm header:

```text
Authorization: Bearer <accessToken>
```

Token hết hạn sau thời gian `JWT_EXPIRES_IN`; khi đó đăng nhập lại.

| Nhóm route | Yêu cầu |
|---|---|
| `/auth/login`, `/health`, `/api/v1/ping` | Không cần token |
| `/teachers` (mọi method) | Token ADMIN |
| `/classes`, `/assignments`: POST, PATCH, DELETE | Token ADMIN |
| `/classes`, `/assignments`: GET | Chưa yêu cầu token |

Mã lỗi xác thực: 401 (thiếu token, token sai hoặc hết hạn, sai email hoặc mật khẩu), 403 (token hợp lệ nhưng không phải ADMIN), 429 (vượt giới hạn số request).

## API

Chi tiết request và response của phân công (assignments): [docs/API.md](docs/API.md).

### Đăng nhập (`/api/v1/auth`)

| Method | Đường dẫn | Mô tả | Quyền | Lỗi chính |
|---|---|---|---|---|
| POST | `/auth/login` | Đăng nhập, nhận token | Công khai | 400, 401, 429 |

### Lớp học (`/api/v1/classes`)

| Method | Đường dẫn | Mô tả | Quyền | Lỗi chính |
|---|---|---|---|---|
| GET | `/classes` | Danh sách lớp (kèm môn học) | Công khai | |
| GET | `/classes/:id` | Chi tiết lớp | Công khai | 400, 404 |
| POST | `/classes` | Tạo lớp | ADMIN | 400, 401, 403, 404 (môn không tồn tại), 409 (trùng mã lớp) |
| PATCH | `/classes/:id` | Sửa lớp (gửi trường nào sửa trường đó; đổi giờ sẽ kiểm tra trùng lịch giảng viên) | ADMIN | 400, 401, 403, 404, 409 |
| DELETE | `/classes/:id` | Xóa lớp (không xóa được nếu đã phân công) | ADMIN | 401, 403, 404, 409 |

Ví dụ body tạo lớp (`startTime`, `endTime` dùng ISO 8601 có múi giờ; kèm header `Authorization`):

```json
{
  "classCode": "WEB102A",
  "courseId": 1,
  "room": "A105",
  "startTime": "2026-10-15T07:00:00+07:00",
  "endTime": "2026-10-15T10:00:00+07:00"
}
```

Quy tắc: `classCode` chỉ gồm chữ HOA và số (không dấu cách, không dấu gạch ngang); `endTime` phải sau `startTime`. Thời gian trong response theo UTC (hậu tố `Z`).

### Giảng viên (`/api/v1/teachers`)

| Method | Đường dẫn | Mô tả | Quyền | Lỗi chính |
|---|---|---|---|---|
| GET | `/teachers` | Danh sách giảng viên | ADMIN | 401, 403 |
| POST | `/teachers` | Tạo giảng viên (mật khẩu được băm bcrypt, không trả về) | ADMIN | 400, 401, 403, 409 (trùng email) |
| GET | `/teachers/:id` | Chi tiết giảng viên | ADMIN | 400, 401, 403, 404 |
| PATCH | `/teachers/:id` | Sửa giảng viên (hiện chỉ sửa `fullName`) | ADMIN | 400, 401, 403, 404 |
| DELETE | `/teachers/:id` | Xóa giảng viên | ADMIN | 400, 401, 403, 404 |

### Phân công (`/api/v1/assignments`)

| Method | Đường dẫn | Mô tả | Quyền | Lỗi chính |
|---|---|---|---|---|
| GET | `/assignments` | Danh sách phân công | Công khai | |
| GET | `/assignments/:id` | Chi tiết phân công | Công khai | 400, 404 |
| POST | `/assignments` | Phân công giảng viên cho lớp | ADMIN | 400, 401, 403, 404, 409 |
| DELETE | `/assignments/:id` | Xóa phân công | ADMIN | 400, 401, 403, 404 |

Quy tắc phân công: mỗi lớp chỉ có một giảng viên; giảng viên không được trùng lịch; mỗi giảng viên dạy tối đa 3 lớp (vi phạm trả 409). Phân công mới có `status = PENDING`; hiện chưa có endpoint đổi `status`.

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
| `POST /api/v1/auth/login` đúng tài khoản seed | 200, có `data.accessToken` |
| `POST /api/v1/auth/login` sai mật khẩu | 401 |
| `POST /api/v1/classes` không có token | 401 |
| `POST /api/v1/classes` với token giảng viên | 403 |
| `POST /api/v1/classes` với token Admin, body hợp lệ | 201 |
| `GET /api/v1/teachers` không có token | 401 |

Các route `/debug` chỉ bật khi `NODE_ENV` khác `production`.

## Định dạng response
- Thành công: `{ "success": true, "message": "...", "data": ... }`
- Thất bại: `{ "success": false, "message": "...", "errors": ... }`
- Mọi response có header `X-Request-Id`; khi báo lỗi, gửi kèm giá trị này để truy lại log.

Mã lỗi dùng trong dự án: 400 dữ liệu sai, 401 chưa xác thực, 403 không đủ quyền, 404 không tìm thấy, 409 xung đột (trùng lớp, trùng lịch), 429 quá giới hạn, 500 lỗi hệ thống.

## Chạy kiểm thử

```bash
npm test
```

Các bài kiểm thử hiện có (Jest + Supertest) không cần kết nối CSDL thật và tự đặt `JWT_SECRET` riêng.

## Lỗi thường gặp

| Triệu chứng | Cách xử lý |
|---|---|
| Server dừng ngay với thông báo `Thiếu JWT_SECRET trong .env` | Thêm `JWT_SECRET` vào `.env` (mục Biến môi trường) rồi chạy lại |
| `prisma migrate dev` báo không có quyền tạo database | Dùng tài khoản MySQL có quyền tạo database trong `DATABASE_URL` |
| Gọi API ghi bị 401 | Đăng nhập lấy token và gửi header `Authorization: Bearer <accessToken>`; token hết hạn thì đăng nhập lại |
| Gọi API ghi bị 403 | Tài khoản không phải ADMIN, đăng nhập bằng `admin@uni.edu` |
| Bị 429 | Đã vượt giới hạn số request; đợi hết khoảng `RATE_LIMIT_WINDOW_MS` hoặc tăng `RATE_LIMIT_MAX` rồi khởi động lại |
| Đăng nhập đúng mật khẩu vẫn 401 | CSDL cũ còn mật khẩu chưa băm: chạy `npx prisma migrate reset` (xóa toàn bộ dữ liệu trên máy bạn, chạy lại migration và seed) |

## Tài liệu
- [ERD](docs/erd.md)
- [Sơ đồ đường đi của request](docs/middleware-flow.md)
- [Sơ đồ request chức năng phân công](docs/assignment-request-flow.md)
- [Tài liệu API (phân công)](docs/API.md)
- [Kết quả kiểm thử của TV2](docs/tv2-kqtest.md)
- [Checklist bảo mật](security-checklist.md)

## Quy ước làm việc nhóm
- Không commit thẳng vào `main`. Tạo nhánh `<tên của thành viên>` (ví dụ: phuochung, anhkhang...), tạo Pull Request, người khác review rồi mới merge.
- Trước khi mở Pull Request: lấy bản mới của `main` về, merge vào nhánh của mình rồi chạy `npm test`.
- Không commit file `.env` hoặc bất kỳ bí mật nào.