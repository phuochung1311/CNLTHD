# ERD

Sơ đồ hiển thị trực tiếp trên GitHub (Mermaid). Khi viết báo cáo, chụp ảnh sơ đồ này.

```mermaid
erDiagram
    USER ||--o{ ASSIGNMENT : "được phân công (teacherId)"
    COURSE ||--o{ CLASS : "có nhiều lớp (courseId)"
    CLASS ||--o| ASSIGNMENT : "có tối đa 1 phân công (classId unique)"

    USER {
        int id PK
        string email UK
        string password
        string fullName
        string role "ADMIN | TEACHER"
    }
    COURSE {
        int id PK
        string courseCode UK
        string name
        int credits
    }
    CLASS {
        int id PK
        string classCode UK
        int courseId FK
        string room
        datetime startTime
        datetime endTime
    }
    ASSIGNMENT {
        int id PK
        int classId FK, UK
        int teacherId FK
        string status "PENDING | CONFIRMED | REJECTED"
    }
```

## Giải thích khóa

- `Class.courseId` là khóa ngoại tới `Course.id`: một môn có nhiều lớp.
- `Assignment.classId` vừa là khóa ngoại tới `Class.id` vừa `UNIQUE`: mỗi lớp chỉ có tối đa một giảng viên, và CSDL chặn sẵn việc phân công trùng lớp.
- `Assignment.teacherId` là khóa ngoại tới `User.id` (người dùng có role `TEACHER`): một giảng viên có nhiều lớp.
- Giảng viên được lưu trong bảng `User` với `role = TEACHER`, không có bảng riêng.
- Lịch của lớp là một khoảng thời gian cụ thể (`startTime`, `endTime`). Schema không mô hình hóa lịch lặp hằng tuần.
