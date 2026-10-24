jest.mock('../src/config/database', () => ({
  $queryRaw: jest.fn(),
}));

const http = require('node:http');
const prisma = require('../src/config/database');
const app = require('../src/app');

function requestHealth(server) {
  const { port } = server.address();
  return new Promise((resolve, reject) => {
    const request = http.get(`http://127.0.0.1:${port}/health`, (response) => {
      let body = '';
      response.on('data', (chunk) => { body += chunk; });
      response.on('end', () => resolve({ statusCode: response.statusCode, body: JSON.parse(body) }));
    });
    request.on('error', reject);
  });
}

describe('GET /health', () => {
  let server;

  beforeEach((done) => {
    jest.clearAllMocks();
    server = app.listen(0, done);
  });

  afterEach((done) => {
    server.close(done);
  });

  test('trả 200 khi database hoạt động', async () => {
    prisma.$queryRaw.mockResolvedValue([{ 1: 1 }]);

    const response = await requestHealth(server);

    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
  });

  test('trả 503 khi database lỗi', async () => {
    prisma.$queryRaw.mockRejectedValue(new Error('database unavailable'));

    const response = await requestHealth(server);

    expect(response.statusCode).toBe(503);
    expect(response.body.status).toBe('error');
  });
});