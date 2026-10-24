# API

Base URL: `/api/v1`

## Quy ước chung

### Định dạng phản hồi

- Thành công: `{ "success": true, "message": "...", "data": ... }`
- Thất bại: `{ "success": false, "message": "...", "errors": ... }`

Trường `errors`:

- Lỗi kiểm tra dữ liệu đầu vào (HTTP 400): mảng `[{ "field", "message" }]`, trong đó `field` cho biết vị trí và tên trường sai (ví dụ `body.classId`, `params.id`).
- Các lỗi còn lại: `null`.

Ví dụ lỗi kiểm tra dữ liệu (HTTP 400):

```json
{
  "success": false,
  "message": "Dữ liệu đầu vào không hợp lệ",
  "errors": [
    {
      "field": "body.classId",
      "message": "Invalid input: expected number, received string"
    }
  ]
}
```
### Mã định danh request (`X-Request-Id`)

Mọi response (kể cả lỗi 400, 401, 403, 404, 409, 500) đều có header `X-Request-Id`.

- Client có thể gửi header `X-Request-Id` của riêng mình. Giá trị chỉ gồm chữ, số, `.`, `_`, `-` và dài tối đa 64 ký tự; server giữ nguyên và trả lại.
- Nếu client không gửi hoặc gửi giá trị không hợp lệ (ví dụ chứa `/`), server tự tạo một UUID mới.
- Mọi dòng log của request đều mang `requestId` này. Khi báo lỗi, gửi kèm id để truy lại log.

### Xác thực (`Authorization`)

Các endpoint của `assignments` yêu cầu header `Authorization: Bearer <accessToken>`. Lấy token từ `POST /auth/login`. Token có hiệu lực 1 giờ.

| Endpoint | Yêu cầu |
|---|---|
| `GET /assignments`, `GET /assignments/:id` | Đã đăng nhập (ADMIN hoặc TEACHER) |
| `POST /assignments`, `DELETE /assignments/:id` | Vai trò ADMIN |

Lưu ý: người dùng TEACHER gọi `GET /assignments` nhận toàn bộ danh sách phân công, chưa lọc theo giảng viên đang đăng nhập.
### Giới hạn tốc độ

Mọi endpoint dưới `/api/v1` bị giới hạn số request theo địa chỉ client: mặc định 100 request mỗi 15 phút (cấu hình bằng biến môi trường `RATE_LIMIT_MAX` và `RATE_LIMIT_WINDOW_MS`). Endpoint `/health` không bị giới hạn. Response của request vượt giới hạn có HTTP 429 và kèm các header thông báo giới hạn tốc độ.

Mã lỗi xác thực áp dụng cho các endpoint trên:

| HTTP | Thông báo | Khi nào |
|---|---|---|
| 401 | `Thiếu token xác thực` | Không có header `Authorization`, hoặc không đúng dạng `Bearer <token>` |
| 401 | `Token không hợp lệ` | Token sai hoặc bị sửa |
| 401 | `Token hết hạn` | Token đã quá thời hạn |
| 403 | `Không đủ quyền thực hiện thao tác này` | Đã đăng nhập nhưng vai trò không được phép (ví dụ TEACHER gọi `POST`) |
| 429 | `Quá nhiều yêu cầu, vui lòng thử lại sau` | Vượt giới hạn số request trong một khoảng thời gian |

Xác thực và phân quyền được kiểm tra trước khi kiểm tra dữ liệu đầu vào: request không có token luôn nhận 401, kể cả khi dữ liệu gửi lên sai.

### Định dạng thời gian

Mọi trường thời gian (`startTime`, `endTime`, `createdAt`, `updatedAt`) trả về theo UTC, chuẩn ISO 8601 (có hậu tố `Z`). Ví dụ `2026-10-12T00:00:00.000Z` tương ứng 07:00 ngày 12/10/2026 theo giờ Việt Nam.

## Auth

### `POST /auth/login`

Đăng nhập bằng email và mật khẩu, nhận token truy cập (JWT).

**Body (JSON):**

| Trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
|---|---|---|---|
| `email` | Chuỗi | Có | Email tài khoản |
| `password` | Chuỗi | Có | Mật khẩu |

**Ví dụ body:**

```json
{
  "email": "admin@uni.edu",
  "password": "123456"
}
```

**Response thành công (HTTP 200):**

```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": {
    "accessToken": "<chuỗi JWT>",
    "user": {
      "id": 1,
      "email": "admin@uni.edu",
      "fullName": "Trưởng khoa",
      "role": "ADMIN"
    }
  }
}
```

Token có hiệu lực 1 giờ. Gửi token ở các request sau trong header `Authorization: Bearer <accessToken>`.
**Mã lỗi:**

