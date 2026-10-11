// Chạy: npx prisma db seed   (có thể chạy nhiều lần, dùng upsert nên không tạo trùng)
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('123456', 10);

  const users = [
    { email: 'admin@uni.edu', fullName: 'Trưởng khoa', role: 'ADMIN' },
    { email: 'teacher1@uni.edu', fullName: 'Nguyễn Văn A', role: 'TEACHER' },
    { email: 'teacher2@uni.edu', fullName: 'Trần Thị B', role: 'TEACHER' },
  ];
  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email }, update: {}, create: { ...u, password },
    });
  }

  const courses = [
    { courseCode: 'WEB101', name: 'Lập trình Web', credits: 3 },
    { courseCode: 'DB201', name: 'Cơ sở dữ liệu', credits: 3 },
  ];
  const courseIds = {};
  for (const c of courses) {
    const row = await prisma.course.upsert({
      where: { courseCode: c.courseCode }, update: {}, create: c,
    });
    courseIds[c.courseCode] = row.id;
  }

  // WEB101A và WEB101B cùng ngày, giờ GIAO nhau (dùng để thử ca trùng lịch).
  // WEB101C khác ngày. DB201A cùng giờ với WEB101C nhưng khác môn.
  const classes = [
    { classCode: 'WEB101A', course: 'WEB101', room: 'A101', start: '2026-10-12T07:00:00+07:00', end: '2026-10-12T10:00:00+07:00' },
    { classCode: 'WEB101B', course: 'WEB101', room: 'A102', start: '2026-10-12T09:00:00+07:00', end: '2026-10-12T12:00:00+07:00' },
    { classCode: 'WEB101C', course: 'WEB101', room: 'A103', start: '2026-10-14T07:00:00+07:00', end: '2026-10-14T10:00:00+07:00' },
    { classCode: 'DB201A', course: 'DB201', room: 'B201', start: '2026-10-14T07:00:00+07:00', end: '2026-10-14T10:00:00+07:00' },
  ];
  for (const c of classes) {
    await prisma.class.upsert({
      where: { classCode: c.classCode },
      update: {},
      create: {
        classCode: c.classCode, courseId: courseIds[c.course], room: c.room,
        startTime: new Date(c.start), endTime: new Date(c.end),
      },
    });
  }

  console.log('Seed xong: 3 tài khoản (mật khẩu 123456), 2 môn, 4 lớp.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
