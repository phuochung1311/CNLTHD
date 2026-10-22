process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-only-jwt-secret';
process.env.JWT_EXPIRES_IN = '1h';

jest.mock('../src/config/database', () => ({
    users: {
        findUnique: jest.fn(),
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findMany: jest.fn(),
    },
}));

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const prisma = require('../src/config/database');
const app = require('../src/app');

const writeRoutes = [
    ['post', '/api/v1/classes'],
    ['patch', '/api/v1/classes/1'],
    ['delete', '/api/v1/classes/1'],
    ['post', '/api/v1/assignments'],
    ['delete', '/api/v1/assignments/1'],
];

const callRoute = (method, url) => {
    const body = method === 'post' && url.endsWith('/classes')
        ? {
            classCode: 'TEST101',
            courseId: 1,
            room: 'A101',
            startTime: '2026-10-15T07:00:00.000Z',
            endTime: '2026-10-15T10:00:00.000Z',
        }
        : method === 'post'
            ? { classId: 1, teacherId: 2 }
            : {};

    const requestBuilder = request(app)[method](url);
    return method === 'post' || method === 'patch'
        ? requestBuilder.send(body)
        : requestBuilder;
};

describe('Tuần 3 - xác thực và phân quyền', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test.each(writeRoutes)('%s %s không token -> 401', async (method, url) => {
        const response = await callRoute(method, url);

        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Thiếu token xác thực');
    });

    test.each(writeRoutes)('%s %s token TEACHER -> 403', async (method, url) => {
        const token = jwt.sign({ id: 2, role: 'TEACHER' }, process.env.JWT_SECRET);
        const response = await callRoute(method, url)
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(403);
        expect(response.body.message).toBe('Không đủ quyền thực hiện thao tác này');
    });

    test('token hết hạn -> 401', async () => {
        const token = jwt.sign(
            { id: 1, role: 'ADMIN' },
            process.env.JWT_SECRET,
            { expiresIn: -1 },
        );

        const response = await request(app)
            .post('/api/v1/teachers')
            .set('Authorization', `Bearer ${token}`)
            .send({});

        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Token hết hạn');
    });
});

describe('Đăng nhập và bảo vệ dữ liệu nhạy cảm', () => {
    const password = 'Test@12345';
    const user = {
        id: 1,
        email: 'admin@test.edu',
        fullName: 'Admin Test',
        role: 'ADMIN',
        password: bcrypt.hashSync(password, 4),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('đúng mật khẩu -> 200, token có id và role, không lộ password', async () => {
        prisma.users.findUnique.mockResolvedValue(user);

        const response = await request(app)
            .post('/api/v1/auth/login')
            .send({ email: user.email, password });

        expect(response.status).toBe(200);
        expect(response.body.data.accessToken).toEqual(expect.any(String));

        const payload = jwt.verify(
            response.body.data.accessToken,
            process.env.JWT_SECRET,
        );
        expect(payload).toMatchObject({ id: 1, role: 'ADMIN' });
        expect(JSON.stringify(response.body)).not.toContain(user.password);
    });

    test('sai mật khẩu -> 401', async () => {
        prisma.users.findUnique.mockResolvedValue(user);

        const response = await request(app)
            .post('/api/v1/auth/login')
            .send({ email: user.email, password: 'sai' });

        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Email hoặc mật khẩu không đúng');
    });

    test('email không tồn tại -> 401', async () => {
        prisma.users.findUnique.mockResolvedValue(null);

        const response = await request(app)
            .post('/api/v1/auth/login')
            .send({ email: 'missing@test.edu', password });

        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Email hoặc mật khẩu không đúng');
    });
});

describe('Tạo giảng viên', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('mật khẩu gửi vào Prisma được băm với bcrypt', async () => {
        const input = {
            email: 'teacher-test@test.edu',
            fullName: 'Teacher Test',
            password: 'Test@12345',
        };
        const adminToken = jwt.sign({ id: 1, role: 'ADMIN' }, process.env.JWT_SECRET);

        prisma.users.create.mockResolvedValue({
            id: 3,
            email: input.email,
            fullName: input.fullName,
            role: 'TEACHER',
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        const response = await request(app)
            .post('/api/v1/teachers')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(input);

        expect(response.status).toBe(201);
        expect(prisma.users.create).toHaveBeenCalledTimes(1);

        const createdData = prisma.users.create.mock.calls[0][0].data;
        expect(createdData.password).not.toBe(input.password);
        expect(createdData.password).toMatch(/^\$2[aby]\$10\$/);
        expect(bcrypt.compareSync(input.password, createdData.password)).toBe(true);
    });

    it('ADMIN gọi route thành công, lọt qua lớp Auth và đi tới lớp Zod Validate', async () => {
        const res = await request(app)
            .post('/api/v1/teachers')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({}); 
        
        // Vì ta gửi body rỗng {}, request sẽ lọt qua Auth nhưng bị Zod chặn lại báo lỗi 400.
        expect(res.status).not.toBe(401);
        expect(res.status).not.toBe(403);
        expect(res.status).toBe(400); // Lỗi do Zod Validate chặn
    });
});
