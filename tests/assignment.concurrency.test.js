const runConcurrencyTest = process.env.RUN_MYSQL_CONCURRENCY === '1' ? test : test.skip;

jest.setTimeout(30000);

runConcurrencyTest('chỉ một assignment được tạo khi hai request giao lịch chạy đồng thời', async () => {
  const prisma = require('../src/config/database');
  const service = require('../src/services/assignment.service');
  const [firstClass, secondClass, teacher] = await Promise.all([
    prisma.classes.findUnique({ where: { classCode: 'WEB101A' } }),
    prisma.classes.findUnique({ where: { classCode: 'WEB101B' } }),
    prisma.users.findUnique({ where: { email: 'teacher1@uni.edu' } }),
  ]);

  expect(firstClass).not.toBeNull();
  expect(secondClass).not.toBeNull();
  expect(teacher).not.toBeNull();

  await prisma.assignments.deleteMany();
  try {
    const results = await Promise.all([
      service.create({ classId: firstClass.id, teacherId: teacher.id })
        .then(() => ({ ok: true }))
        .catch((error) => ({ ok: false, error })),
      service.create({ classId: secondClass.id, teacherId: teacher.id })
        .then(() => ({ ok: true }))
        .catch((error) => ({ ok: false, error })),
    ]);

    expect(results.filter((result) => result.ok)).toHaveLength(1);
    expect(results.filter((result) => !result.ok && result.error.statusCode === 409)).toHaveLength(1);
    expect(await prisma.assignments.count()).toBe(1);
  } finally {
    await prisma.assignments.deleteMany();
    await prisma.$disconnect();
  }
});