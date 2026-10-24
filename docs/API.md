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

Mọi response (kể cả lỗi 400, 404, 409, 500) đều có header `X-Request-Id`.

- Client có thể gửi header `X-Request-Id` của riêng mình. Giá trị chỉ gồm chữ, số, `.`, `_`, `-` và dài tối đa 64 ký tự; server giữ nguyên và trả lại.
- Nếu client không gửi hoặc gửi giá trị không hợp lệ (ví dụ chứa `/`), server tự tạo một UUID mới.
- Mọi dòng log của request đều mang `requestId` này. Khi báo lỗi, gửi kèm id để truy lại log.

### Mã lỗi áp dụng cho mọi endpoint

| HTTP | Thông báo | Khi nào |
|---|---|---|
| 404 | `Đường dẫn không tồn tại` | Gọi đường dẫn chưa được khai báo |
| 400 | `JSON không hợp lệ` | Body gửi lên sai cú pháp JSON |
| 500 | `Lỗi máy chủ nội bộ` | Lỗi hệ thống không lường trước |

### Định dạng thời gian

Mọi trường thời gian (`startTime`, `endTime`, `createdAt`, `updatedAt`) trả về theo UTC, chuẩn ISO 8601 (có hậu tố `Z`). Ví dụ `2026-10-12T00:00:00.000Z` tương ứng 07:00 ngày 12/10/2026 theo giờ Việt Nam.

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

Lấy danh sách phân công giảng dạy, sắp xếp theo `id` tăng dần.

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

**Mã lỗi:** không có lỗi nghiệp vụ riêng (xem các mã lỗi chung ở trên).

### `GET /assignments/:id`

Lấy thông tin chi tiết của một phân công theo ID.

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

**Thứ tự kiểm tra:** hệ thống kiểm tra lần lượt các điều kiện dưới đây và dừng ở điều kiện đầu tiên không thỏa. Vì vậy cùng một request có thể nhận thông báo lỗi khác nhau tùy dữ liệu hiện có.

1. Dữ liệu đầu vào hợp lệ (400).
2. Lớp học tồn tại (404).
3. Giảng viên tồn tại (404) và có vai trò giảng viên (400).
4. Lớp chưa có giảng viên phụ trách (409).
5. Giảng viên không trùng lịch với lớp đã nhận (409).
6. Giảng viên chưa được phân công đủ 3 lớp (409).

**Mã lỗi:**

| HTTP | Thông báo |
|---|---|
| 400 | `Dữ liệu đầu vào không hợp lệ` (`field: body.classId` hoặc `body.teacherId`) — thiếu trường hoặc không phải số nguyên dương |
| 400 | `Người dùng này không phải giảng viên` |
| 404 | `Lớp học không tồn tại` |
| 404 | `Giảng viên không tồn tại` |
| 409 | `Lớp này đã có giảng viên phụ trách` |
| 409 | `Giảng viên trùng lịch với lớp {classCode}` — hai lớp có khoảng thời gian giao nhau |
| 409 | `Giảng viên đã được phân công tối đa 3 lớp` |
| 409 | `Dữ liệu bị trùng (vi phạm unique)` — hai request cùng phân công một lớp tại cùng thời điểm |

**Hạn chế đã biết:** khi hai request cùng phân công cho một giảng viên vào hai lớp trùng lịch tại cùng một thời điểm, cơ sở dữ liệu chưa chặn được trường hợp này.

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