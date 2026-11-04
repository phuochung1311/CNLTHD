// Test: GET /classes trả course và teacher lồng bên trong, không lộ dữ liệu nhạy cảm.
jest.mock('../src/config/database', () => ({
  classes: { findMany: jest.fn(), findUnique: jest.fn() },
}));

const prisma = require('../src/config/database');
const service = require('../src/services/class.service');

describe('classService.list', () => {
  test('trả course và teacher lồng bên trong, lớp chưa phân công thì teacher = null', async () => {
    prisma.classes.findMany.mockResolvedValue([
      {
        id: 1, classCode: 'WEB101A', course: { id: 1, name: 'Lập trình Web' },
        assignment: { status: 'PENDING', teacher: { id: 2, fullName: 'Nguyễn Văn A', email: 'a@uni.edu' } },
      },
      { id: 2, classCode: 'WEB101B', course: { id: 1, name: 'Lập trình Web' }, assignment: null },
    ]);

    const rows = await service.list();

    expect(rows[0].course.name).toBe('Lập trình Web');
    expect(rows[0].teacher).toEqual({ id: 2, fullName: 'Nguyễn Văn A', email: 'a@uni.edu' });
    expect(rows[0]).not.toHaveProperty('assignment');
    expect(rows[1].teacher).toBeNull();
  });

  test('truy vấn chỉ select trường an toàn của giảng viên, không có password', async () => {
    prisma.classes.findMany.mockResolvedValue([]);
    await service.list();
    const arg = prisma.classes.findMany.mock.calls[0][0];
    const select = arg.include.assignment.include.teacher.select;
    expect(select).toEqual({ id: true, fullName: true, email: true });
    expect(select).not.toHaveProperty('password');
  });
});
