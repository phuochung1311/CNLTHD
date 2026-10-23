process.env.NODE_ENV = 'test';
process.env.LOGIN_RATE_LIMIT_MAX = '5';
process.env.LOGIN_RATE_LIMIT_WINDOW_MS = '900000';

jest.mock('../src/config/database', () => ({
    users: {
        findUnique: jest.fn(),
    },
}));

const request = require('supertest');
const prisma = require('../src/config/database');
const app = require('../src/app');

beforeEach(() => {
    jest.clearAllMocks();
    prisma.users.findUnique.mockResolvedValue(null);
});

test('login sai quá 5 lần trả 429 ở lần thứ 6', async () => {
    const responses = [];

    for (let attempt = 0; attempt < 6; attempt += 1) {
        responses.push(await request(app)
            .post('/api/v1/auth/login')
            .send({ email: 'admin@uni.edu', password: 'sai' }));
    }

    expect(responses.slice(0, 5).every((response) => response.status === 401)).toBe(true);
    expect(responses[5].status).toBe(429);
    expect(responses[5].body.message).toBe(
        'Quá nhiều lần đăng nhập thất bại, vui lòng thử lại sau 15 phút',
    );
});
