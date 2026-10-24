# Bảng kiểm thử của Thành viên 2

Chạy bằng lệnh `npm test` tại thư mục gốc của project.

| STT | Kịch bản | Endpoint/phạm vi | Kết quả mong đợi | Kết quả thực tế |
|---:|---|---|---|---|
| 1 | Assignment thiếu `classId`, `teacherId` | `assignmentSchema` | Từ chối dữ liệu, chỉ rõ từng trường | Đạt |
| 2 | Mã lớp viết thường | `classSchema` | Trả lỗi mã lớp phải viết hoa | Đạt |
| 3 | `endTime` nhỏ hơn `startTime` | `classSchema` | Trả lỗi thứ tự thời gian | Đạt |
| 4 | Route không tồn tại | `GET /api/v1/route-khong-ton-tai` | HTTP 404, response JSON thống nhất | Đạt |
| 5 | Lỗi bất đồng bộ | `GET /api/v1/debug/async-error` | HTTP 409 qua error handler | Đạt |
| 6 | JSON sai cú pháp | `POST /api/v1/debug/validate` | HTTP 400, không làm server dừng | Đạt |
| 7 | Lỗi khóa ngoại khi xóa | Prisma `P2003` | HTTP 409 Conflict vì bản ghi đang được tham chiếu | Đạt |
| 8 | Lỗi hệ thống | `GET /api/v1/debug/crash` | HTTP 500, không lộ chi tiết lỗi nội bộ | Đạt |
| 9 | Login sai quá 5 lần | `POST /api/v1/auth/login` | Lần thứ 6 trả HTTP 429 | Đạt |
| 10 | CRUD Courses | `/api/v1/courses` | GET/POST/PATCH/DELETE đúng status và dữ liệu | Đạt |
| 11 | Mã môn bị trùng | `POST /api/v1/courses` | HTTP 409 từ Prisma P2002 | Đạt |
| 12 | Vượt giới hạn request API chung | `GET /api/v1/ping` | HTTP 429 và thông báo hướng dẫn thử lại | Đạt |

Bộ test tự động của TV2 nằm trong `tests/valdiations-error.test.js`,
`tests/course.service.test.js` và `tests/login-rate-limit.test.js`, dùng Jest và mock Prisma nên không cần database.

Lần chạy gần nhất: **6 test suites, 41/41 tests đạt**.
