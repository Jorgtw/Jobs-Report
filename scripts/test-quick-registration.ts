// Offline API regression tests: all outbound requests are mocked, no real accounts or emails.
import assert from 'node:assert/strict';
import handler from '../api/self-register';

process.env.VITE_SUPABASE_URL = 'https://registration-test.invalid';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
process.env.RESEND_API_KEY = 'test-mail-key';
process.env.ADMIN_EMAIL = 'admin@example.test';

const valid = { companyName: '  Test Company  ', email: 'OWNER@EXAMPLE.TEST', password: 'Test-password-42', acceptedTerms: true };
type Call = { path: string; method: string; body: any; query: string };
let calls: Call[] = [];
let scenario = 'success';
const originalFetch = globalThis.fetch;
const originalError = console.error;
globalThis.fetch = async (input, init) => {
  const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
  assert(['registration-test.invalid', 'api.resend.com'].includes(url.hostname), 'Unexpected network destination');
  const method = init?.method || 'GET';
  const body = init?.body ? JSON.parse(String(init.body)) : null;
  calls.push({ path: url.pathname, method, body, query: url.search });
  const reply = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', 'X-Supabase-Api-Version': '2024-01-01' } });
  if (url.hostname === 'api.resend.com') return reply({ id: 'mail' });
  if (method === 'GET') {
    if (scenario === 'company-exists' && url.pathname.endsWith('/companies')) return reply([{ id: 'existing-company' }]);
    return reply([]);
  }
  if (method === 'DELETE') return reply({});
  if (url.pathname === '/auth/v1/admin/users') {
    if (scenario === 'email-exists') return reply({ code: 'email_exists', msg: 'Email already registered' }, 422);
    return reply({ id: '11111111-1111-4111-8111-111111111111', email: 'owner@example.test' });
  }
  if (url.pathname.endsWith('/companies')) return reply([{ id: 'new-company' }]);
  if (url.pathname.endsWith('/clients')) return reply([{ id: 'internal-client' }]);
  if (scenario === 'bridge-fails' && url.pathname.endsWith('/user_companies')) return reply({ code: 'XX001', message: 'bridge failure' }, 400);
  if (scenario === 'project-fails' && url.pathname.endsWith('/projects')) return reply({ code: 'XX002', message: 'project failure' }, 400);
  return reply({});
};

async function invoke(body: any, mode = 'success', method = 'POST') {
  calls = []; scenario = mode;
  let status = 200; let payload: any;
  await handler({ method, body }, { status(value: number) { status = value; return this; }, json(value: any) { payload = value; return this; } });
  assert(!calls.some(c => c.method === 'PUT' || (c.method === 'GET' && c.path.includes('/auth/'))), 'Must not change or enumerate existing auth accounts');
  return { status, payload };
}

try {
  console.error = () => {}; // Expected failures below; assertions surface regressions.
  assert.equal((await invoke(valid, 'success', 'GET')).status, 405);
  for (const invalid of [undefined, { ...valid, companyName: ' ' }, { ...valid, email: 'invalid' }, { ...valid, email: {} }]) {
    assert.equal((await invoke(invalid)).payload.error, 'REGISTRATION_INVALID');
    assert.equal(calls.length, 0);
  }
  assert.equal((await invoke({ ...valid, password: 'short' })).payload.error, 'REGISTRATION_PASSWORD');
  assert.equal((await invoke({ ...valid, acceptedTerms: false })).payload.error, 'REGISTRATION_TERMS_REQUIRED');
  assert.equal(calls.length, 0);
  assert.equal((await invoke(valid)).status, 200);
  const company = calls.find(c => c.method === 'POST' && c.path.endsWith('/companies'))!.body[0];
  assert.equal(company.name, 'Test Company');
  for (const field of ['vat_number', 'address', 'city', 'country']) assert.equal(company[field], null);
  const worker = calls.find(c => c.method === 'POST' && c.path.endsWith('/workers'))!.body;
  assert.equal(worker.username, 'owner@example.test');
  assert.equal(worker.email, 'owner@example.test');
  assert.equal(worker.name, 'Test Company');
  assert.equal(worker.auth_id, '11111111-1111-4111-8111-111111111111');
  assert.equal(calls.find(c => c.path.endsWith('/projects'))!.body.is_internal, true);
  const emails = calls.filter(c => c.path === '/emails');
  assert.equal(emails.length, 2);
  assert(!JSON.stringify(emails).includes(valid.password), 'Never send passwords in email');
  assert.equal((await invoke({ ...valid, username: 'existing-style', adminName: 'Owner' })).status, 200);
  assert.equal(calls.find(c => c.path.endsWith('/workers') && c.method === 'POST')!.body.username, 'existing-style');
  assert.equal((await invoke(valid, 'company-exists')).payload.error, 'REGISTRATION_EXISTS');
  assert(!calls.some(c => c.method !== 'GET'));
  assert.equal((await invoke(valid, 'email-exists')).payload.error, 'REGISTRATION_EXISTS');
  assert(calls.some(c => c.method === 'DELETE' && c.path.endsWith('/companies')));
  assert(!calls.some(c => c.method === 'DELETE' && c.path.includes('/auth/')), 'Do not delete an existing identity');
  for (const mode of ['bridge-fails', 'project-fails']) {
    assert.equal((await invoke(valid, mode)).status, 500);
    assert(calls.some(c => c.method === 'DELETE' && c.path === '/auth/v1/admin/users/11111111-1111-4111-8111-111111111111'));
    assert(calls.some(c => c.method === 'DELETE' && c.path.endsWith('/user_companies') && c.query.includes('11111111-1111-4111-8111-111111111111')));
    assert(!calls.some(c => c.path === '/emails'));
  }
  console.log('PASS: validation, 3-field signup, legacy username, duplicate email protection, no emailed passwords, rollback on bridge/project failure. No network used.');
} finally {
  globalThis.fetch = originalFetch;
  console.error = originalError;
}
