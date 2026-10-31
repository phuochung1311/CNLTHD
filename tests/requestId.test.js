jest.mock('../src/config/database', () => ({
  classes: {},
  users: {},
  assignments: {},
  $transaction: jest.fn(),
  $queryRaw: jest.fn(),
}));

const request = require('supertest');
const app = require('../src/app');

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

describe('request ID middleware', () => {
  test('tạo UUID khi GET /health không gửi X-Request-Id', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.headers['x-request-id']).toMatch(UUID_PATTERN);
  });

  test('giữ lại X-Request-Id hợp lệ do client gửi', async () => {
    const response = await request(app)
      .get('/health')
      .set('X-Request-Id', 'abc123');

    expect(response.status).toBe(200);
    expect(response.headers['x-request-id']).toBe('abc123');
  });

  test.each([
    ['ký tự không hợp lệ', 'a/b'],
    ['dài hơn 64 ký tự', 'a'.repeat(65)],
  ])('tạo UUID mới cho request ID %s', async (_description, requestId) => {
    const response = await request(app)
      .get('/health')
      .set('X-Request-Id', requestId);

    expect(response.status).toBe(200);
    expect(response.headers['x-request-id']).toMatch(UUID_PATTERN);
    expect(response.headers['x-request-id']).not.toBe(requestId);
  });

  test('đường dẫn không tồn tại trả 404 và có X-Request-Id', async () => {
    const response = await request(app).get('/not-found');

    expect(response.status).toBe(404);
    expect(response.headers['x-request-id']).toMatch(UUID_PATTERN);
  });

  test('GET /api/v1/assignments không token trả 401 và có X-Request-Id', async () => {
    const response = await request(app).get('/api/v1/assignments');

    expect(response.status).toBe(401);
    expect(response.headers['x-request-id']).toMatch(UUID_PATTERN);
  });

  test('JSON sai cú pháp trả 400 và có X-Request-Id', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email":');

    expect(response.status).toBe(400);
    expect(response.headers['x-request-id']).toMatch(UUID_PATTERN);
  });
});
