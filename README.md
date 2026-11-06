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
| `LOGIN_RATE_LIMIT_WINDOW_MS`, `LOGIN_RATE_LIMIT_MAX` | Giới hạn riêng số lần đăng nhập thất bại (mặc định 5 lần mỗi 15 phút; lần đăng nhập thành công không bị tính) |
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
  middlewares/         auth, error, rateLimit, requestId, requestLogger, validate
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
| Giảng viên (Nguyễn Văn A) | `teacher1@uni.edu` |
| Giảng viên (Trần Thị B) | `teacher2@uni.edu` |
| Giảng viên (Lê Văn C) | `teacher3@uni.edu` |
| Giảng viên (Phạm Thị D) | `teacher4@uni.edu` |

### Bảng `COURSES`

Seed tạo 4 môn học:

| Mã môn | Tên môn | Số tín chỉ |
|---|---|---:|
| `WEB101` | Lập trình Web | 3 |
| `DB201` | Cơ sở dữ liệu | 3 |
| `NET301` | Mạng máy tính | 3 |
| `ALG202` | Cấu trúc dữ liệu và giải thuật | 4 |

### Bảng `CLASSES`

Seed tạo 12 lớp. Giờ dưới đây theo múi giờ `+07:00`; khi lưu vào MySQL/Prisma, `DateTime` được chuyển về UTC.

| Mã lớp | Mã môn | Phòng | Thời gian | Trạng thái phân công / mục đích kiểm thử |
|---|---|---|---|---|
| `WEB101A` | `WEB101` | `A101` | 12/10, 07:00-10:00 | `CONFIRMED` bởi teacher2; dùng thử từ chối assignment đã xác nhận |
| `WEB101B` | `WEB101` | `A102` | 12/10, 09:00-12:00 | Chưa phân công; giao với `WEB101A`, thử lỗi trùng lịch |
| `WEB101D` | `WEB101` | `A104` | 12/10, 10:00-12:00 | Chưa phân công; liền kề `WEB101A`, không bị xem là trùng lịch |
| `ALG202A` | `ALG202` | `B203` | 13/10, 13:00-16:00 | `PENDING` bởi teacher2; dùng thử confirm/reject |
| `WEB101C` | `WEB101` | `A103` | 14/10, 07:00-10:00 | `CONFIRMED` bởi teacher1 |
| `DB201A` | `DB201` | `B201` | 14/10, 07:00-10:00 | `REJECTED` bởi teacher3; reset sẽ lỗi trùng lịch |
| `NET301A` | `NET301` | `C301` | 14/10, 08:00-11:00 | `CONFIRMED` bởi teacher3 |
| `DB201B` | `DB201` | `B202` | 15/10, 13:00-16:00 | `CONFIRMED` bởi teacher1 |
| `NET301B` | `NET301` | `C302` | 16/10, 07:00-10:00 | `PENDING` bởi teacher1; teacher1 đã đủ 3 lớp hoạt động |
| `ALG202B` | `ALG202` | `B204` | 19/10, 07:00-10:00 | `REJECTED` bởi teacher4; reset thành công |
| `DB201C` | `DB201` | `B205` | 21/10, 13:00-16:00 | Chưa phân công; dùng thử xóa lớp/phân công |
| `NET301C` | `NET301` | `C303` | 22/10, 07:00-10:00 | Chưa phân công; gán cho teacher1 sẽ vượt giới hạn 3 lớp |

### Bảng `ASSIGNMENTS`

Seed tạo 8 phân công. Mỗi lớp chỉ có tối đa một phân công vì `Assignments.classId` là `UNIQUE`. Chỉ `PENDING` và `CONFIRMED` được tính vào giới hạn 3 lớp và kiểm tra trùng lịch.

| Mã lớp | Giảng viên | Trạng thái | Mục đích kiểm thử |
|---|---|---|---|
| `WEB101C` | `teacher1@uni.edu` | `CONFIRMED` | Lớp hoạt động của teacher1 |
| `DB201B` | `teacher1@uni.edu` | `CONFIRMED` | Lớp hoạt động của teacher1 |
| `NET301B` | `teacher1@uni.edu` | `PENDING` | Teacher1 đã đủ 3 lớp hoạt động |
| `WEB101A` | `teacher2@uni.edu` | `CONFIRMED` | Từ chối sẽ trả 409 |
| `ALG202A` | `teacher2@uni.edu` | `PENDING` | Thử confirm/reject; teacher2 còn 1 suất |
| `NET301A` | `teacher3@uni.edu` | `CONFIRMED` | Gây trùng lịch khi reset `DB201A` |
| `DB201A` | `teacher3@uni.edu` | `REJECTED` | Thử reset về `PENDING` nhưng bị trùng lịch |
| `ALG202B` | `teacher4@uni.edu` | `REJECTED` | Teacher4 không có lớp hoạt động; reset thành công |

