import fs from 'node:fs';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
const modulePath = process.env.PGLITE_MODULE || path.resolve('scratch/account-db-test/node_modules/@electric-sql/pglite/dist/index.js');
const { PGlite } = await import(pathToFileURL(modulePath).href);
const pg = new PGlite();
let checks=0;
const id=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const eq=(actual,expected)=>{assert.deepEqual(actual,expected);checks++;};
const fails=async fn=>{await assert.rejects(fn);checks++;};
const as=async n=>{await pg.exec('RESET ROLE');await pg.query("SELECT set_config('request.jwt.claim.sub',$1,false)",[id(n)]);await pg.exec('SET ROLE authenticated');};
try {
 await pg.exec(fs.readFileSync('scripts/fixtures/company-accounts-schema.sql','utf8'));
 await pg.exec(`
 CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 CREATE TABLE clients(id uuid PRIMARY KEY,company_id uuid REFERENCES companies,name text);
 ALTER TABLE projects ADD COLUMN client_id uuid REFERENCES clients, ADD COLUMN title text, ADD COLUMN site_address text, ADD COLUMN assigned_worker_ids uuid[];
 ALTER TABLE reports ADD COLUMN date date, ADD COLUMN start_time time, ADD COLUMN end_time time, ADD COLUMN total_hours numeric, ADD COLUMN invoice_status text DEFAULT 'Pending';
 GRANT USAGE ON SCHEMA public,auth TO authenticated;
 GRANT SELECT ON companies,user_companies,workers,clients,rapportini_workers TO authenticated;
 GRANT SELECT,INSERT,UPDATE,DELETE ON projects,reports TO authenticated;
 ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
 CREATE POLICY project_access ON projects TO authenticated USING (
   EXISTS(SELECT 1 FROM user_companies uc WHERE uc.auth_id=auth.uid() AND uc.company_id=projects.company_id
   AND (uc.role<>'supervisor' OR projects.title<>'Restricted')));
 ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
 CREATE POLICY report_access ON reports TO authenticated USING (
   EXISTS(SELECT 1 FROM user_companies uc WHERE uc.auth_id=auth.uid() AND uc.company_id=reports.company_id
   AND (uc.role IN ('admin','supervisor') OR EXISTS(SELECT 1 FROM workers w WHERE w.id=reports.created_by AND w.auth_id=auth.uid()))));
 `);
 const migration=fs.readFileSync('supabase_migration_work_calendar.sql','utf8');
 await pg.exec(migration);await pg.exec(migration); checks++;
 await pg.query("INSERT INTO companies(id,name,status) VALUES($1,'A','active'),($2,'B','active')",[id(1),id(2)]);
 for(const [n,role,c,name] of [[11,'admin',1,'Admin'],[12,'supervisor',1,'Supervisor'],[13,'operator',1,'Dogan'],[14,'operator',1,'Marco'],[15,'admin',2,'Other admin'],[16,'operator',2,'Other worker']]) {
   await pg.query('INSERT INTO auth.users(id) VALUES($1)',[id(n)]);
   await pg.query("INSERT INTO workers(id,auth_id,company_id,role,name,status) VALUES($1,$1,$2,$3,$4,'active')",[id(n),id(c),role,name]);
   await pg.query('INSERT INTO user_companies(auth_id,company_id,role) VALUES($1,$2,$3)',[id(n),id(c),role]);
 }
 await pg.query("INSERT INTO clients VALUES($1,$2,'Alfa'),($3,$4,'Beta')",[id(41),id(1),id(42),id(2)]);
 for(const [n,c,client,name,workers] of [[21,1,41,'Ufficio Alfa',[]],[22,2,42,'Other project',[]],[23,1,41,'Restricted',[]],[24,1,41,'Dogan only',[id(13)]],[25,1,41,'Manual project',[]]]) {
   await pg.query('INSERT INTO projects VALUES($1,$2,$3,$4,$5,$6)',[id(n),id(c),id(client),name,'Frederiksberg',workers]);
 }
 const rule={project_id:id(21),title:'Pulizia',notes:'Entrance A',schedule_type:'recurring',start_date:'2026-10-01',end_date:null,start_time:'18:00',end_time:'20:00',weekdays:[3,0],status:'planned'};
 const save=async(sid,scope='all',date=null,data=rule,workers=[id(13)],remove=false,c=id(1))=>(await pg.query('SELECT calendar_save($1,$2,$3,$4,$5,$6,$7) id',[c,sid,scope,date,data,workers,remove])).rows[0].id;
 const feed=async(c=id(1),from='2026-10-01',to='2026-10-31')=>(await pg.query('SELECT calendar_feed($1,$2,$3) items',[c,from,to])).rows[0].items;
 await as(11);
 const sid=await save(null);
 const october=['2026-10-04','2026-10-07','2026-10-11','2026-10-14','2026-10-18','2026-10-21','2026-10-25','2026-10-28'];
 eq((await feed()).map(o=>o.date),october);
 eq((await pg.query('SELECT count(*)::int n FROM work_schedules')).rows[0].n,1);
 eq((await feed())[0].workers,[{id:id(13),name:'Dogan'}]);
 await as(13);
 eq((await feed()).length,8);
 eq((await pg.query('SELECT * FROM work_schedules')).rows.length,0);
 eq((await pg.query('SELECT * FROM work_schedule_workers')).rows.length,0);
 eq((await pg.query('SELECT * FROM work_schedule_exceptions')).rows.length,0);
 eq((await pg.query('SELECT * FROM calendar_occurrences($1,$2,$3)',[id(1),'2026-10-01','2026-10-31'])).rows.length,0);
 await fails(()=>save(null));
 eq(await feed(id(2)),[]);
 await as(14);eq(await feed(),[]);
 await as(15);eq(await feed(),[]);eq((await pg.query('SELECT * FROM work_schedules')).rows.length,0);
 await fails(()=>save(sid));
 await as(11);
 await save(sid,'this','2026-10-11',{...rule,title:'Sostituzione'},[id(14)]);
 eq((await feed()).filter(o=>o.workers.some(w=>w.id===id(13))).length,7);
 await as(13);eq((await feed()).map(o=>o.date),october.filter(d=>d!=='2026-10-11'));
 await as(14);eq((await feed()).map(o=>o.date),['2026-10-11']);
 eq((await feed())[0].workers,[{id:id(14),name:'Marco'}]);
 await as(13);
 const report=id(31);
 await pg.query('INSERT INTO reports(id,company_id,project_id,created_by,date,start_time,end_time,total_hours,schedule_id,schedule_date) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$5)',[report,id(1),id(21),id(13),'2026-10-07','18:00','21:00',3,sid]);
 eq(Number((await pg.query('SELECT total_hours FROM reports WHERE id=$1',[report])).rows[0].total_hours),3);
 eq((await feed()).find(o=>o.date==='2026-10-07').endTime,'20:00:00');
 eq((await feed()).find(o=>o.date==='2026-10-07').reports,[{id:report,workerId:id(13)}]);
 await fails(()=>pg.query('INSERT INTO reports(company_id,project_id,created_by,date,schedule_id,schedule_date) VALUES($1,$2,$3,$4,$5,$4)',[id(1),id(21),id(13),'2026-10-11',sid]));
 await fails(()=>pg.query('INSERT INTO reports(company_id,project_id,created_by,date,schedule_id,schedule_date) VALUES($1,$2,$3,$4,$5,$4)',[id(1),id(21),id(13),'2026-10-07',sid]));
 await fails(()=>pg.query('INSERT INTO reports(company_id,project_id,created_by,date,schedule_id,schedule_date) VALUES($1,$2,$3,$4,$5,$4)',[id(1),id(21),id(13),'2026-10-08',sid]));
 await pg.query('INSERT INTO reports(company_id,project_id,created_by,date,total_hours) VALUES($1,$2,$3,$4,4)',[id(1),id(25),id(13),'2026-10-08']);
 eq((await pg.query('SELECT * FROM reports WHERE schedule_id IS NULL')).rows.length,1);
 await as(11);
 await fails(()=>save(null,'all',null,{...rule,project_id:id(22)}));
 await fails(()=>save(null,'all',null,rule,[id(16)]));
 await fails(()=>save(null,'all',null,{...rule,project_id:id(24)},[id(14)]));
 await fails(()=>save(null,'all',null,{...rule,end_date:'2026-09-30'}));
 await fails(()=>save(null,'all',null,{...rule,weekdays:[]}));
 await fails(()=>save(null,'all',null,{...rule,weekdays:[8]}));
 await fails(()=>save(null,'all',null,{...rule,start_time:'21:00'}));
 await fails(()=>save(null,'all',null,rule,[]));
 await fails(()=>feed(id(1),'2026-01-01','2027-01-01'));
 eq((await pg.query('SELECT count(*)::int n FROM work_schedules')).rows[0].n,1); // Rollback also roster failure.
 const restricted=await save(null,'all',null,{...rule,project_id:id(23)},[id(13)]);
 await as(12);
 eq((await feed()).some(o=>o.scheduleId===restricted),false);
 await fails(()=>save(restricted));
 await save(sid,'all',null,{...rule,title:'Updated by supervisor'});
 eq((await feed()).find(o=>o.date==='2026-10-11').title,'Sostituzione');
 await pg.exec('RESET ROLE');
 await pg.exec(`ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
 CREATE POLICY workers_access ON workers TO authenticated USING (
 EXISTS(SELECT 1 FROM user_companies uc WHERE uc.auth_id=auth.uid() AND uc.company_id=workers.company_id
   AND (uc.role<>'supervisor' OR workers.name<>'Marco')));`);
 await as(12);
 eq((await feed()).some(o=>o.scheduleId===sid),false);
 await fails(()=>save(sid));
 await pg.exec('RESET ROLE; DROP POLICY workers_access ON workers; ALTER TABLE workers DISABLE ROW LEVEL SECURITY');
 await as(11);
 const future=await save(sid,'following','2026-10-07',{...rule,title:'Future rule'});
 eq((await feed()).filter(o=>o.scheduleId===sid).map(o=>o.date),['2026-10-04']);
 eq((await feed()).find(o=>o.scheduleId===future && o.date==='2026-10-11').workers[0].id,id(14));
 eq((await pg.query('SELECT schedule_id FROM reports WHERE id=$1',[report])).rows[0].schedule_id,future);
 await fails(()=>save(future,'all',null,{...rule,project_id:id(25),start_date:'2026-10-07'}));
 eq((await pg.query('SELECT project_id FROM work_schedules WHERE id=$1',[future])).rows[0].project_id,id(21));
 await save(future,'this','2026-10-14',rule,[],true);
 await as(13);eq((await feed()).some(o=>o.scheduleId===future && o.date==='2026-10-14'),false);
 await as(11);
 const single=await save(null,'all',null,{...rule,schedule_type:'single',weekdays:[],start_date:'2026-10-09',start_time:null,end_time:null});
 eq((await feed()).filter(o=>o.scheduleId===single).length,1);
 await save(single,'all',null,rule,[],true);
 eq((await feed()).some(o=>o.scheduleId===single),false);
 await save(future,'following','2026-10-18',rule,[],true);
 eq((await feed()).filter(o=>o.scheduleId===future).map(o=>o.date),['2026-10-07','2026-10-11','2026-10-14']);
 await save(future,'all',null,rule,[],true);
 eq((await pg.query('SELECT schedule_id,total_hours,invoice_status FROM reports WHERE id=$1',[report])).rows[0],{schedule_id:null,total_hours:'3',invoice_status:'Pending'});
 const team=await save(null,'all',null,rule,[id(13),id(14)]);
 await as(13);
 const mine=(await feed()).find(o=>o.scheduleId===team);
 eq(mine.workers,[{id:id(13),name:'Dogan'}]);
 await as(14);eq((await feed()).find(o=>o.scheduleId===team).workers,[{id:id(14),name:'Marco'}]);
 await as(11);
 await pg.query('INSERT INTO reports(id,company_id,project_id,created_by,date,schedule_id,schedule_date) VALUES($1,$2,$3,$4,$5,$6,$5)',[id(32),id(1),id(21),id(13),'2026-10-07',team]);
 await pg.exec('RESET ROLE');
 await pg.query('INSERT INTO rapportini_workers(rapportino_id,worker_id,company_id) VALUES($1,$2,$3)',[id(32),id(14),id(1)]);
 await as(14);
 eq((await feed()).find(o=>o.scheduleId===team && o.date==='2026-10-07').reports,[{id:id(32),workerId:id(14)}]);
 await as(11);
 await fails(()=>pg.query("INSERT INTO work_schedules(company_id,project_id,title,schedule_type,start_date,end_date) VALUES($1,$2,'Bad','single','2026-10-01',NULL)",[id(1),id(21)]));
 await pg.exec('RESET ROLE; SET ROLE anon');
 await fails(()=>pg.query('SELECT * FROM work_schedules'));
 await fails(()=>feed());
 await pg.exec('RESET ROLE');
 eq((await pg.query('SELECT count(*)::int n FROM projects WHERE id=$1',[id(25)])).rows[0].n,1);
 console.log(`PASS: ${checks} calendar PostgreSQL checks (real RLS, grants, recurrences, overrides, splits, rollback, report links, actual hours, manual compatibility).`);
} finally { await pg.close(); }
