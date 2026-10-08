import assert from 'node:assert/strict';
import { db } from '../src/services/dbService';
let calls: {url: URL;method: string;body: any}[]=[];
let failure=false;
const originalFetch=globalThis.fetch;
globalThis.fetch=async(input,init)=>{
 const url=new URL(String(input));assert.equal(url.hostname,'clients-test.invalid');
 const method=init?.method||'GET';const body=init?.body?JSON.parse(String(init.body)):null;calls.push({url,method,body});
 const reply=(data:any,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});
 if(url.pathname.endsWith('/companies'))return reply({status:'active'});
 if(failure)return reply({code:'23505',message:'Duplicate client'},409);
 if(method==='POST')return reply([{id:'new-client',...body[0]}],201);
 if(method==='PATCH'||method==='DELETE')return new Response(null,{status:204});
 return reply([{id:'new-client',name:'Read client',billingAddress:'Via Uno',status:'active',created_at:'2026-10-08T12:00:00Z'}]);
};
try {
 db.setCompanyId('tenant-a');
 const form={name:'Test client',vatNumber:'VAT',billingAddress:'Via Uno',mainContactName:'Contact',mainContactPhone:'123',email:'',notes:'Notes',status:'active'};
 const created=await db.addClient({...form,company_id:'tenant-b',defaultHourlyRate:12});
 assert.equal(created.billingAddress,'Via Uno');assert.equal(created.email,'');
 const insert=calls.find(c=>c.method==='POST')!;
 assert.equal(insert.body[0].company_id,'tenant-a');assert(!('default_hourly_rate' in insert.body[0]));assert(!insert.url.search.includes('default_hourly_rate'));
 assert.deepEqual(Object.keys(insert.body[0]).sort(),['name','vat_number','billingAddress','contact_person','phone','email','internal_note','status','company_id','created_at'].sort());
 await db.updateClient('new-client',{...form,email:'person@example.test',status:'inactive'});
 const update=calls.find(c=>c.method==='PATCH')!;assert.equal(update.url.searchParams.get('company_id'),'eq.tenant-a');assert.equal(update.url.searchParams.get('id'),'eq.new-client');assert.equal(update.body.email,'person@example.test');assert.equal(update.body.status,'inactive');assert(!('default_hourly_rate' in update.body));
 assert.equal((await db.getClients())[0].billingAddress,'Via Uno');
 await db.deleteClient('new-client');assert.equal(calls.find(c=>c.method==='DELETE')!.url.searchParams.get('company_id'),'eq.tenant-a');
 failure=true;await assert.rejects(db.addClient(form),(e:any)=>e.code==='23505'&&e.message==='Duplicate client');
 failure=false;calls=[];db.setCompanyId(null);await assert.rejects(db.addClient(form));assert.equal(calls.length,0);
 console.log('PASS: actual DBService + Supabase HTTP serialization; create/read/update/delete, empty and filled email, legacy billingAddress, unknown field omission, tenant filters, missing company blocked, server error propagation. Mock HTTP; no live RLS verification.');
}finally{globalThis.fetch=originalFetch;}
