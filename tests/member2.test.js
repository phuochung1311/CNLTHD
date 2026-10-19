const assert = require('node:assert/strict');
const http = require('node:http');
const test = require('node:test');

process.env.NODE_ENV = 'test';
process.env.RATE_LIMIT_MAX = '10';

const app = require('../src/app');
const errorHandler = require('../src/middlewares/error.middleware');
const { assignmentSchema, classSchema } = require('../src/validations/assignment.schema');

let server;
let baseUrl;

test.before(async () => {
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

// Gọi API và trả về response JSON để các test tập trung vào hành vi HTTP.
async function request(path, options = {}) {
    const response = await fetch(`${baseUrl}${path}`, options);
    return {
        status: response.status,
        body: await response.json(),
    };
}

// Gọi trực tiếp error handler để kiểm tra lỗi Prisma mà không cần kết nối database.
function handleError(error) {
    let statusCode;
    let body;
    const response = {
        status(code) {
            statusCode = code;
            return {
                json(payload) {
                    body = payload;
                },
            };
        },
    };

    errorHandler(error, {}, response, () => {});
    return { statusCode, body };
}

test('validation từ chối assignment thiếu classId và teacherId', () => {
    const result = assignmentSchema.safeParse({});

    assert.equal(result.success, false);
    assert.deepEqual(
        result.error.issues.map((issue) => issue.path[0]).sort(),
        ['classId', 'teacherId'],
    );
});

test('validation từ chối mã lớp viết thường và thời gian kết thúc không hợp lệ', () => {
    const result = classSchema.safeParse({
        classCode: 'cntt-01',
        courseId: 1,
        room: 'A101',
        startTime: '2026-10-15T09:00:00.000Z',
        endTime: '2026-10-15T08:00:00.000Z',
    });

    assert.equal(result.success, false);
    assert.deepEqual(
        result.error.issues.map((issue) => issue.path.join('.')).sort(),
        ['classCode', 'endTime'],
    );
});

test('error handler trả 404 JSON cho route không tồn tại', async () => {
    const response = await request('/api/v1/route-khong-ton-tai');

    assert.equal(response.status, 404);
    assert.equal(response.body.success, false);
    assert.equal(response.body.message, 'Đường dẫn không tồn tại');
});

test('error handler bắt lỗi async và trả 409', async () => {
    const response = await request('/api/v1/debug/async-error');

    assert.equal(response.status, 409);
    assert.equal(response.body.success, false);
    assert.equal(response.body.errors, null);
});

test('error handler trả 400 cho JSON sai cú pháp', async () => {
    const response = await fetch(`${baseUrl}/api/v1/debug/validate`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{"name":',
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.message, 'JSON không hợp lệ');
});

test('error handler ánh xạ P2003 thành 409 Conflict', () => {
    const response = handleError({ code: 'P2003' });

    assert.equal(response.statusCode, 409);
    assert.equal(response.body.success, false);
    assert.equal(response.body.message, 'Không thể xóa bản ghi vì đang được tham chiếu bởi dữ liệu khác');
});

test('rate limit trả 429 sau khi vượt số request cho phép', async () => {
    const responses = [];
    for (let index = 0; index < 12; index += 1) {
        responses.push(await request('/api/v1/ping'));
    }

    const limitedResponse = responses.find((response) => response.status === 429);
    assert.ok(limitedResponse, 'Phải có response 429 sau khi vượt giới hạn');
    assert.equal(limitedResponse.body.message, 'Quá nhiều yêu cầu, vui lòng thử lại sau');
});
