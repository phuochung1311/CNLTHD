jest.mock('../src/config/database', () => ({
    courses: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
}));

const prisma = require('../src/config/database');
const courseService = require('../src/services/course.service');

const COURSE = {
    id: 1,
    courseCode: 'WEB101',
    name: 'Lập trình Web',
    credits: 3,
};

beforeEach(() => {
    jest.clearAllMocks();
});

describe('courseService CRUD', () => {
    test('list trả danh sách môn học theo ID tăng dần', async () => {
        prisma.courses.findMany.mockResolvedValue([COURSE]);

        await expect(courseService.list()).resolves.toEqual([COURSE]);
        expect(prisma.courses.findMany).toHaveBeenCalledWith({ orderBy: { id: 'asc' } });
    });

    test('getById trả 404 khi môn học không tồn tại', async () => {
        prisma.courses.findUnique.mockResolvedValue(null);

        await expect(courseService.getById(99)).rejects.toMatchObject({ statusCode: 404 });
    });

    test('create gửi đúng dữ liệu tới Prisma', async () => {
        prisma.courses.create.mockResolvedValue(COURSE);

        await expect(courseService.create(COURSE)).resolves.toEqual(COURSE);
        expect(prisma.courses.create).toHaveBeenCalledWith({ data: COURSE });
    });

    test('update kiểm tra tồn tại trước khi cập nhật', async () => {
        prisma.courses.findUnique.mockResolvedValue(COURSE);
        prisma.courses.update.mockResolvedValue({ ...COURSE, credits: 4 });

        await expect(courseService.update(1, { credits: 4 })).resolves.toMatchObject({ credits: 4 });
        expect(prisma.courses.update).toHaveBeenCalledWith({
            where: { id: 1 },
            data: { credits: 4 },
        });
    });

    test('remove xóa môn học sau khi kiểm tra tồn tại', async () => {
        prisma.courses.findUnique.mockResolvedValue(COURSE);
        prisma.courses.delete.mockResolvedValue(COURSE);

        await expect(courseService.remove(1)).resolves.toBeUndefined();
        expect(prisma.courses.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });
});
