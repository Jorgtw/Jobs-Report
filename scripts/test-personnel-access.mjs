import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const code = ts.transpileModule(fs.readFileSync('api/admin-auth-update.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
}).outputText;

async function run(options = {}) {
  const calls = [];
  const requester = { id: 'admin-worker', role: options.requesterRole || 'admin', company_id: 'company-a' };
  const target = { id: 'employee', auth_id: options.missingAuth ? null : 'employee-auth', name: 'Employee',
    username: 'employee', email: 'employee@example.test', company_id: options.company || 'company-a',
    role: options.role || 'operator', status: options.status || 'active' };
  const resultFor = (table, filters, mutation, single) => {
    if (mutation) {
      if (options.membershipFailure && table === 'user_companies') return { error: { message: 'failure' } };
      return { data: single ? { id: target.id } : null, error: null };
    }
    if (table === 'workers') return { data: filters.auth_id === 'admin-auth' ? requester : target, error: null };
    if (table === 'user_roles') {
      const protectedTarget = options.protectedTarget && (filters.user_id === target.id || filters.user_id?.includes?.('employee-auth'));
      return { data: protectedTarget ? (single ? { role: 'superadmin' } : [{ role: 'superadmin' }]) : (single ? null : []), error: null };
    }
    if (table === 'user_companies') return { data: [], error: null };
    throw new Error(`Unexpected table ${table}`);
  };
  const sb = {
    from(table) {
      const filters = {};
      let mutation = null;
      const query = {
        select() { return query; },
        eq(key, value) { filters[key] = value; return query; },
        in(key, value) { filters[key] = value; return query; },
        update(value) { mutation = value; calls.push({ type: 'update', table, value }); return query; },
        upsert(value) { mutation = value; calls.push({ type: 'upsert', table, value }); return query; },
        single() { return Promise.resolve(resultFor(table, filters, mutation, true)); },
        maybeSingle() { return Promise.resolve(resultFor(table, filters, mutation, true)); },
        then(resolve, reject) { return Promise.resolve(resultFor(table, filters, mutation, false)).then(resolve, reject); }
      };
      return query;
    },
    rpc: async () => ({ error: null }),
    auth: {
      getUser: async () => ({ data: { user: { id: 'admin-auth' } }, error: null }),
      admin: {
        getUserById: async () => ({ data: { user: { id: 'employee-auth', email: options.mismatch ? 'other@example.test' : target.email } }, error: null }),
        createUser: async value => {
          calls.push({ type: 'create', value });
          return options.createFailure ? { error: { message: 'email exists' } } : { data: { user: { id: 'new-auth' } }, error: null };
        },
        updateUserById: async (id, value) => { calls.push({ type: 'password', id, value }); return { error: options.passwordFailure ? { message: 'rejected' } : null }; },
        generateLink: async () => { calls.push({ type: 'link' }); return { data: { properties: { action_link: 'https://example.test/recover' } }, error: null }; }
      }
    }
  };
  const exports = {};
  new Function('exports', 'require', 'process', 'fetch', 'console', code)(exports,
    name => { assert.equal(name, '@supabase/supabase-js'); return { createClient: () => sb }; },
    { env: { VITE_SUPABASE_URL: 'https://example.test', SUPABASE_SERVICE_ROLE_KEY: 'test', RESEND_API_KEY: options.noMailConfig ? '' : 'test' } },
    async (_url, request) => {
      calls.push({ type: 'email', payload: JSON.parse(request.body) });
      if (options.networkFailure) throw new Error('network failure');
      return { ok: !options.emailFailure, status: options.emailFailure ? 503 : 200, json: async () => ({}) };
    },
    { log() {}, error() {} });
  const response = { statusCode: 200, body: null, status(value) { this.statusCode = value; return this; }, json(value) { this.body = value; return this; } };
  await exports.default({ method: 'POST', headers: { authorization: 'Bearer test' }, body: {
    action: options.action || 'generate-recovery-link', targetUserId: target.id,
    password: options.password === undefined ? 'Example123!' : options.password,
    updates: options.updates || { password: 'Example123!' }
  } }, response);
  return { ...response, calls };
}

for (const action of ['update', 'generate-recovery-link', 'send-access']) {
  for (const missingAuth of [false, true]) {
    const result = await run({ action, missingAuth });
    assert.equal(result.statusCode, 200, JSON.stringify(result.body));
    assert.equal(result.calls.some(c => c.type === 'create'), missingAuth);
    assert.equal(result.calls.some(c => c.type === 'email'), action !== 'update');
    if (action !== 'generate-recovery-link') assert.equal(result.calls.find(c => c.type === 'password').id, missingAuth ? 'new-auth' : 'employee-auth');
  }
  for (const scenario of [{ company: 'company-b' }, { requesterRole: 'operator' }, { protectedTarget: true }, { mismatch: true }, { status: 'inactive' }]) {
    const result = await run({ action, ...scenario });
    assert.ok(result.statusCode >= 400);
    assert.equal(result.calls.length, 0, 'Unauthorized/invalid account must not be mutated');
  }
}
const privilege = await run({ action: 'update', updates: { password: 'Example123!', role: 'superadmin' } });
assert.equal(privilege.statusCode, 403);
assert.equal(privilege.calls.length, 0);
const missingConfig = await run({ noMailConfig: true, missingAuth: true });
assert.equal(missingConfig.body.error, 'ACCESS_EMAIL_NOT_CONFIGURED');
assert.equal(missingConfig.calls.length, 0);
assert.equal((await run({ emailFailure: true })).body.error, 'ACCESS_EMAIL_SEND_FAILED');
const duplicate = await run({ missingAuth: true, createFailure: true });
assert.equal(duplicate.body.error, 'ACCESS_CREATE_FAILED');
assert.equal(duplicate.calls.some(c => c.type === 'link' || c.type === 'email' || c.type === 'password'), false);
const membershipFailure = await run({ membershipFailure: true });
assert.equal(membershipFailure.body.error, 'ACCESS_MEMBERSHIP_FAILED');
assert.equal(membershipFailure.calls.some(c => c.type === 'email'), false);

