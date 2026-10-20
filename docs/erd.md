# ERD

Sơ đồ hiển thị trực tiếp trên GitHub (Mermaid). Khi viết báo cáo, chụp ảnh sơ đồ này.

```mermaid
erDiagram
    USERS ||--o{ ASSIGNMENTS : "được phân công (teacherId)"
    COURSES ||--o{ CLASSES : "có nhiều lớp (courseId)"
    CLASSES ||--o| ASSIGNMENTS : "có tối đa 1 phân công (classId unique)"

    USERS {
        int id PK
        string email UK
        string password
        string fullName
        string role "ADMIN | TEACHER"
    }
    COURSES {
        int id PK
        string courseCode UK
        string name
        int credits
    }
    CLASSES {
        int id PK
        string classCode UK
        int courseId FK
        string room
        datetime startTime
        datetime endTime
    }
    ASSIGNMENTS {
        int id PK
        int classId FK, UK
        int teacherId FK
        string status "PENDING | CONFIRMED | REJECTED"
    }
```

## Giải thích khóa

- `Classes.courseId` là khóa ngoại tới `Courses.id`: một môn có nhiều lớp.
- `Assignments.classId` vừa là khóa ngoại tới `Classes.id` vừa `UNIQUE`: mỗi lớp chỉ có tối đa một giảng viên, và CSDL chặn sẵn việc phân công trùng lớp.
- `Assignments.teacherId` là khóa ngoại tới `Users.id` (người dùng có role `TEACHER`): một giảng viên có nhiều lớp.
- Giảng viên được lưu trong bảng `Users` với `role = TEACHER`, không có bảng riêng.
- Lịch của lớp là một khoảng thời gian cụ thể (`startTime`, `endTime`). Schema không mô hình hóa lịch lặp hằng tuần.