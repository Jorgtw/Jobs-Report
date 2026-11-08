import assert from 'node:assert/strict';
import { reportPeriod, localDate } from '../src/utils/reportPeriod';

assert.equal(localDate(new Date(2026, 0, 1, 0, 15)), '2026-01-01');
assert.deepEqual(reportPeriod('month', '', '', new Date(2024, 1, 29)), { dateFrom: '2024-02-01', dateTo: '2024-02-29' });
assert.deepEqual(reportPeriod('week', '', '', new Date(2026, 10, 1)), { dateFrom: '2026-10-26', dateTo: '2026-11-01' });
assert.deepEqual(reportPeriod('week', '', '', new Date(2026, 11, 31)), { dateFrom: '2026-12-28', dateTo: '2027-01-03' });
assert.deepEqual(reportPeriod('week', '', '', new Date(2026, 10, 2)), { dateFrom: '2026-11-02', dateTo: '2026-11-08' });
assert.deepEqual(reportPeriod('today', '', '', new Date(2026, 10, 8, 23, 59)), { dateFrom: '2026-11-08', dateTo: '2026-11-08' });
assert.deepEqual(reportPeriod('all'), {});
assert.deepEqual(reportPeriod('custom', '2026-01-01'), { dateFrom: '2026-01-01', dateTo: undefined });
assert.deepEqual(reportPeriod('custom', '', '2026-12-31'), { dateFrom: undefined, dateTo: '2026-12-31' });
assert.deepEqual(reportPeriod('custom'), { dateFrom: undefined, dateTo: undefined });
console.log('PASS: 10 period boundary cases, including local midnight, Sunday, leap day and year rollover.');
