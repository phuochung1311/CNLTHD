const fs = require('node:fs');

function normalizeUrl(url) {
  return url.split('?')[0].replace(/\/\d+(?=\/|$)/g, '/:id');
}

function roundToTwo(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function summarize(lines, options = {}) {
  const skipFirst = options.skipFirst === undefined ? 1 : options.skipFirst;
  if (!Number.isInteger(skipFirst) || skipFirst < 0) {
    throw new RangeError('skipFirst phải là số nguyên không âm');
  }

  const groups = new Map();
  let excludedStatus = 0;

  for (const line of lines) {
    let entry;
    try {
      entry = JSON.parse(line);
    } catch {
      continue;
    }

    if (!entry || entry.msg !== 'request completed') continue;

    if (typeof entry.status !== 'number' || entry.status < 200 || entry.status > 299) {
      excludedStatus += 1;
      continue;
    }

    if (
      typeof entry.method !== 'string'
      || typeof entry.url !== 'string'
      || typeof entry.responseTime !== 'number'
      || !Number.isFinite(entry.responseTime)
    ) {
      continue;
    }

    const endpoint = `${entry.method} ${normalizeUrl(entry.url)}`;
    if (!groups.has(endpoint)) groups.set(endpoint, []);
    groups.get(endpoint).push(entry.responseTime);
  }

  let skippedFirst = 0;
  const rows = [...groups.entries()]
    .sort(([endpointA], [endpointB]) => endpointA.localeCompare(endpointB))
    .flatMap(([endpoint, times]) => {
      const skipped = Math.min(skipFirst, times.length);
      skippedFirst += skipped;
      const included = times.slice(skipped).sort((a, b) => a - b);
      if (included.length === 0) return [];

      const average = included.reduce((sum, time) => sum + time, 0) / included.length;
      const p95Index = Math.ceil(included.length * 0.95) - 1;

      return [{
        endpoint,
        count: included.length,
        average: roundToTwo(average),
        minimum: roundToTwo(included[0]),
        maximum: roundToTwo(included[included.length - 1]),
        p95: roundToTwo(included[p95Index]),
      }];
    });

  return { rows, skippedFirst, excludedStatus };
}

function formatReport(result) {
  const lines = [
    '| Endpoint | Số lần | TB (ms) | Nhỏ nhất | Lớn nhất | p95 |',
    '|---|---:|---:|---:|---:|---:|',
    ...result.rows.map((row) => (
      `| ${row.endpoint} | ${row.count} | ${row.average.toFixed(2)} | ${row.minimum.toFixed(2)} | ${row.maximum.toFixed(2)} | ${row.p95.toFixed(2)} |`
    )),
    '',
    `Request bị bỏ vì --skip-first: ${result.skippedFirst}`,
    `Dòng bị loại vì status không phải 2xx: ${result.excludedStatus}`,
  ];

  return lines.join('\n');
}

function run(args) {
  const filePath = args.find((arg) => !arg.startsWith('--'));
  const skipArgument = args.find((arg) => arg.startsWith('--skip-first='));
  const unknownArgument = args.find(
    (arg) => arg.startsWith('--') && !arg.startsWith('--skip-first='),
  );

  if (!filePath || unknownArgument) {
    throw new Error('Cách dùng: node scripts/latency-report.js <đường dẫn file log> [--skip-first=1]');
  }

  const skipFirst = skipArgument === undefined
    ? 1
    : Number(skipArgument.slice('--skip-first='.length));
  if (!Number.isInteger(skipFirst) || skipFirst < 0) {
    throw new RangeError('--skip-first phải là số nguyên không âm');
  }

  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  process.stdout.write(`${formatReport(summarize(lines, { skipFirst }))}\n`);
}

if (require.main === module) {
  try {
    run(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = { summarize };
