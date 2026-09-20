-- Run after the migration, inside the same transaction; always ROLLBACK afterwards.
DO $$
DECLARE sa uuid; c1 uuid:=gen_random_uuid(); c2 uuid:=gen_random_uuid(); a1 uuid:=gen_random_uuid(); a2 uuid:=gen_random_uuid();
 w1 uuid:=gen_random_uuid(); w2 uuid:=gen_random_uuid(); prefix text:='account_test_'||replace(gen_random_uuid()::text,'-','');
BEGIN
 SELECT auth_id INTO sa FROM public.workers WHERE role='superadmin' AND status='active' AND auth_id IS NOT NULL LIMIT 1;
 IF sa IS NULL THEN RAISE EXCEPTION 'Test requires an existing superadmin'; END IF;
 INSERT INTO public.companies(id,name,status) VALUES(c1,prefix||' Alfa','active'),(c2,prefix||' Betta','active');
 INSERT INTO auth.users(id,email,raw_app_meta_data) VALUES(a1,a1::text||'@accounts.jobs-report.invalid','{"company_account":true}'),(a2,a2::text||'@accounts.jobs-report.invalid','{"company_account":true}');
 INSERT INTO public.workers(id,auth_id,company_id,name,username,email,role,status) VALUES
 (w1,a1,c1,'Account test Alfa',prefix||'.alfa','shared@example.invalid','worker','active'),
 (w2,a2,c2,'Account test Betta',prefix||'.betta','shared@example.invalid','worker','active');
 INSERT INTO public.user_companies(auth_id,company_id,role) VALUES(a1,c1,'worker'),(a2,c2,'worker');
 IF public.get_email_by_username(upper(prefix||'.alfa')) IS DISTINCT FROM a1::text||'@accounts.jobs-report.invalid' THEN RAISE EXCEPTION 'Wrong auth mapping'; END IF;
 BEGIN
  INSERT INTO public.workers(name,username) VALUES('Duplicate',upper(prefix||'.alfa'));
  RAISE EXCEPTION 'Username collision accepted';
 EXCEPTION WHEN unique_violation THEN NULL; END;
 BEGIN
  PERFORM public.delete_company_account_resource(a1,NULL,w2);
  RAISE EXCEPTION 'Cross-company deletion accepted';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'ACCESS_FORBIDDEN' THEN RAISE; END IF; END;
 -- A requester without a company or role must never pass SQL's NULL checks.
 UPDATE public.workers SET company_id=NULL,role='admin' WHERE id=w1;
 BEGIN
  PERFORM public.delete_company_account_resource(a1,NULL,w2);
  RAISE EXCEPTION 'Unassigned admin deletion accepted';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'ACCESS_FORBIDDEN' THEN RAISE; END IF; END;
 UPDATE public.workers SET company_id=c1,role=NULL WHERE id=w1;
 BEGIN
  PERFORM public.delete_company_account_resource(a1,c2,NULL);
  RAISE EXCEPTION 'Null role deletion accepted';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'ACCESS_FORBIDDEN' THEN RAISE; END IF; END;
 UPDATE public.workers SET role='worker' WHERE id=w1;
 -- Shared legacy identities fail closed before deleting any tenant data.
 INSERT INTO public.user_companies(auth_id,company_id,role) VALUES(a1,c2,'worker');
 BEGIN
  PERFORM public.delete_company_account_resource(sa,NULL,w1);
  RAISE EXCEPTION 'Shared identity deletion accepted';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'ACCESS_SHARED_ACCOUNT' THEN RAISE; END IF; END;
 DELETE FROM public.user_companies WHERE auth_id=a1 AND company_id=c2;
 PERFORM public.delete_company_account_resource(sa,NULL,w1);
 IF NOT EXISTS(SELECT 1 FROM public.workers WHERE id=w1 AND auth_id IS NULL AND username IS NULL AND status='inactive' AND access_deleted_at IS NOT NULL) THEN RAISE EXCEPTION 'Worker history not preserved'; END IF;
 IF public.get_email_by_username(prefix||'.alfa') IS NOT NULL THEN RAISE EXCEPTION 'Deleted login still resolves'; END IF;
 IF public.get_email_by_username(prefix||'.betta') IS NULL THEN RAISE EXCEPTION 'Other company login lost'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.account_deletion_queue WHERE auth_id=a1) THEN RAISE EXCEPTION 'Missing durable cleanup'; END IF;
 INSERT INTO public.workers(name,username,company_id) VALUES('Username reused',prefix||'.alfa',c1);
 PERFORM public.delete_company_account_resource(sa,c1,NULL);
 IF EXISTS(SELECT 1 FROM public.companies WHERE id=c1) THEN RAISE EXCEPTION 'Company not removed'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.companies WHERE id=c2) THEN RAISE EXCEPTION 'Other company removed'; END IF;
 FOR i IN 1..3 LOOP
  IF NOT public.allow_account_recovery(repeat('a',64),repeat('b',64)) THEN RAISE EXCEPTION 'Recovery limiter too strict'; END IF;
 END LOOP;
 IF public.allow_account_recovery(repeat('a',64),repeat('b',64)) THEN RAISE EXCEPTION 'Recovery limiter failed'; END IF;
END;
$$;
SELECT 'PASS: independent email accounts, username uniqueness, role isolation, shared identity guard, account removal, company removal, historical identity, username reuse, recovery rate limits' AS result;
ROLLBACK;
