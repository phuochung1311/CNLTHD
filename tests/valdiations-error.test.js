// Test các lỗi validation và error.
process.env.NODE_ENV = 'test';
process.env.RATE_LIMIT_MAX = '10';

const request = require('supertest');
const app = require('../src/app');
const errorHandler = require('../src/middlewares/error.middleware');
const { assignmentSchema, classSchema } = require('../src/validations/assignment.schema');

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

    expect(result.success).toBe(false);
    expect(
        result.error.issues.map((issue) => issue.path[0]).sort(),
    ).toEqual(['classId', 'teacherId']);
});

test('validation từ chối mã lớp viết thường và thời gian kết thúc không hợp lệ', () => {
    const result = classSchema.safeParse({
        classCode: 'cntt-01',
        courseId: 1,
        room: 'A101',
        startTime: '2026-10-15T09:00:00.000Z',
        endTime: '2026-10-15T08:00:00.000Z',
    });

    expect(result.success).toBe(false);
    expect(
        result.error.issues.map((issue) => issue.path.join('.')).sort(),
    ).toEqual(['classCode', 'endTime']);
});

test('error handler trả 404 JSON cho route không tồn tại', async () => {
    const response = await request(app).get('/api/v1/route-khong-ton-tai');

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Đường dẫn không tồn tại');
});

test('error handler bắt lỗi async và trả 409', async () => {
    const response = await request(app).get('/api/v1/debug/async-error');

    expect(response.status).toBe(409);
    expect(response.body.success).toBe(false);
    expect(response.body.errors).toBeNull();
});

test('error handler trả 400 cho JSON sai cú pháp', async () => {
    const response = await request(app)
        .post('/api/v1/debug/validate')
        .set('Content-Type', 'application/json')
        .send('{"name":');

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('JSON không hợp lệ');
});

test('error handler trả 500 nhưng không lộ chi tiết lỗi hệ thống', async () => {
    const response = await request(app).get('/api/v1/debug/crash');

    expect(response.status).toBe(500);
    expect(response.body.message).toBe('Lỗi máy chủ nội bộ');
    expect(JSON.stringify(response.body)).not.toContain('Lỗi không lường trước');
});

test('error handler ánh xạ P2003 thành 409 Conflict', () => {
    const response = handleError({ code: 'P2003' });

    expect(response.statusCode).toBe(409);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Không thể xóa bản ghi vì đang được tham chiếu bởi dữ liệu khác');
});

test('rate limit trả 429 sau khi vượt số request cho phép', async () => {
    const responses = [];
    for (let index = 0; index < 12; index += 1) {
        responses.push(await request(app).get('/api/v1/ping'));
    }

    const limitedResponse = responses.find((response) => response.status === 429);
    expect(limitedResponse).toBeDefined();
    expect(limitedResponse.body.message).toBe('Quá nhiều yêu cầu, vui lòng thử lại sau');
});
