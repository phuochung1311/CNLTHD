# API

Base URL: `/api/v1`

Định dạng phản hồi chung:

- Thành công: `{ success: true, message, data }`
- Thất bại: `{ success: false, message, errors }`

## Assignments

### `GET /assignments`

Lấy danh sách phân công giảng dạy.

**Tham số:** Không có.

**Response thành công:**

```json
{
  "success": true,
  "message": "OK",
  "data": [
    {
      "id": 1,
      "classId": 10,
      "teacherId": 3,
      "status": "PENDING",
      "createdAt": "2026-10-10T03:00:00.000Z",
      "updatedAt": "2026-10-10T03:00:00.000Z",
      "class": {
        "id": 10,
        "classCode": "CS101-01",
        "courseId": 2,
        "room": "A101",
        "startTime": "2026-10-12T01:00:00.000Z",
        "endTime": "2026-10-12T03:00:00.000Z",
        "course": {
          "id": 2,
          "courseCode": "CS101",
          "name": "Nhập môn Công nghệ thông tin",
          "credits": 3,
          "createdAt": "2026-10-01T03:00:00.000Z",
          "updatedAt": "2026-10-01T03:00:00.000Z"
        },
        "createdAt": "2026-10-01T03:00:00.000Z",
        "updatedAt": "2026-10-01T03:00:00.000Z"
      },
      "teacher": {
        "id": 3,
        "fullName": "Nguyễn Văn An",
        "email": "an@example.com"
      }
    }
  ]
}
```

**Mã lỗi:**

Endpoint không khai báo lỗi 400, 404 hoặc 409 riêng trong route/service.

### `GET /assignments/:id`

Lấy thông tin chi tiết của một phân công theo ID.

**Tham số đường dẫn:**

| Tên | Kiểu dữ liệu | Bắt buộc | Mô tả |
|---|---|---|---|
| `id` | Số nguyên dương | Có | ID phân công |

**Response thành công:**

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "id": 1,
    "classId": 10,
    "teacherId": 3,
    "status": "PENDING",
    "createdAt": "2026-10-10T03:00:00.000Z",
    "updatedAt": "2026-10-10T03:00:00.000Z",
    "class": {
      "id": 10,
      "classCode": "CS101-01",
      "courseId": 2,
      "room": "A101",
      "startTime": "2026-10-12T01:00:00.000Z",
      "endTime": "2026-10-12T03:00:00.000Z",
      "course": {
        "id": 2,
        "courseCode": "CS101",
        "name": "Nhập môn Công nghệ thông tin",
        "credits": 3,
        "createdAt": "2026-10-01T03:00:00.000Z",
        "updatedAt": "2026-10-01T03:00:00.000Z"
      },
      "createdAt": "2026-10-01T03:00:00.000Z",
      "updatedAt": "2026-10-01T03:00:00.000Z"
    },
    "teacher": {
      "id": 3,
      "fullName": "Nguyễn Văn An",
      "email": "an@example.com"
    }
  }
}
```

**Mã lỗi:**

| HTTP | Thông báo |
|---|---|
| 400 | `Dữ liệu đầu vào không hợp lệ` — ID không phải số nguyên dương |
| 404 | `Không tìm thấy phân công` |

### `POST /assignments`

Phân công một giảng viên phụ trách một lớp.

**Body (JSON):**

| Trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
|---|---|---|---|
| `classId` | Số nguyên dương | Có | ID lớp học |
| `teacherId` | Số nguyên dương | Có | ID người dùng có vai trò giảng viên |

**Ví dụ body:**

```json
{
  "classId": 10,
  "teacherId": 3
}
```

**Response thành công (HTTP 201):**

```json
{
  "success": true,
  "message": "Phân công thành công",
  "data": {
    "id": 1,
    "classId": 10,
    "teacherId": 3,
    "status": "PENDING",
    "createdAt": "2026-10-10T03:00:00.000Z",
    "updatedAt": "2026-10-10T03:00:00.000Z",
    "class": {
      "id": 10,
      "classCode": "CS101-01",
      "courseId": 2,
      "room": "A101",
      "startTime": "2026-10-12T01:00:00.000Z",
      "endTime": "2026-10-12T03:00:00.000Z",
      "course": {
        "id": 2,
        "courseCode": "CS101",
        "name": "Nhập môn Công nghệ thông tin",
        "credits": 3,
        "createdAt": "2026-10-01T03:00:00.000Z",
        "updatedAt": "2026-10-01T03:00:00.000Z"
      },
      "createdAt": "2026-10-01T03:00:00.000Z",
      "updatedAt": "2026-10-01T03:00:00.000Z"
    },
    "teacher": {
      "id": 3,
      "fullName": "Nguyễn Văn An",
      "email": "an@example.com"
    }
  }
}
```

**Mã lỗi:**

| HTTP | Thông báo |
|---|---|
| 400 | `Dữ liệu đầu vào không hợp lệ` — thiếu trường hoặc ID không phải số nguyên dương |
| 400 | `Người dùng này không phải giảng viên` |
| 404 | `Lớp học không tồn tại` |
| 404 | `Giảng viên không tồn tại` |
| 409 | `Lớp này đã có giảng viên phụ trách` |
| 409 | `Giảng viên trùng lịch với lớp {classCode}` |
| 409 | `Dữ liệu bị trùng (vi phạm unique)` — trùng khóa unique khi lưu phân công |

### `DELETE /assignments/:id`

Xóa một phân công theo ID.

**Tham số đường dẫn:**

| Tên | Kiểu dữ liệu | Bắt buộc | Mô tả |
|---|---|---|---|
| `id` | Số nguyên dương | Có | ID phân công |

**Response thành công:**

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
| 400 | `Dữ liệu đầu vào không hợp lệ` — ID không phải số nguyên dương |
| 404 | `Không tìm thấy phân công` |
