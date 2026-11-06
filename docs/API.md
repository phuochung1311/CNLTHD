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
      "field": "body.email",
      "message": "Email không đúng định dạng"
    }
  ]
}
```

### Mã lỗi chung

| HTTP | Thông báo |
|---|---|
| 400 | `JSON không hợp lệ` — cú pháp JSON trong request body sai |
| 404 | `Đường dẫn không tồn tại` — endpoint không được khai báo |
| 429 | `Quá nhiều yêu cầu, vui lòng thử lại sau` — vượt giới hạn tốc độ chung; riêng đăng nhập có thông báo khác ở mục Auth |
| 500 | `Lỗi máy chủ nội bộ` — lỗi hệ thống không được trả chi tiết cho client |

### Mã định danh request (`X-Request-Id`)

Mọi response (kể cả lỗi 400, 401, 403, 404, 409, 500) đều có header `X-Request-Id`.

- Client có thể gửi header `X-Request-Id` của riêng mình. Giá trị chỉ gồm chữ, số, `.`, `_`, `-` và dài tối đa 64 ký tự; server giữ nguyên và trả lại.
- Nếu client không gửi hoặc gửi giá trị không hợp lệ (ví dụ chứa `/`), server tự tạo một UUID mới.
- Mọi dòng log của request đều mang `requestId` này. Khi báo lỗi, gửi kèm id để truy lại log.

### Xác thực (`Authorization`)

Token lấy từ `POST /auth/login`, mặc định có hiệu lực 1 giờ và có thể cấu hình bằng `JWT_EXPIRES_IN`.

| Endpoint | Yêu cầu |
|---|---|
| `POST /auth/login` | Không cần token |
| `GET /courses`, `GET /courses/:id` | Không cần token |
| `POST /courses`, `PATCH /courses/:id`, `DELETE /courses/:id` | Vai trò ADMIN |
| `GET /assignments`, `GET /assignments/:id` | Đã đăng nhập (ADMIN hoặc TEACHER) |
| `POST /assignments`, `PUT /assignments/:id`, `PATCH /assignments/:id`, `DELETE /assignments/:id` | Vai trò ADMIN |
| `PATCH /assignments/:id/confirm`, `PATCH /assignments/:id/reject` | Vai trò TEACHER |

Client gửi JWT trong header `Authorization` với scheme `Bearer`.

Lưu ý: người dùng TEACHER gọi `GET /assignments` nhận toàn bộ danh sách phân công, chưa lọc theo giảng viên đang đăng nhập.

### Giới hạn tốc độ

Mọi endpoint dưới `/api/v1` bị giới hạn số request theo địa chỉ client: mặc định 100 request mỗi 15 phút (cấu hình bằng biến môi trường `RATE_LIMIT_MAX` và `RATE_LIMIT_WINDOW_MS`). Endpoint `/health` không bị giới hạn. Response vượt giới hạn chung có HTTP 429, thông báo `Quá nhiều yêu cầu, vui lòng thử lại sau` và kèm các header thông báo giới hạn tốc độ.

Riêng `POST /auth/login` có limiter theo địa chỉ client: mặc định 5 lần trong 15 phút, cấu hình bằng `LOGIN_RATE_LIMIT_MAX` và `LOGIN_RATE_LIMIT_WINDOW_MS`. Limiter bỏ qua request đăng nhập thành công (`skipSuccessfulRequests`), chỉ tính các request thất bại. Response 429 có thông báo `Quá nhiều lần đăng nhập thất bại, vui lòng thử lại sau 15 phút`. Cả hai response 429 do `express-rate-limit` trả trực tiếp, không đi qua error handler.

Mã lỗi xác thực áp dụng cho các endpoint trên:

| HTTP | Thông báo | Khi nào |
|---|---|---|
| 401 | `Thiếu token xác thực` | Không có header `Authorization`, hoặc không đúng dạng `Bearer <token>` |
| 401 | `Token không hợp lệ` | Token sai hoặc bị sửa |
| 401 | `Token hết hạn` | Token đã quá thời hạn |
| 403 | `Không đủ quyền thực hiện thao tác này` | Đã đăng nhập nhưng vai trò không được phép (ví dụ TEACHER gọi `POST`) |
| 429 | `Quá nhiều yêu cầu, vui lòng thử lại sau` | Vượt giới hạn tốc độ chung |

Với các endpoint yêu cầu đăng nhập, xác thực và phân quyền được kiểm tra trước dữ liệu đầu vào: request không có token nhận 401, kể cả khi dữ liệu gửi lên sai. Riêng `POST /auth/login` không yêu cầu token và kiểm tra dữ liệu trước thông tin đăng nhập.

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

Gửi token ở các request sau trong header `Authorization: Bearer <chuỗi JWT>`.
**Mã lỗi:**

| HTTP | Thông báo |
|---|---|
| 400 | `Dữ liệu đầu vào không hợp lệ` — không gửi body (`field: body`), hoặc thiếu hay sai kiểu `email`, `password` (`field: body.email` hoặc `body.password`) |
| 401 | `Email hoặc mật khẩu không đúng` — sai mật khẩu hoặc email không tồn tại (cùng một thông báo để không lộ email nào có trong hệ thống) |
| 429 | `Quá nhiều lần đăng nhập thất bại, vui lòng thử lại sau 15 phút` — vượt giới hạn đăng nhập |
| 429 | `Quá nhiều yêu cầu, vui lòng thử lại sau` — vượt giới hạn tốc độ chung |

## Courses

Môn học là danh mục được dùng làm dữ liệu gốc cho các lớp học.

### `GET /courses`

Lấy danh sách môn học, sắp xếp theo `id` tăng dần. Endpoint công khai.

**Response thành công (HTTP 200):** `data` là mảng các môn học.

### `GET /courses/:id`

Lấy chi tiết một môn học. Endpoint công khai.

**Mã lỗi:** `400` nếu ID không hợp lệ, `404` nếu không tìm thấy môn học.

### `POST /courses`

Tạo môn học mới. Yêu cầu token ADMIN.

```json
{
  "courseCode": "WEB101",
  "name": "Lập trình Web",
  "credits": 3
}
```

Trả `201` khi tạo thành công và `409` nếu `courseCode` bị trùng.

### `PATCH /courses/:id`

Cập nhật một phần môn học. Yêu cầu token ADMIN. Có thể cập nhật `courseCode`, `name` hoặc `credits`; phải gửi ít nhất một trường.

### `DELETE /courses/:id`

Xóa môn học. Yêu cầu token ADMIN. Trả `409` nếu môn học đang được lớp học tham chiếu.

## Assignments

Một phân công gắn một giảng viên với một lớp học. Mỗi lớp chỉ có tối đa một phân công.

Trường `status` nhận một trong các giá trị:

| Giá trị | Ý nghĩa |
|---|---|
| `PENDING` | Chờ xác nhận (mặc định khi tạo mới) |
| `CONFIRMED` | Đã xác nhận |
| `REJECTED` | Bị từ chối |

Phân công tạo mới có `status = PENDING`. Giảng viên có thể xác nhận hoặc từ chối phân công của mình; Admin có thể đổi giảng viên hoặc đặt lại một phân công bị từ chối về `PENDING`.

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
| 401 | `Thiếu token xác thực` |
| 401 | `Token không hợp lệ` |
| 401 | `Token hết hạn` |
| 429 | Xem mục [Giới hạn tốc độ](#giới-hạn-tốc-độ) |

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
| 401 | `Thiếu token xác thực` |
| 401 | `Token không hợp lệ` |
| 401 | `Token hết hạn` |
| 400 | `Dữ liệu đầu vào không hợp lệ` (`field: params.id`) — ID không phải số nguyên dương |
| 404 | `Không tìm thấy phân công` |
| 429 | Xem mục [Giới hạn tốc độ](#giới-hạn-tốc-độ) |

### `POST /assignments`

Phân công một giảng viên phụ trách một lớp.
Yêu cầu vai trò ADMIN.

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

**Thứ tự kiểm tra:** hệ thống kiểm tra lần lượt các điều kiện dưới đây và dừng ở điều kiện đầu tiên không thỏa. Vì vậy cùng một request có thể nhận thông báo lỗi khác nhau tùy dữ liệu hiện có.

1. Xác thực token (401) và vai trò ADMIN (403).
2. Dữ liệu đầu vào hợp lệ (400).
3. Lớp học tồn tại (404).
4. Giảng viên tồn tại (404) và có vai trò giảng viên (400).
5. Lớp chưa có giảng viên phụ trách (409).
6. Giảng viên chưa được phân công đủ 3 lớp đang hoạt động (409). Chỉ các phân công `PENDING` và `CONFIRMED` được tính; `REJECTED` không được tính.
7. Giảng viên không trùng lịch với lớp đã nhận (409).

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
| 409 | `Giảng viên đã được phân công tối đa 3 lớp` |
| 409 | `Giảng viên trùng lịch với lớp {classCode}` — hai lớp có khoảng thời gian giao nhau |
| 409 | `Dữ liệu bị trùng (vi phạm unique)` — hai request cùng phân công một lớp tại cùng thời điểm |


### `PUT /assignments/:id`

Đổi giảng viên phụ trách. Yêu cầu vai trò ADMIN.

**Tham số đường dẫn:**

| Tên | Kiểu dữ liệu | Bắt buộc | Mô tả |
|---|---|---|---|
| `id` | Số nguyên dương | Có | ID phân công |

**Body (JSON):**

| Trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
|---|---|---|---|
| `teacherId` | Số nguyên dương | Có | ID người dùng có vai trò giảng viên |

```json
{
  "teacherId": 2
}
```

**Response thành công (HTTP 200):** thông báo `Cập nhật giảng viên thành công`; dữ liệu phân công trả về luôn có `status = PENDING`.

**Thứ tự kiểm tra:** token và vai trò ADMIN; dữ liệu đầu vào hợp lệ; phân công tồn tại; giảng viên tồn tại và có vai trò giảng viên; sau đó kiểm tra quota tối đa 3 lớp và trùng lịch khi điều kiện kiểm tra được kích hoạt.

Quota và lịch chỉ được kiểm tra lại khi đổi sang giảng viên khác hoặc phân công hiện tại ở trạng thái `REJECTED`. Nếu gửi lại đúng giảng viên cũ trên phân công không ở `REJECTED`, hai kiểm tra này được bỏ qua nhưng trạng thái vẫn được đặt về `PENDING`.

**Mã lỗi:**

| HTTP | Thông báo |
|---|---|
| 401 | `Thiếu token xác thực` |
| 401 | `Token không hợp lệ` |
| 401 | `Token hết hạn` |
| 403 | `Không đủ quyền thực hiện thao tác này` |
| 400 | `Dữ liệu đầu vào không hợp lệ` (`field: params.id` hoặc `body.teacherId`) — ID không hợp lệ hoặc `teacherId` thiếu/không phải số nguyên dương |
| 404 | `Không tìm thấy phân công` |
| 404 | `Giảng viên không tồn tại` |
| 400 | `Người dùng này không phải giảng viên` |
| 409 | `Giảng viên đã được phân công tối đa 3 lớp` |
| 409 | `Giảng viên trùng lịch với lớp {classCode}` |

### `PATCH /assignments/:id`

Đặt lại một phân công `REJECTED` về `PENDING`. Yêu cầu vai trò ADMIN; chỉ phân công đang ở trạng thái `REJECTED` mới được đặt lại.

**Response thành công (HTTP 200):** thông báo `Đã đặt lại phân công về trạng thái chờ`; trạng thái là `PENDING`.

**Mã lỗi:**

| HTTP | Thông báo |
|---|---|
| 401 | `Thiếu token xác thực` |
| 401 | `Token không hợp lệ` |
| 401 | `Token hết hạn` |
| 403 | `Không đủ quyền thực hiện thao tác này` |
| 400 | `Dữ liệu đầu vào không hợp lệ` (`field: params.id`) — ID không phải số nguyên dương |
| 404 | `Không tìm thấy phân công` |
| 409 | `Chỉ phân công đã bị từ chối mới được đặt lại về chờ` |
| 409 | `Giảng viên đã được phân công tối đa 3 lớp` |
| 409 | `Giảng viên trùng lịch với lớp {classCode}` |

### `PATCH /assignments/:id/confirm`

Giảng viên được phân công xác nhận phân công của chính mình. Chỉ phân công `PENDING` mới được xác nhận; request yêu cầu token TEACHER đúng với `teacherId` của phân công.

**Response thành công (HTTP 200):** thông báo `Đã chấp nhận phân công`.

**Mã lỗi:**

| HTTP | Thông báo |
|---|---|
| 401 | `Thiếu token xác thực` |
| 401 | `Token không hợp lệ` |
| 401 | `Token hết hạn` |
| 403 | `Không đủ quyền thực hiện thao tác này` — token không có vai trò TEACHER |
| 400 | `Dữ liệu đầu vào không hợp lệ` (`field: params.id`) — ID không phải số nguyên dương |
| 404 | `Không tìm thấy phân công` |
| 403 | `Bạn không có quyền cập nhật phân công này` — phân công thuộc giảng viên khác |
| 409 | `Chỉ phân công đang chờ mới có thể cập nhật` |

### `PATCH /assignments/:id/reject`

Giảng viên được phân công từ chối phân công của chính mình. Chỉ phân công `PENDING` mới được từ chối; request yêu cầu token TEACHER đúng với `teacherId` của phân công.

**Response thành công (HTTP 200):** thông báo `Đã từ chối phân công`.

**Mã lỗi:**

| HTTP | Thông báo |
|---|---|
| 401 | `Thiếu token xác thực` |
| 401 | `Token không hợp lệ` |
| 401 | `Token hết hạn` |
| 403 | `Không đủ quyền thực hiện thao tác này` — token không có vai trò TEACHER |
| 400 | `Dữ liệu đầu vào không hợp lệ` (`field: params.id`) — ID không phải số nguyên dương |
| 404 | `Không tìm thấy phân công` |
| 403 | `Bạn không có quyền cập nhật phân công này` — phân công thuộc giảng viên khác |
| 409 | `Chỉ phân công đang chờ mới có thể cập nhật` |

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
| 401 | `Thiếu token xác thực` |
| 401 | `Token không hợp lệ` |
| 401 | `Token hết hạn` |
| 403 | `Không đủ quyền thực hiện thao tác này` |
| 400 | `Dữ liệu đầu vào không hợp lệ` (`field: params.id`) — ID không phải số nguyên dương |
| 404 | `Không tìm thấy phân công` |

### Xử lý đồng thời

POST, PUT và `PATCH /assignments/:id` (đặt lại phân công) chạy trong transaction và khóa giảng viên trên bảng `Users` bằng `SELECT ... FOR UPDATE` khi kiểm tra quota/lịch. Với PUT, khóa và kiểm tra quota/lịch chỉ diễn ra khi đổi giảng viên hoặc phân công đang `REJECTED`. POST có unique constraint trên `classId`; nếu hai request đồng thời tạo phân công cho cùng lớp, request bị chặn nhận 409 `Dữ liệu bị trùng (vi phạm unique)`. Confirm/reject dùng cập nhật có điều kiện `status = PENDING`; nếu request trước đã đổi trạng thái thì request đến sau nhận 409 `Chỉ phân công đang chờ mới có thể cập nhật`.