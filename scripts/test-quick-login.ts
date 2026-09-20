// Execute the actual login method with a fake Supabase client, without loading app globals.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const source = fs.readFileSync('src/services/dbService.ts', 'utf8');
const ast = ts.createSourceFile('dbService.ts', source, ts.ScriptTarget.Latest, true);
let method = '';
function visit(node: ts.Node) {
  if (ts.isMethodDeclaration(node) && node.name.getText(ast) === 'loginUser') method = node.getText(ast);
  ts.forEachChild(node, visit);
}
visit(ast);
assert(method, 'Actual login method must be present');
const js = ts.transpileModule(`class LoginHarness { ${method} }`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;

async function login(identifier: string, mode = 'success', password = 'test-password') {
  const calls: string[] = [];
  const mock = {
    rpc: async (name: string) => {
      calls.push(name);
      if (name === 'get_email_by_username') return { data: mode === 'unknown' ? null : 'legacy@example.test' };
      if (name === 'get_user_session_context') return { data: [{ cid: 'company', cname: 'Test Company', urole: 'admin' }] };
      throw new Error('Unexpected RPC: ' + name);
    },
    from: (table: string) => {
      assert.equal(table, 'workers');
      let field = '';
      const query = {
        select() { return query; },
        eq(key: string) { field = key; return query; },
        async maybeSingle() {
          if (field === 'username') return { data: null };
          return { data: { id: 'worker', name: 'Owner', status: 'active', company_id: 'company', role: 'admin' } };
        },
      };
      return query;
    },
    auth: { signInWithPassword: async (credentials: { email: string; password: string }) => {
      calls.push('signin:' + credentials.email);
      assert.equal(credentials.password, password);
      return mode === 'bad-password' ? { error: { message: 'Invalid credentials' }, data: { user: null } } : { data: { user: { id: 'auth' } } };
    } },
  };
  const Harness = new Function('supabase', js + '; return LoginHarness;')(mock);
  const instance = new Harness();
  instance.setCompanyId = () => {};
  instance.mapSupabaseWorker = (worker: any) => worker;
  instance.checkIsSuperAdmin = async () => false;
  instance.setIsSuperAdmin = () => {};
  const result = await instance.loginUser(identifier, password);
  return { result, calls };
}

const log = console.log;
const error = console.error;
try {
  console.log = () => {}; console.error = () => {};
  let result = await login('  OWNER@EXAMPLE.TEST  ');
  assert.equal(result.result.id, 'worker');
  assert(result.calls.includes('signin:legacy@example.test'));
  assert(result.calls.includes('get_email_by_username'));
  result = await login('Legacy.Admin');
  assert.equal(result.result.id, 'worker');
  assert(result.calls.includes('get_email_by_username'));
  assert(result.calls.includes('signin:legacy@example.test'));
  result = await login('Unknown', 'unknown');
  assert.equal(result.result, null);
  assert(!result.calls.some(c => c.startsWith('signin:')));
  assert.equal((await login('owner@example.test', 'bad-password')).result, null);
  assert.equal((await login('owner@example.test', 'success', '')).result, null);
} finally {
  console.log = log; console.error = error;
}
console.log('PASS: exact username lookup including legacy email-shaped usernames, unknown user, wrong/missing password. No network used.');
