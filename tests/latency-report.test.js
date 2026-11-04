const { summarize } = require('../scripts/latency-report');

function logLine(method, url, status, responseTime) {
  return JSON.stringify({
    msg: 'request completed',
    method,
    url,
    status,
    responseTime,
  });
}

describe('summarize', () => {
  test('chuẩn hóa endpoint, bỏ request đầu mỗi nhóm và loại status không phải 2xx', () => {
    const result = summarize([
      'Restarting...',
      logLine('GET', '/api/v1/assignments/12?include=class', 200, 10),
      logLine('GET', '/api/v1/assignments/15', 200, 20),
      logLine('GET', '/api/v1/assignments/21', 200, 30),
      logLine('POST', '/api/v1/assignments', 201, 40),
      logLine('GET', '/api/v1/assignments', 404, 5),
      logLine('GET', '/api/v1/assignments', 429, 6),
      JSON.stringify({ msg: 'Lỗi nghiệp vụ', status: 409 }),
    ]);

    expect(result).toEqual({
      rows: [{
        endpoint: 'GET /api/v1/assignments/:id',
        count: 2,
        average: 25,
        minimum: 20,
        maximum: 30,
        p95: 30,
      }],
      skippedFirst: 2,
      excludedStatus: 2,
    });
  });

  test('tính p95 theo nearest-rank và giữ nguyên URL không có số ID', () => {
    const result = summarize([
      logLine('GET', '/health?check=true', 200, 1),
      logLine('GET', '/health', 200, 2),
      logLine('GET', '/health', 200, 3),
      logLine('GET', '/health', 200, 4),
      logLine('GET', '/health', 200, 5),
    ], { skipFirst: 0 });

    expect(result.rows).toEqual([{
      endpoint: 'GET /health',
      count: 5,
      average: 3,
      minimum: 1,
      maximum: 5,
      p95: 5,
    }]);
  });

  test('không tạo dòng thống kê khi tất cả request đã bị skip', () => {
    const result = summarize([
      logLine('GET', '/health', 200, 12),
    ]);

    expect(result).toEqual({
      rows: [],
      skippedFirst: 1,
      excludedStatus: 0,
    });
  });

  test('từ chối giá trị skipFirst âm hoặc không nguyên', () => {
    expect(() => summarize([], { skipFirst: -1 })).toThrow(RangeError);
    expect(() => summarize([], { skipFirst: 1.5 })).toThrow(RangeError);
  });
});
