// Dữ liệu mẫu cho cả 5 tuần: đủ để thử mọi luồng phân công (PENDING, CONFIRMED, REJECTED),
// các ca 400/403/404/409 và các endpoint đo độ trễ.
//
// Chạy:             npx prisma db seed
// Đặt lại từ đầu:   npx prisma db seed -- --reset   (XÓA toàn bộ users, courses, classes, assignments)
//
// Chạy lại không kèm --reset vẫn an toàn: mọi bản ghi dùng upsert, không tạo trùng và được ghi đè
// về đúng giá trị mẫu (mật khẩu, giờ lớp, giảng viên và trạng thái phân công), nên sau mỗi đợt
// thử bằng Postman chỉ cần chạy lại lệnh này để về trạng thái ban đầu.
// Bản ghi do chính bạn tạo thêm (ngoài danh sách dưới đây) không bị đụng tới; muốn xóa hẳn thì dùng --reset.
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const PASSWORD = '123456'; // mật khẩu chung của mọi tài khoản mẫu
const RESET = process.argv.includes('--reset');

// ---------------------------------------------------------------------------
// 1 ADMIN + 4 TEACHER
// ---------------------------------------------------------------------------
const users = [
  { email: 'admin@uni.edu', fullName: 'Trưởng khoa', role: 'ADMIN' },
  { email: 'teacher1@uni.edu', fullName: 'Nguyễn Văn A', role: 'TEACHER' }, // đã đủ 3 lớp
  { email: 'teacher2@uni.edu', fullName: 'Trần Thị B', role: 'TEACHER' },   // còn 1 suất
  { email: 'teacher3@uni.edu', fullName: 'Lê Văn C', role: 'TEACHER' },     // có ca reset bị trùng lịch
  { email: 'teacher4@uni.edu', fullName: 'Phạm Thị D', role: 'TEACHER' },   // rảnh, nhận thay người khác
];

// ---------------------------------------------------------------------------
// 4 môn học (courseCode đúng dạng 2-4 chữ HOA + 3 số)
// ---------------------------------------------------------------------------
const courses = [
  { courseCode: 'WEB101', name: 'Lập trình Web', credits: 3 },
  { courseCode: 'DB201', name: 'Cơ sở dữ liệu', credits: 3 },
  { courseCode: 'NET301', name: 'Mạng máy tính', credits: 3 },
  { courseCode: 'ALG202', name: 'Cấu trúc dữ liệu và giải thuật', credits: 4 },
];

// ---------------------------------------------------------------------------
// 12 lớp. Giờ viết dạng ISO 8601 có múi giờ +07:00 (Prisma lưu DateTime theo UTC).
// Cột "dùng để thử" ghi ca kiểm thử mà lớp đó phục vụ.
// ---------------------------------------------------------------------------
const classes = [
  // Tuần 12/10
  { classCode: 'WEB101A', course: 'WEB101', room: 'A101', start: '2026-10-12T07:00:00+07:00', end: '2026-10-12T10:00:00+07:00' }, // T2 CONFIRMED
  { classCode: 'WEB101B', course: 'WEB101', room: 'A102', start: '2026-10-12T09:00:00+07:00', end: '2026-10-12T12:00:00+07:00' }, // CHƯA phân công; giao với WEB101A -> gán cho T2 thì 409 trùng lịch
  { classCode: 'WEB101D', course: 'WEB101', room: 'A104', start: '2026-10-12T10:00:00+07:00', end: '2026-10-12T12:00:00+07:00' }, // CHƯA phân công; bắt đầu đúng lúc WEB101A kết thúc -> gán cho T2 thì THÀNH CÔNG (liền kề không phải trùng)
  { classCode: 'ALG202A', course: 'ALG202', room: 'B203', start: '2026-10-13T13:00:00+07:00', end: '2026-10-13T16:00:00+07:00' }, // T2 PENDING
  // Tuần 14/10
  { classCode: 'WEB101C', course: 'WEB101', room: 'A103', start: '2026-10-14T07:00:00+07:00', end: '2026-10-14T10:00:00+07:00' }, // T1 CONFIRMED
  { classCode: 'DB201A', course: 'DB201', room: 'B201', start: '2026-10-14T07:00:00+07:00', end: '2026-10-14T10:00:00+07:00' }, // T3 REJECTED; reset về PENDING cho T3 thì 409 vì T3 đang dạy NET301A
  { classCode: 'NET301A', course: 'NET301', room: 'C301', start: '2026-10-14T08:00:00+07:00', end: '2026-10-14T11:00:00+07:00' }, // T3 CONFIRMED
  { classCode: 'DB201B', course: 'DB201', room: 'B202', start: '2026-10-15T13:00:00+07:00', end: '2026-10-15T16:00:00+07:00' }, // T1 CONFIRMED
  { classCode: 'NET301B', course: 'NET301', room: 'C302', start: '2026-10-16T07:00:00+07:00', end: '2026-10-16T10:00:00+07:00' }, // T1 PENDING
  // Tuần 19/10 trở đi
  { classCode: 'ALG202B', course: 'ALG202', room: 'B204', start: '2026-10-19T07:00:00+07:00', end: '2026-10-19T10:00:00+07:00' }, // T4 REJECTED; reset về PENDING thì THÀNH CÔNG
  { classCode: 'DB201C', course: 'DB201', room: 'B205', start: '2026-10-21T13:00:00+07:00', end: '2026-10-21T16:00:00+07:00' }, // CHƯA phân công; xóa lớp thành công
  { classCode: 'NET301C', course: 'NET301', room: 'C303', start: '2026-10-22T07:00:00+07:00', end: '2026-10-22T10:00:00+07:00' }, // CHƯA phân công; gán cho T1 thì 409 vượt 3 lớp
];

