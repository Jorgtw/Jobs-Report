import fs from 'node:fs';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
const modulePath = process.env.PGLITE_MODULE;
if (!modulePath) throw new Error('Set PGLITE_MODULE to the local @electric-sql/pglite dist/index.js');
const { PGlite } = await import(pathToFileURL(modulePath).href);
const pg = new PGlite();
try {
 await pg.exec(fs.readFileSync('scripts/fixtures/company-accounts-schema.sql','utf8'));
 const migration=fs.readFileSync('supabase_migration_company_usernames.sql','utf8').replace('COMMIT;','');
 const tests=fs.readFileSync('scripts/test-company-accounts.sql','utf8');
 // Seed a report in the SQL fixture before testing worker deletion.
 const withHistory = tests.replace(' PERFORM public.delete_company_account_resource(sa,NULL,w1);\n IF NOT EXISTS',
   ` INSERT INTO public.reports(company_id,created_by) VALUES(c1,w1);
 INSERT INTO public.rapportini_workers(rapportino_id,worker_id,company_id) SELECT id,w1,c1 FROM public.reports WHERE company_id=c1;
 PERFORM public.delete_company_account_resource(sa,NULL,w1);
 IF NOT EXISTS(SELECT 1 FROM public.reports WHERE created_by=w1) OR NOT EXISTS(SELECT 1 FROM public.rapportini_workers WHERE worker_id=w1) THEN RAISE EXCEPTION 'Historical reports lost'; END IF;
 IF NOT EXISTS`);
 const results=await pg.exec(migration+'\n'+withHistory);
 console.log(results.flatMap(r=>r.rows).filter(Boolean));
 assert.equal((await pg.query("SELECT count(*)::integer n FROM public.companies")).rows[0].n,0);
 // Apply the migration twice locally to verify deployment repeatability and role grants.
 await pg.exec(fs.readFileSync('supabase_migration_company_usernames.sql','utf8'));
 await pg.exec(fs.readFileSync('supabase_migration_company_usernames.sql','utf8'));
 const grants=await pg.query("SELECT has_function_privilege('anon','public.delete_company_account_resource(uuid,uuid,uuid)','EXECUTE') AS can_delete, has_function_privilege('authenticated','public.allow_account_recovery(text,text)','EXECUTE') AS can_limit, has_function_privilege('anon','public.get_email_by_username(text)','EXECUTE') AS can_lookup");
 assert.deepEqual(grants.rows[0],{can_delete:false,can_limit:false,can_lookup:true});
 console.log('PASS: historical reports preserved, repeatable migration and restricted RPC permissions.');
 console.log('PASS: local PostgreSQL transaction rolled back all fixture and migration changes.');
} finally { await pg.close(); }
