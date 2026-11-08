import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { QueryClient } from '@tanstack/react-query';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const calls = { reports: [], projects: 0, clients: 0, workers: 0, summary: 0 };
globalThis.reportCacheTestDb = {
  getReports: async (...dates) => { calls.reports.push(dates); return [{ id: 'report', additionalWorkers: [{ userId: 'helper' }], expenses: [{ amount: 7 }] }]; },
  getProjects: async () => { calls.projects++; return [{ id: 'project' }]; },
  getClients: async () => { calls.clients++; return [{ id: 'client' }]; },
  getUsers: async () => { calls.workers++; return [{ id: 'worker' }]; },
  getSummary: async (_from, _to, sources) => { calls.summary++; assert.equal(sources.reports[0].expenses[0].amount, 7); assert.equal(sources.reports[0].additionalWorkers[0].userId, 'helper'); return sources.reports; },
};
const outfile = path.resolve('scratch/report-queries-test.mjs');
await build({
  entryPoints: ['src/services/reportQueries.ts'], outfile, bundle: true, platform: 'node', format: 'esm', packages: 'external',
  plugins: [{ name: 'isolated-database', setup(b) {
    b.onResolve({ filter: /dbService$/ }, () => ({ path: 'db', namespace: 'mock-db' }));
    b.onLoad({ filter: /.*/, namespace: 'mock-db' }, () => ({ contents: 'export const db = globalThis.reportCacheTestDb;' }));
  } }],
});
const { reportsQueryOptions, summaryQueryOptions } = await import(pathToFileURL(outfile).href);
const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
const month = reportsQueryOptions('company', 'user', '2026-11-01', '2026-11-30');
await Promise.all([client.fetchQuery(month), client.fetchQuery(month)]);
assert.equal(calls.reports.length, 1, 'concurrent loads should share one request');
assert.deepEqual(calls.reports[0], ['2026-11-01', '2026-11-30']);
await client.fetchQuery(reportsQueryOptions('company', 'user', '2026-10-01', '2026-10-31'));
assert.equal(calls.reports.length, 2, 'different periods must not share results');
const summary = summaryQueryOptions(client, 'company', 'user');
await Promise.all([client.fetchQuery(summary), client.fetchQuery(summary)]);
assert.deepEqual(calls.reports[2], [undefined, undefined], 'summary retains full history');
assert.equal(calls.summary, 1);
assert.equal(calls.projects, 1);
await client.fetchQuery({ queryKey: ['projects', 'company', 'user'], queryFn: () => globalThis.reportCacheTestDb.getProjects(), staleTime: 30000 });
assert.equal(calls.projects, 1, 'anagraphic reads should reuse the shared cache');
await client.invalidateQueries({ queryKey: ['reports'] });
await client.fetchQuery(month);
assert.equal(calls.reports.length, 4, 'a mutation invalidation refreshes a bounded list');
await client.fetchQuery(reportsQueryOptions('other-company', 'user', '2026-11-01', '2026-11-30'));
assert.equal(calls.reports.length, 5, 'companies must have separate cache entries');
client.clear();
console.log('PASS: period arguments, concurrent deduplication, source reuse, full-history summary, invalidation and company isolation. No database connected.');
