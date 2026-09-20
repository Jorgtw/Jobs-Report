// Offline regression tests for the real API handlers; every network operation is mocked.
import assert from 'node:assert/strict';
import recovery from '../api/recover-account';
import admin from '../api/admin-auth-update';
import deletion from '../api/delete-account';
import { usernamePattern } from '../api/_lib/account-identity';
process.env.VITE_SUPABASE_URL='https://accounts-test.invalid';
process.env.SUPABASE_SERVICE_ROLE_KEY='test-key';
process.env.RESEND_API_KEY='mail-key';
const savedFetch=globalThis.fetch, savedError=console.error;
const calls: any[]=[];
let mode='normal';
const actor='11111111-1111-4111-8111-111111111111';
const target='22222222-2222-4222-8222-222222222222';
const authTarget='33333333-3333-4333-8333-333333333333';
const company='44444444-4444-4444-8444-444444444444';
const other='55555555-5555-4555-8555-555555555555';
const reply=(data: any,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});
globalThis.fetch=async (input,init)=>{
 const u=new URL(typeof input==='string'?input:input instanceof URL?input.href:input.url);
 assert(['accounts-test.invalid','api.resend.com'].includes(u.hostname));
 const method=init?.method||'GET', body=init?.body?JSON.parse(String(init.body)):null;
 calls.push({path:u.pathname,query:u.searchParams,method,body});
 if(u.hostname==='api.resend.com')return reply({id:'mail'},mode==='mail-fail'?500:200);
 if(u.pathname.endsWith('/rpc/allow_account_recovery'))return mode==='limit-fail'?reply({message:'offline'},500):reply(mode!=='limited');
 if(u.pathname.endsWith('/rpc/delete_company_account_resource'))return mode==='forbidden'?reply({message:'ACCESS_FORBIDDEN'},400):reply(null);
 if(u.pathname==='/auth/v1/user')return mode==='unauthorized'?reply({message:'unauthorized'},401):reply({id:actor,email:'admin@internal.invalid'});
 if(u.pathname==='/auth/v1/admin/users' && method==='POST')return reply({id:authTarget,email:body.email});
 if(u.pathname===`/auth/v1/admin/users/${authTarget}`)return reply({id:authTarget,email:'isolated@accounts.jobs-report.invalid'});
 if(u.pathname==='/auth/v1/admin/generate_link')return reply({id:authTarget,email:body.email,action_link:'https://accounts-test.invalid/verify?token=opaque',hashed_token:'hash',verification_type:'recovery'});
 if(u.pathname.endsWith('/workers')){
  if(method!=='GET')return reply([{id:target}]);
  if(u.searchParams.has('username')){
    if(u.searchParams.get('select')==='id, auth_id, company_id'||u.searchParams.get('select')==='id,auth_id,company_id')return reply(mode==='duplicate'?[{id:target,auth_id:authTarget,company_id:other}]:[]);
    return reply(mode==='unknown'?[]:[{auth_id:authTarget,email:'shared@example.test',username:'antonio.alfa',company_id:company,status:mode==='inactive'?'inactive':'active'}]);
  }
  if(u.searchParams.get('auth_id')===`eq.${actor}`)return reply([{id:actor,role:'admin',company_id:company,status:'active'}]);
  return reply([{id:target,auth_id:authTarget,email:'shared@example.test',username:'antonio.alfa',company_id:mode==='cross-company'?other:company,name:'Antonio',role:mode==='protected'?'superadmin':'worker',status:'active'}]);
 }
 if(u.pathname.endsWith('/user_roles'))return reply([]);
 if(u.pathname.endsWith('/user_companies'))return reply(mode==='shared'?[{company_id:company},{company_id:other}]:[{company_id:company}]);
 if(u.pathname.endsWith('/account_deletion_queue'))return reply(method==='GET'?[{auth_id:authTarget}]:{});
 throw new Error('Unexpected mocked request: '+u.pathname);
};
async function run(handler:any,body:any,scenario='normal',authorization=true){
 mode=scenario;calls.length=0;let status=200,payload:any;
 await handler({method:'POST',headers:authorization?{authorization:'Bearer test','x-vercel-forwarded-for':'192.0.2.1'}:{},body},{setHeader(){},status(n:number){status=n;return this;},json(v:any){payload=v;return this;}});
 return {status,payload};
}
try{
 console.error=()=>{};
 assert.equal(usernamePattern('user_name%'),String.raw`user\_name\%`);
 let result=await run(recovery,{username:'Antonio.Alfa'});
 assert.equal(result.status,200);
 assert.equal(calls.find(c=>c.path.endsWith('/generate_link')).body.email,'isolated@accounts.jobs-report.invalid');
 assert.deepEqual(calls.find(c=>c.path==='/emails').body.to,['shared@example.test']);
 assert(calls.find(c=>c.path==='/emails').body.text.includes('antonio.alfa'));
 for(const scenario of ['unknown','inactive','limited']){
  assert.deepEqual((await run(recovery,{username:'Antonio.Alfa'},scenario)).payload,{success:true});
  assert(!calls.some(c=>c.path==='/emails'||c.path.endsWith('/generate_link')));
 }
 assert.equal((await run(recovery,{username:'x'},'limit-fail')).status,503);
 assert(!calls.some(c=>c.path==='/emails'));
 assert.equal((await run(recovery,{username:'x'},'mail-fail')).status,503);
 const create={action:'create',updates:{name:'Antonio',username:'antonio.betta',password:'Test-only-42',email:'shared@example.test',companyId:company,role:'worker'}};
 assert.equal((await run(admin,create)).status,200);
 const first=calls.find(c=>c.path==='/auth/v1/admin/users').body.email;
 assert.match(first,/@accounts\.jobs-report\.invalid$/);
 assert(!calls.some(c=>c.method==='GET'&&c.path==='/auth/v1/admin/users'));
 assert(!calls.some(c=>c.query.get('email')),'Never find an identity by contact email');
 assert.equal((await run(admin,create)).status,200);
 assert.notEqual(calls.find(c=>c.path==='/auth/v1/admin/users').body.email,first);
 assert.equal((await run(admin,create,'duplicate')).status,409);
 assert(!calls.some(c=>c.path.startsWith('/auth/v1/admin')));
 const update={targetUserId:target,updates:{password:'New-test-only-42'}};
 for(const scenario of ['cross-company','protected','shared']){
  assert((await run(admin,update,scenario)).status>=400);
  assert(!calls.some(c=>c.method==='PUT'&&c.path.startsWith('/auth/v1/admin')));
 }
 assert.equal((await run(admin,update)).status,200);
 assert.equal(calls.filter(c=>c.method==='PUT'&&c.path.startsWith('/auth/v1/admin')).length,1);
 assert.equal((await run(deletion,{workerId:target},'normal',false)).status,401);
 assert.equal((await run(deletion,{workerId:target},'forbidden')).status,403);
 assert(!calls.some(c=>c.method==='DELETE'));
 assert.equal((await run(deletion,{workerId:target})).status,200);
 const deleted=calls.filter(c=>c.path.startsWith('/auth/')&&c.method==='DELETE');
 assert.deepEqual(deleted.map(c=>c.path),[`/auth/v1/admin/users/${authTarget}`]);
 console.log('PASS: separate identities, no email relinking, username conflicts, cross-company/protected/shared account refusal, targeted recovery, durable rate limit failures, authorized isolated deletion. No real network or email.');
}finally{globalThis.fetch=savedFetch;console.error=savedError;}
