# Hướng dẫn đo độ trễ bằng Postman Collection Runner

## Mục đích

Tài liệu này hướng dẫn chạy Collection Runner để đo độ trễ của các endpoint đọc dữ liệu chính trong 25 vòng lặp. Collection chỉ dùng request `GET`, vì vậy không tạo, sửa hoặc xóa dữ liệu trong database.

## Chuẩn bị

1. Khởi động MySQL và bảo đảm database đã migrate, seed dữ liệu.
2. Khởi động server:

```bash
npm run dev
```

3. Kiểm tra server tại:

```text
http://localhost:3000/health
```

## Import Collection

1. Mở Postman.
2. Chọn **Import**.
3. Chọn file `docs/postman-latency.collection.md`.
4. Mở Collection **Teaching Assignment API - Latency Test**.
5. Nếu server chạy cổng khác, sửa biến `baseUrl` trong Collection.

## Các endpoint được đo

| Request | Mục đích |
|---|---|
| `GET /health` | Kiểm tra server và kết nối database |
| `GET /api/v1/ping` | Kiểm tra thời gian phản hồi cơ bản của Express |
| `GET /api/v1/courses` | Đo truy vấn danh sách môn học |
| `GET /api/v1/classes` | Đo truy vấn danh sách lớp học |
| `GET /api/v1/assignments` | Đo truy vấn danh sách phân công |

Mỗi vòng lặp có 5 request. Chạy 25 vòng sẽ thu được:

```text
25 vòng x 5 endpoint = 125 request
```

## Chạy Collection Runner

1. Chọn Collection.
2. Bấm **Run collection**.
3. Chọn toàn bộ 5 request.
4. Đặt `Iterations` là `25`.
5. Có thể đặt `Delay` là `0` hoặc `100 ms`.
6. Bấm **Run Teaching Assignment API - Latency Test**.
7. Chờ Runner hoàn tất.

Các test trong Collection kiểm tra:

- HTTP status trả về `200`.
- Độ trễ nhỏ hơn `1000 ms`.
- Ghi log endpoint, số vòng lặp, status và `latencyMs` trong Postman Console.

## Thu thập số liệu

Trong kết quả Collection Runner, ghi lại cho từng endpoint:

- Số request đã chạy.
- Số request thành công.
- Số request thất bại.
- Độ trễ nhỏ nhất.
- Độ trễ lớn nhất.
- Độ trễ trung bình.

Không tự điền số liệu trước khi chạy thật. Các giá trị phải lấy từ kết quả Runner hoặc Postman Console.

## Ảnh chèn vào báo cáo

Chụp tối thiểu các ảnh sau:

1. Màn hình cấu hình Runner với `Iterations = 25`.
2. Màn hình tổng kết sau khi chạy xong, thể hiện số request và test pass/fail.
3. Màn hình kết quả hoặc Postman Console có thời gian phản hồi của các endpoint.

Đặt chú thích dưới ảnh:

> **Hình X.** Cấu hình Postman Collection Runner với 25 vòng lặp.
>
> **Hình Y.** Kết quả thu thập dữ liệu độ trễ của các endpoint chính.

## Mẫu nội dung báo cáo

> Postman Collection Runner được sử dụng để đo độ trễ của các endpoint chính trong 25 vòng lặp. Mỗi vòng lặp gồm 5 request đọc dữ liệu, bao gồm endpoint kiểm tra sức khỏe, ping, danh sách môn học, danh sách lớp học và danh sách phân công. Tổng cộng hệ thống đã thu thập 125 mẫu đo. Các request được lựa chọn không làm thay đổi dữ liệu hệ thống. Thời gian phản hồi được lấy từ trường Response Time của Postman.

## Bảng số liệu

| Endpoint | Số mẫu | Thành công | Nhỏ nhất (ms) | Lớn nhất (ms) | Trung bình (ms) |
|---|---:|---:|---:|---:|---:|
| `/health` | 25 | 25 | Điền sau khi chạy | Điền sau khi chạy | Điền sau khi chạy |
| `/api/v1/ping` | 25 | 25 | Điền sau khi chạy | Điền sau khi chạy | Điền sau khi chạy |
| `/api/v1/courses` | 25 | 25 | Điền sau khi chạy | Điền sau khi chạy | Điền sau khi chạy |
| `/api/v1/classes` | 25 | 25 | Điền sau khi chạy | Điền sau khi chạy | Điền sau khi chạy |
| `/api/v1/assignments` | 25 | 25 | Điền sau khi chạy | Điền sau khi chạy | Điền sau khi chạy |

## Lưu ý

Không chạy các request `POST`, `PATCH`, `DELETE` trong Collection đo độ trễ này vì chúng làm thay đổi dữ liệu. Không đưa `/api/v1/auth/login` vào bài đo 25 vòng vì hệ thống có rate limit riêng cho login là 5 lần trong 15 phút.
