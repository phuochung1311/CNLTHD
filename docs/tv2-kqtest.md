# Bảng tổng hợp kết quả kiểm thử TV2

Chạy tại thư mục gốc bằng lệnh:

```bash
npm test
```

## Bảng kết quả

| STT | Kịch bản kiểm thử | Phạm vi | Kết quả mong đợi | Kết quả |
|---:|---|---|---|---|
| 1 | Assignment thiếu `classId`, `teacherId` | `assignmentSchema` | Từ chối dữ liệu và chỉ rõ trường lỗi | Đạt |
| 2 | Mã lớp viết thường | `classSchema` | HTTP 400, yêu cầu mã lớp viết hoa | Đạt |
| 3 | `endTime` nhỏ hơn `startTime` | `classSchema` | HTTP 400 | Đạt |
| 4 | Route không tồn tại | `GET /api/v1/route-khong-ton-tai` | HTTP 404, response JSON thống nhất | Đạt |
| 5 | Lỗi bất đồng bộ | `GET /api/v1/debug/async-error` | HTTP 409 qua error handler | Đạt |
| 6 | JSON sai cú pháp | `POST /api/v1/debug/validate` | HTTP 400, server không dừng | Đạt |
| 7 | Lỗi khóa ngoại khi xóa | Prisma `P2003` | HTTP 409 Conflict | Đạt |
| 8 | Lỗi hệ thống | `GET /api/v1/debug/crash` | HTTP 500, không lộ chi tiết nội bộ | Đạt |
| 9 | Login sai quá 5 lần | `POST /api/v1/auth/login` | Lần thứ 6 trả HTTP 429 | Đạt |
| 10 | CRUD Courses | `/api/v1/courses` | GET/POST/PATCH/DELETE hoạt động đúng | Đạt |
| 11 | Mã môn bị trùng | `POST /api/v1/courses` | HTTP 409 do Prisma P2002 | Đạt |
| 12 | Rate limit API chung | `GET /api/v1/ping` | HTTP 429 khi vượt giới hạn | Đạt |
| 13 | Kiểm tra xác thực | Các route ghi dữ liệu | Không token trả 401 | Đạt |
| 14 | Kiểm tra phân quyền | Route ADMIN với token TEACHER | Trả HTTP 403 | Đạt |
| 15 | Mật khẩu được băm | Tạo giảng viên | Không lưu mật khẩu dạng plaintext | Đạt |

## Bộ test tự động

Các test chính của TV2:

- `tests/valdiations-error.test.js`
- `tests/course.service.test.js`
- `tests/login-rate-limit.test.js`
- `tests/auth.test.js`

Các test service và validation sử dụng mock Prisma, không yêu cầu kết nối database thật.

## Kết quả chạy gần nhất

Ghi lại kết quả thực tế sau mỗi lần chạy:

Test Suites: 1 skipped, 9 passed, 9 of 10 total
Tests:       1 skipped, 62 passed, 63 total
Snapshots:   0 total
Time:        3.902 s, estimated 10 s

## Postman Collection

Collection của TV2 được lưu tại:

```text
docs/postman-tv2.collection.json
```

Collection bao phủ login, validation, lỗi 404/500, CRUD Courses, lỗi 409 và login rate limit. Không bao gồm Redis, BullMQ hoặc Queue.