| HTTP | Thông báo |
|---|---|
| 400 | `Dữ liệu đầu vào không hợp lệ` — không gửi body (`field: body`), hoặc thiếu hay sai kiểu `email`, `password` (`field: body.email` hoặc `body.password`) |
| 401 | `Email hoặc mật khẩu không đúng` — sai mật khẩu hoặc email không tồn tại (cùng một thông báo để không lộ email nào có trong hệ thống) |
| 429 | `Quá nhiều yêu cầu, vui lòng thử lại sau` — vượt giới hạn tốc độ |

## Assignments

Một phân công gắn một giảng viên với một lớp học. Mỗi lớp chỉ có tối đa một phân công.

Trường `status` nhận một trong các giá trị:

| Giá trị | Ý nghĩa |
|---|---|
| `PENDING` | Chờ xác nhận (mặc định khi tạo mới) |
| `CONFIRMED` | Đã xác nhận |
| `REJECTED` | Bị từ chối |

Hiện chưa có endpoint để đổi `status`; phân công tạo mới luôn có `status` là `PENDING`.

Trường `teacher` chỉ trả `id`, `fullName` và `email`, không trả mật khẩu.

### `GET /assignments`

Lấy danh sách phân công giảng dạy, sắp xếp theo `id` tăng dần. Yêu cầu đăng nhập.

**Tham số:** không có.

**Response thành công (HTTP 200):**

```json
{
  "success": true,
  "message": "OK",
  "data": [
    {
      "id": 1,
      "classId": 1,
      "teacherId": 2,
      "status": "PENDING",
      "createdAt": "2026-10-16T18:11:00.222Z",
      "updatedAt": "2026-10-16T18:11:00.222Z",
      "class": {
        "id": 1,
        "classCode": "WEB101A",
        "courseId": 1,
        "room": "A101",
        "startTime": "2026-10-12T00:00:00.000Z",
        "endTime": "2026-10-12T03:00:00.000Z",
        "createdAt": "2026-10-16T18:01:42.555Z",
        "updatedAt": "2026-10-16T18:01:42.555Z",
        "course": {
          "id": 1,
          "courseCode": "WEB101",
          "name": "Lập trình Web",
          "credits": 3,
          "createdAt": "2026-10-16T18:01:42.540Z",
          "updatedAt": "2026-10-16T18:01:42.540Z"
        }
      },
      "teacher": {
        "id": 2,
        "fullName": "Nguyễn Văn A",
        "email": "teacher1@uni.edu"
      }
    }
  ]
}
```

Khi chưa có phân công nào, `data` là mảng rỗng `[]`.

**Mã lỗi:**

| HTTP | Thông báo |
|---|---|
| 400 | `Dữ liệu đầu vào không hợp lệ` — không gửi body hoặc body sai dạng (`field: body`) |
| 429 | `Quá nhiều yêu cầu, vui lòng thử lại sau` — vượt giới hạn tốc độ |

### `GET /assignments/:id`

Lấy thông tin chi tiết của một phân công theo ID.Yêu cầu đăng nhập.


**Tham số đường dẫn:**

| Tên | Kiểu dữ liệu | Bắt buộc | Mô tả |
|---|---|---|---|
| `id` | Số nguyên dương | Có | ID phân công |