Tổng hợp trạng thái assignment: `3 PENDING`, `3 CONFIRMED`, `2 REJECTED`.

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
| `/courses`, `/classes`: GET | Không cần token |
| `/courses`, `/classes`: POST, PATCH, DELETE | Token ADMIN |
| `/assignments`: GET | Token ADMIN hoặc TEACHER |
| `/assignments`: POST, PUT, PATCH, DELETE | Token ADMIN, riêng `confirm/reject` dùng token TEACHER |

Mã lỗi xác thực: 401 (thiếu token, token sai hoặc hết hạn, sai email hoặc mật khẩu), 403 (token hợp lệ nhưng vai trò không phù hợp với route), 429 (vượt giới hạn số request).

## API

Chi tiết request và response của phân công (assignments): [docs/API.md](docs/API.md).

### Đăng nhập (`/api/v1/auth`)

| Method | Đường dẫn | Mô tả | Quyền | Lỗi chính |
|---|---|---|---|---|
| POST | `/auth/login` | Đăng nhập, nhận token | Công khai | 400, 401, 429 |

### `POST /auth/change-password`

Đổi mật khẩu của tài khoản đang đăng nhập. Yêu cầu token hợp lệ của chính tài khoản đó.

```json
{
  "oldPassword": "123456",
  "newPassword": "654321"
}
```

Mã lỗi chính: `400` nếu dữ liệu không hợp lệ, `401` nếu thiếu token hoặc mật khẩu cũ không đúng, `429` nếu vượt giới hạn tốc độ.

### Lớp học (`/api/v1/classes`)

| Method | Đường dẫn | Mô tả | Quyền | Lỗi chính |
|---|---|---|---|---|
| GET | `/classes` | Danh sách lớp (kèm môn học) | Công khai | 429 |
| GET | `/classes/:id` | Chi tiết lớp | Công khai | 400, 404, 429 |
| POST | `/classes` | Tạo lớp | ADMIN | 400, 401, 403, 404 (môn không tồn tại), 409 (trùng mã lớp), 429 |
| PATCH | `/classes/:id` | Sửa lớp (gửi trường nào sửa trường đó; đổi giờ sẽ kiểm tra trùng lịch giảng viên) | ADMIN | 400, 401, 403, 404, 409, 429 |
| DELETE | `/classes/:id` | Xóa lớp (không xóa được nếu đã phân công) | ADMIN | 401, 403, 404, 409, 429 |

### Môn học (`/api/v1/courses`)

| Method | Đường dẫn | Mô tả | Quyền | Lỗi chính |
|---|---|---|---|---|
| GET | `/courses` | Danh sách môn học | Công khai | 429 |
| GET | `/courses/:id` | Chi tiết môn học | Công khai | 400, 404, 429 |
| POST | `/courses` | Tạo môn học | ADMIN | 400, 401, 403, 409, 429 |
| PATCH | `/courses/:id` | Cập nhật môn học | ADMIN | 400, 401, 403, 404, 409, 429 |
| DELETE | `/courses/:id` | Xóa môn học | ADMIN | 401, 403, 404, 409, 429 |

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
| GET | `/teachers` | Danh sách giảng viên | ADMIN | 401, 403, 429 |
| POST | `/teachers` | Tạo giảng viên (mật khẩu được băm bcrypt, không trả về) | ADMIN | 400, 401, 403, 409 (trùng email), 429 |
| GET | `/teachers/:id` | Chi tiết giảng viên | ADMIN | 400, 401, 403, 404, 429 |
| PATCH | `/teachers/:id` | Sửa giảng viên (hiện chỉ sửa `fullName`) | ADMIN | 400, 401, 403, 404, 429 |
| DELETE | `/teachers/:id` | Xóa giảng viên | ADMIN | 400, 401, 403, 404, 429 |

