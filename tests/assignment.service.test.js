// Test service phân công với Prisma được MOCK (không cần MySQL).
// Chạy: npm test     (cần: npm install -D jest)
jest.mock('../src/config/database', () => {
  const m = {
    classes: { findUnique: jest.fn() },
    users: { findUnique: jest.fn() },
    assignments: {
      findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(),
<<<<<<< HEAD
      count: jest.fn(), create: jest.fn(), delete: jest.fn(),
=======
      create: jest.fn(), delete: jest.fn(), count: jest.fn(),
>>>>>>> c6d2a6f714a91037dddca8499d98af9e25e096f8
    },
    $queryRaw: jest.fn(),
  };
  // transaction giả: chạy hàm bên trong và đưa chính mock làm "tx"
  m.$transaction = jest.fn(async (fn) => fn(m));
  return m;
});

const prisma = require('../src/config/database');
const service = require('../src/services/assignment.service');

const CLASS = {
  id: 1, classCode: 'WEB101A',
  startTime: new Date('2026-10-12T00:00:00Z'), endTime: new Date('2026-10-12T03:00:00Z'),
};
const TEACHER = { id: 2, role: 'TEACHER' };
const CREATED = { id: 10, classId: 1, teacherId: 2 };

beforeEach(() => {
  jest.clearAllMocks();
  // Mặc định: mọi thứ hợp lệ. Mỗi test ghi đè đúng chỗ cần thay đổi.
  prisma.classes.findUnique.mockResolvedValue(CLASS);
  prisma.users.findUnique.mockResolvedValue(TEACHER);
  prisma.assignments.findUnique.mockResolvedValue(null);
  prisma.assignments.findFirst.mockResolvedValue(null);
  prisma.assignments.count.mockResolvedValue(0);
  prisma.assignments.create.mockResolvedValue(CREATED);
});

describe('assignmentService.create', () => {
  test('tạo thành công khi dữ liệu hợp lệ', async () => {
    const result = await service.create({ classId: 1, teacherId: 2 });
    expect(result).toEqual(CREATED);
    expect(prisma.assignments.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: { classId: 1, teacherId: 2 } })
    );
  });

  test('404 khi lớp không tồn tại', async () => {
    prisma.classes.findUnique.mockResolvedValue(null);
    await expect(service.create({ classId: 99, teacherId: 2 })).rejects.toMatchObject({ statusCode: 404 });
    expect(prisma.assignments.create).not.toHaveBeenCalled();
  });

  test('404 khi giảng viên không tồn tại', async () => {
    prisma.users.findUnique.mockResolvedValue(null);
    await expect(service.create({ classId: 1, teacherId: 99 })).rejects.toMatchObject({ statusCode: 404 });
    expect(prisma.assignments.create).not.toHaveBeenCalled();
  });

  test('400 khi người dùng không phải giảng viên', async () => {
    prisma.users.findUnique.mockResolvedValue({ id: 9, role: 'ADMIN' });
    await expect(service.create({ classId: 1, teacherId: 9 })).rejects.toMatchObject({ statusCode: 400 });
    expect(prisma.assignments.create).not.toHaveBeenCalled();
  });

  test('409 khi lớp đã có giảng viên', async () => {
    prisma.assignments.findUnique.mockResolvedValue({ id: 5, classId: 1, teacherId: 3 });
    await expect(service.create({ classId: 1, teacherId: 2 })).rejects.toMatchObject({ statusCode: 409 });
    expect(prisma.assignments.create).not.toHaveBeenCalled();
  });

  test('409 khi giảng viên trùng lịch với lớp khác', async () => {
    prisma.assignments.findFirst.mockResolvedValue({ class: { classCode: 'WEB101B' } });
    await expect(service.create({ classId: 1, teacherId: 2 })).rejects.toMatchObject({
      statusCode: 409,
      message: expect.stringContaining('WEB101B'),
    });
    expect(prisma.assignments.create).not.toHaveBeenCalled();
  });

  test('kiểm tra trùng lịch dùng đúng điều kiện hai khoảng giao nhau', async () => {
    await service.create({ classId: 1, teacherId: 2 });
    expect(prisma.assignments.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          teacherId: 2,
          status: { in: ['PENDING', 'CONFIRMED'] },
          class: { startTime: { lt: CLASS.endTime }, endTime: { gt: CLASS.startTime } },
        }),
      })
    );
  });
    test('409 khi giảng viên đã được phân công đủ 3 lớp', async () => {
    prisma.assignments.count.mockResolvedValue(3);
    await expect(service.create({ classId: 1, teacherId: 2 })).rejects.toMatchObject({
      statusCode: 409,
      message: expect.stringContaining('tối đa 3 lớp'),
    });
    expect(prisma.assignments.create).not.toHaveBeenCalled();
  });

  test('tạo thành công khi giảng viên mới có 2 lớp (dưới giới hạn)', async () => {
    prisma.assignments.count.mockResolvedValue(2);
    await expect(service.create({ classId: 1, teacherId: 2 })).resolves.toEqual(CREATED);
  });

  test('kiểm tra trùng lịch chạy trước giới hạn 3 lớp', async () => {
    prisma.assignments.count.mockResolvedValue(3);
    prisma.assignments.findFirst.mockResolvedValue({ class: { classCode: 'WEB101B' } });
    await expect(service.create({ classId: 1, teacherId: 2 })).rejects.toMatchObject({
      statusCode: 409,
      message: expect.stringContaining('trùng lịch'),
    });
  });
  test('chạy trong một transaction và khóa dòng giảng viên trước mọi bước đọc', async () => {
    await service.create({ classId: 1, teacherId: 2 });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    const lockOrder = prisma.$queryRaw.mock.invocationCallOrder[0];
    const firstRead = prisma.classes.findUnique.mock.invocationCallOrder[0];
    expect(lockOrder).toBeLessThan(firstRead);
    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: 'Serializable',
    });
  });

  test('409 khi giảng viên đã đủ 3 lớp đang hoạt động', async () => {
    prisma.assignments.count.mockResolvedValue(3);
    await expect(service.create({ classId: 1, teacherId: 2 })).rejects.toMatchObject({
      statusCode: 409,
      message: 'Giảng viên đã được phân công tối đa 3 lớp',
    });
    expect(prisma.assignments.findFirst).not.toHaveBeenCalled();
    expect(prisma.assignments.create).not.toHaveBeenCalled();
  });

  test('bỏ qua assignment REJECTED khi kiểm tra trùng lịch', async () => {
    await service.create({ classId: 1, teacherId: 2 });
    expect(prisma.assignments.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: { in: ['PENDING', 'CONFIRMED'] } }),
      }),
    );
  });
});

describe('assignmentService.getById', () => {
  test('404 khi không tìm thấy phân công', async () => {
    prisma.assignments.findUnique.mockResolvedValue(null);
    await expect(service.getById(123)).rejects.toMatchObject({ statusCode: 404 });
  });
});