// ---------------------------------------------------------------------------
// 8 phân công (mỗi lớp tối đa một phân công vì Assignments.classId là UNIQUE)
//
//   Giảng viên | CONFIRMED | PENDING | REJECTED | Ghi chú
//   T1         | 2         | 1       | 0        | đúng 3 lớp đang hoạt động, không lớp nào giao nhau
//   T2         | 1         | 1       | 0        | còn 1 suất
//   T3         | 1         | 0       | 1        | lớp REJECTED giao giờ với lớp CONFIRMED
//   T4         | 0         | 0       | 1        | không có lớp nào đang hoạt động
//
// Chỉ PENDING và CONFIRMED được tính vào giới hạn 3 lớp và kiểm tra trùng lịch.
// ---------------------------------------------------------------------------
const assignments = [
  { classCode: 'WEB101C', teacher: 'teacher1@uni.edu', status: 'CONFIRMED' },
  { classCode: 'DB201B', teacher: 'teacher1@uni.edu', status: 'CONFIRMED' },
  { classCode: 'NET301B', teacher: 'teacher1@uni.edu', status: 'PENDING' }, // T1 confirm/reject
  { classCode: 'WEB101A', teacher: 'teacher2@uni.edu', status: 'CONFIRMED' }, // T2 thử reject -> 409 (đã CONFIRMED)
  { classCode: 'ALG202A', teacher: 'teacher2@uni.edu', status: 'PENDING' }, // T2 confirm/reject
  { classCode: 'NET301A', teacher: 'teacher3@uni.edu', status: 'CONFIRMED' },
  { classCode: 'DB201A', teacher: 'teacher3@uni.edu', status: 'REJECTED' },
  { classCode: 'ALG202B', teacher: 'teacher4@uni.edu', status: 'REJECTED' },
];

async function main() {
  if (RESET) {
    // Xóa theo thứ tự khóa ngoại: Assignments -> Classes -> Courses -> Users.
    await prisma.assignments.deleteMany();
    await prisma.classes.deleteMany();
    await prisma.courses.deleteMany();
    await prisma.users.deleteMany();
    console.log('Đã xóa toàn bộ dữ liệu cũ (--reset).');
  }

  const password = await bcrypt.hash(PASSWORD, 10);

  const userIds = {};
  for (const u of users) {
    const row = await prisma.users.upsert({
      where: { email: u.email },
      update: { fullName: u.fullName, role: u.role, password },
      create: { ...u, password },
    });
    userIds[u.email] = row.id;
  }

  const courseIds = {};
  for (const c of courses) {
    const row = await prisma.courses.upsert({
      where: { courseCode: c.courseCode },
      update: { name: c.name, credits: c.credits },
      create: c,
    });
    courseIds[c.courseCode] = row.id;
  }

  const classIds = {};
  for (const c of classes) {
    const data = {
      courseId: courseIds[c.course],
      room: c.room,
      startTime: new Date(c.start),
      endTime: new Date(c.end),
    };
    const row = await prisma.classes.upsert({
      where: { classCode: c.classCode },
      update: data,
      create: { classCode: c.classCode, ...data },
    });
    classIds[c.classCode] = row.id;
  }

  for (const a of assignments) {
    const data = { teacherId: userIds[a.teacher], status: a.status };
    await prisma.assignments.upsert({
      where: { classId: classIds[a.classCode] },
      update: data,
      create: { classId: classIds[a.classCode], ...data },
    });
  }

  const byStatus = (s) => assignments.filter((a) => a.status === s).length;
  console.log(
    `Seed xong: ${users.length} tài khoản (mật khẩu ${PASSWORD}), ${courses.length} môn, ` +
      `${classes.length} lớp, ${assignments.length} phân công ` +
      `(${byStatus('PENDING')} PENDING, ${byStatus('CONFIRMED')} CONFIRMED, ${byStatus('REJECTED')} REJECTED).`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