### Phân công (`/api/v1/assignments`)

| Method | Đường dẫn | Mô tả | Quyền | Lỗi chính |
|---|---|---|---|---|
| GET | `/assignments` | Danh sách phân công | ADMIN/TEACHER | 401, 429 |
| GET | `/assignments/:id` | Chi tiết phân công | ADMIN/TEACHER | 400, 401, 404, 429 |
| POST | `/assignments` | Phân công giảng viên cho lớp | ADMIN | 400, 401, 403, 404, 409, 429 |
| PUT | `/assignments/:id` | Đổi giảng viên, đặt lại `PENDING` | ADMIN | 400, 401, 403, 404, 409, 429 |
| PATCH | `/assignments/:id` | Đặt lại phân công bị từ chối về `PENDING` | ADMIN | 400, 401, 403, 404, 409, 429 |
| PATCH | `/assignments/:id/confirm` | Giảng viên xác nhận phân công của mình | TEACHER | 401, 403, 404, 409, 429 |
| PATCH | `/assignments/:id/reject` | Giảng viên từ chối phân công của mình | TEACHER | 401, 403, 404, 409, 429 |
| DELETE | `/assignments/:id` | Xóa phân công | ADMIN | 400, 401, 403, 404, 429 |

Quy tắc phân công: mỗi lớp chỉ có một giảng viên; giảng viên không được trùng lịch; mỗi giảng viên có tối đa 3 phân công đang hoạt động (`PENDING` hoặc `CONFIRMED`). Phân công mới có `status = PENDING`; giảng viên có thể xác nhận hoặc từ chối phân công của mình.

## Kiểm tra nhanh (dùng Postman)

| Request | Kết quả mong đợi |
|---|---|
| `GET /health` | 200 khi DB hoạt động; 503 khi DB không khả dụng |
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

## Quan sát hệ thống

- `LOG_LEVEL` cấu hình mức log của Pino; mặc định là `info`. Đặt `LOG_LEVEL=silent` để tắt log (trong môi trường test, mức log tự chuyển thành `silent`).
- Log được ghi theo từng dòng JSON, thuận tiện để tìm kiếm và xử lý bằng công cụ log.
- Mỗi response có header `X-Request-Id`. Lấy giá trị header này từ response khi cần tra cứu request tương ứng trong file log:

```powershell
Select-String -Path <file log> -Pattern "<id>" -Encoding utf8
```

```bash
grep "<id>" <file log>
```

- Chạy toàn bộ test: `npx jest`.
- Tạo báo cáo độ trễ từ file log: `node scripts/latency-report.js <đường dẫn file log> [--skip-first=1]`.

## Định dạng response
- Thành công: `{ "success": true, "message": "...", "data": ... }`
- Thất bại: `{ "success": false, "message": "...", "errors": ... }`
- Mọi response có header `X-Request-Id`; khi báo lỗi, gửi kèm giá trị này để truy lại log.

Mã lỗi dùng trong dự án: 400 dữ liệu sai, 401 chưa xác thực, 403 không đủ quyền, 404 không tìm thấy, 409 xung đột (trùng lớp, trùng lịch), 429 quá giới hạn, 500 lỗi hệ thống.

## Chạy kiểm thử

```bash
npm test
```

Các bài kiểm thử Jest + Supertest thông thường dùng mock Prisma, không cần kết nối CSDL thật và tự đặt `JWT_SECRET` riêng. Riêng `tests/assignment.concurrency.test.js` mặc định bị bỏ qua; để chạy kiểm thử đồng thời với MySQL thật, dùng `RUN_MYSQL_CONCURRENCY=1` sau khi đã migrate và seed dữ liệu.

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
- [Postman Collection của TV2](docs/postman-tv2.collection.json)
- [Postman Collection đo độ trễ](docs/postman-latency.collection.json)
- [Hướng dẫn chạy Postman Collection Runner](docs/postman-latency-guide.md)

## Quy ước làm việc nhóm
- Không commit thẳng vào `main`. Tạo nhánh `<tên của thành viên>` (ví dụ: phuochung, anhkhang...), tạo Pull Request, người khác review rồi mới merge.
- Trước khi mở Pull Request: lấy bản mới của `main` về, merge vào nhánh của mình rồi chạy `npm test`.
- Không commit file `.env` hoặc bất kỳ bí mật nào.