const direct = await run({ action: 'send-access', password: 'A<&"12345' });
assert.equal(direct.statusCode, 200);
assert.equal(direct.calls.some(c => c.type === 'link'), false, 'Direct access must not generate a recovery link');
const mail = direct.calls.find(c => c.type === 'email').payload;
assert.deepEqual(mail.to, ['employee@example.test']);
assert.ok(mail.text.includes('Password: A<&"12345'));
assert.ok(mail.html.includes('A&lt;&amp;&quot;12345'));
for (const text of ['https://jobs-report.vercel.app/', 'Username: employee', 'DAL TELEFONO', 'DAL PC']) assert.ok(mail.text.includes(text));
assert.ok(direct.calls.findIndex(c => c.type === 'password') < direct.calls.findIndex(c => c.type === 'email'));
assert.equal(direct.calls.some(c => c.table && JSON.stringify(c.value).includes('A<')), false, 'Never store the password in profile tables');
for (const password of ['', '123', '      ', null]) {
  const invalid = await run({ action: 'send-access', password });
  assert.equal(invalid.body.error, 'ACCESS_PASSWORD_TOO_SHORT');
  assert.equal(invalid.calls.length, 0);
}
const noConfig = await run({ action: 'send-access', noMailConfig: true });
assert.equal(noConfig.calls.length, 0, 'Missing email configuration must not reset the password');
const rejectedPassword = await run({ action: 'send-access', passwordFailure: true });
assert.equal(rejectedPassword.body.error, 'ACCESS_PASSWORD_UPDATE_FAILED');
assert.equal(rejectedPassword.calls.some(c => c.type === 'email'), false);
for (const scenario of [{ emailFailure: true }, { networkFailure: true }]) {
  const failed = await run({ action: 'send-access', ...scenario });
  assert.equal(failed.body.error, 'ACCESS_PASSWORD_SAVED_EMAIL_FAILED');
  assert.equal(failed.calls.some(c => c.type === 'password'), true);
}
// Verify the real browser service passes the password to Auth, never to workers.
const dbCode = ts.transpileModule(fs.readFileSync('src/services/dbService.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
}).outputText;
const dbCalls = [];
const fakeSupabase = {
  auth: { getSession: async () => ({ data: { session: { access_token: 'test-token' } } }) },
  from(table) {
    const query = {
      update(value) { dbCalls.push({ table, value }); return query; },
      eq() { return query; },
      then(resolve, reject) { return Promise.resolve({ error: null }).then(resolve, reject); }
    };
    return query;
  }
};
const dbModule = {};
new Function('exports', 'require', 'fetch', dbCode)(dbModule,
  name => name === './supabase' ? { supabase: fakeSupabase } : {},
  async (url, request) => { dbCalls.push({ url, payload: JSON.parse(request.body) }); return { ok: true, headers: { get: () => 'application/json' }, json: async () => ({success:true}) }; });
const db = dbModule.db;
db.setCompanyId('company-a');
db.enforceActionPolicy = async () => {};
db.getUserById = async () => ({ id: 'employee', authId: 'employee-auth', email: 'employee@example.test' });
await db.updateUser('employee', { email: 'employee@example.test', name: 'Updated name', password: '' });
assert.equal(dbCalls.some(c => c.url), false, 'Unchanged email must not trigger Auth');
assert.equal(dbCalls[0].value.password, undefined);
dbCalls.length = 0;
await db.updateUser('employee', { email: 'employee@example.test', password: 'Example123!', role: 'operator' });
assert.equal(dbCalls.length, 1, 'Sensitive updates must use the authorized server only');
assert.equal(dbCalls[0].payload.updates.password, 'Example123!');
assert.equal(dbCalls[0].payload.targetUserId, 'employee');
dbCalls.length = 0;
await db.sendAccessInstructions('employee', 'Example123!');
assert.equal(dbCalls[0].payload.action, 'send-access');
assert.equal(dbCalls[0].payload.password, 'Example123!');
await db.sendAccessInstructions('employee');
assert.equal(dbCalls[1].payload.action, 'generate-recovery-link', 'Preserve other existing invitation flows');
console.log('Personnel access checks passed: company admin, account creation, password forwarding, email failures, tenant isolation, protected accounts.');
