# Bảng kiểm thử của Thành viên 2

Chạy bằng lệnh `npm test` tại thư mục `project`.

| STT | Kịch bản | Endpoint/phạm vi | Kết quả mong đợi | Kết quả thực tế |
|---:|---|---|---|---|
| 1 | Assignment thiếu `classId`, `teacherId` | `assignmentSchema` | Từ chối dữ liệu, chỉ rõ từng trường | Đạt |
| 2 | Mã lớp viết thường | `classSchema` | Trả lỗi mã lớp phải viết hoa | Đạt |
| 3 | `endTime` nhỏ hơn `startTime` | `classSchema` | Trả lỗi thứ tự thời gian | Đạt |
| 4 | Route không tồn tại | `GET /api/v1/route-khong-ton-tai` | HTTP 404, response JSON thống nhất | Đạt |
| 5 | Lỗi bất đồng bộ | `GET /api/v1/debug/async-error` | HTTP 409 qua error handler | Đạt |
| 6 | JSON sai cú pháp | `POST /api/v1/debug/validate` | HTTP 400, không làm server dừng | Đạt |
| 7 | Lỗi khóa ngoại khi xóa | Prisma `P2003` | HTTP 409 Conflict vì bản ghi đang được tham chiếu | Đạt |
| 8 | Vượt giới hạn request | `GET /api/v1/ping` | HTTP 429 và thông báo hướng dẫn thử lại | Đạt |

Bộ test tự động nằm trong `tests/member2.test.js` và dùng Node.js Test Runner tích hợp sẵn, không cần database.