**Response thành công (HTTP 200):** `data` là một đối tượng phân công, cùng cấu trúc như một phần tử của `GET /assignments`.

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "id": 1,
    "classId": 1,
    "teacherId": 2,
    "status": "PENDING",
    "createdAt": "2026-10-16T18:11:00.222Z",
    "updatedAt": "2026-10-16T18:11:00.222Z",
    "class": {
      "id": 1,
      "classCode": "WEB101A",
      "courseId": 1,
      "room": "A101",
      "startTime": "2026-10-12T00:00:00.000Z",
      "endTime": "2026-10-12T03:00:00.000Z",
      "createdAt": "2026-10-16T18:01:42.555Z",
      "updatedAt": "2026-10-16T18:01:42.555Z",
      "course": {
        "id": 1,
        "courseCode": "WEB101",
        "name": "Lập trình Web",
        "credits": 3,
        "createdAt": "2026-10-16T18:01:42.540Z",
        "updatedAt": "2026-10-16T18:01:42.540Z"
      }
    },
    "teacher": {
      "id": 2,
      "fullName": "Nguyễn Văn A",
      "email": "teacher1@uni.edu"
    }
  }
}
```

**Mã lỗi:**

| HTTP | Thông báo |
|---|---|
| 400 | `Dữ liệu đầu vào không hợp lệ` (`field: params.id`) — ID không phải số nguyên dương |
| 404 | `Không tìm thấy phân công` |

### `POST /assignments`

Phân công một giảng viên phụ trách một lớp.

**Body (JSON):**

| Trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
|---|---|---|---|
| `classId` | Số nguyên dương | Có | ID lớp học |
| `teacherId` | Số nguyên dương | Có | ID người dùng có vai trò giảng viên |

Hai trường phải là số, không phải chuỗi: gửi `"classId": "1"` sẽ trả lỗi 400.

**Ví dụ body:**

```json
{
  "classId": 1,
  "teacherId": 2
}
```

**Response thành công (HTTP 201):**

```json
{
  "success": true,
  "message": "Phân công thành công",
  "data": {
    "id": 1,
    "classId": 1,
    "teacherId": 2,
    "status": "PENDING",
    "createdAt": "2026-10-16T18:11:00.222Z",
    "updatedAt": "2026-10-16T18:11:00.222Z",
    "class": {
      "id": 1,
      "classCode": "WEB101A",
      "courseId": 1,
      "room": "A101",
      "startTime": "2026-10-12T00:00:00.000Z",
      "endTime": "2026-10-12T03:00:00.000Z",
      "createdAt": "2026-10-16T18:01:42.555Z",
      "updatedAt": "2026-10-16T18:01:42.555Z",
      "course": {
        "id": 1,
        "courseCode": "WEB101",
        "name": "Lập trình Web",
        "credits": 3,
        "createdAt": "2026-10-16T18:01:42.540Z",
        "updatedAt": "2026-10-16T18:01:42.540Z"
      }
    },
    "teacher": {
      "id": 2,
      "fullName": "Nguyễn Văn A",
      "email": "teacher1@uni.edu"
    }
  }
}
```

**Thứ tự kiểm tra:** hệ thống kiểm tra lần lượt các điều kiện dưới đây và dừng ở điều kiện đầu tiên không thỏa. Vì vậy cùng một request có thể nhận thông báo lỗi khác nhau tùy dữ liệu hiện có. Yêu cầu vai trò ADMIN.

1. Xác thực token (401) và vai trò ADMIN (403).
2. Dữ liệu đầu vào hợp lệ (400).
3. Lớp học tồn tại (404).
4. Giảng viên tồn tại (404) và có vai trò giảng viên (400).
5. Lớp chưa có giảng viên phụ trách (409).
6. Giảng viên không trùng lịch với lớp đã nhận (409).
7. Giảng viên chưa được phân công đủ 3 lớp (409). Số lớp được tính trên mọi phân công của giảng viên, không phân biệt `status`.

**Mã lỗi:**

| HTTP | Thông báo |
|---|---|
| 401 | `Thiếu token xác thực` |
| 401 | `Token không hợp lệ` |
| 401 | `Token hết hạn` |
| 403 | `Không đủ quyền thực hiện thao tác này` |
| 400 | `Dữ liệu đầu vào không hợp lệ` (`field: body.classId` hoặc `body.teacherId`) — thiếu trường hoặc không phải số nguyên dương |
| 400 | `Người dùng này không phải giảng viên` |
| 404 | `Lớp học không tồn tại` |
| 404 | `Giảng viên không tồn tại` |
| 409 | `Lớp này đã có giảng viên phụ trách` |
| 409 | `Giảng viên trùng lịch với lớp {classCode}` — hai lớp có khoảng thời gian giao nhau |
| 409 | `Giảng viên đã được phân công tối đa 3 lớp` |
| 409 | `Dữ liệu bị trùng (vi phạm unique)` — hai request cùng phân công một lớp tại cùng thời điểm |

**Xử lý đồng thời:** việc tạo phân công chạy trong một transaction và khóa dòng giảng viên (`SELECT ... FOR UPDATE`), nên các request phân công cho cùng một giảng viên được xử lý lần lượt; kiểm tra trùng lịch và giới hạn 3 lớp luôn đọc dữ liệu mới nhất. Hai request cùng gán một lớp cho hai giảng viên khác nhau không bị khóa chung; khi đó ràng buộc duy nhất của `classId` chặn request đến sau và trả 409 `Dữ liệu bị trùng (vi phạm unique)`.

### `DELETE /assignments/:id`

Xóa một phân công theo ID.

**Tham số đường dẫn:**

| Tên | Kiểu dữ liệu | Bắt buộc | Mô tả |
|---|---|---|---|
| `id` | Số nguyên dương | Có | ID phân công |

**Response thành công (HTTP 200):**

```json
{
  "success": true,
  "message": "Xóa phân công thành công",
  "data": null
}
```

**Mã lỗi:**

| HTTP | Thông báo |
|---|---|
| 400 | `Dữ liệu đầu vào không hợp lệ` (`field: params.id`) — ID không phải số nguyên dương |
| 404 | `Không tìm thấy phân công` |