-- Minimal isolated PostgreSQL fixture based on inspected production foreign keys.
CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
CREATE SCHEMA auth;
CREATE TABLE auth.users(id uuid PRIMARY KEY,email text UNIQUE,raw_app_meta_data jsonb DEFAULT '{}',raw_user_meta_data jsonb DEFAULT '{}');
CREATE TABLE public.companies(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),name text,status text);
CREATE TABLE public.workers(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),auth_id uuid UNIQUE REFERENCES auth.users ON DELETE SET NULL,
 company_id uuid REFERENCES public.companies,name text,username text UNIQUE,email text,role text,status text);
CREATE TABLE public.user_roles(user_id uuid REFERENCES public.workers ON DELETE CASCADE,role text);
CREATE TABLE public.user_companies(auth_id uuid REFERENCES auth.users ON DELETE CASCADE,company_id uuid REFERENCES public.companies ON DELETE CASCADE,role text,UNIQUE(auth_id,company_id));
CREATE TABLE public.projects(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),company_id uuid REFERENCES public.companies);
CREATE TABLE public.reports(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),company_id uuid REFERENCES public.companies ON DELETE CASCADE,created_by uuid REFERENCES public.workers,project_id uuid REFERENCES public.projects);
CREATE TABLE public.rapportini_workers(rapportino_id uuid REFERENCES public.reports,worker_id uuid REFERENCES public.workers,company_id uuid REFERENCES public.companies ON DELETE CASCADE);
CREATE TABLE public.rapportini_expenses(rapportino_id uuid REFERENCES public.reports ON DELETE CASCADE,worker_id uuid REFERENCES public.workers ON DELETE SET NULL,company_id uuid REFERENCES public.companies ON DELETE CASCADE);
CREATE TABLE public.internal_communications(id uuid PRIMARY KEY,company_id uuid REFERENCES public.companies ON DELETE CASCADE,sender_id uuid REFERENCES public.workers ON DELETE CASCADE);
CREATE TABLE public.project_subcontractors(project_id uuid REFERENCES public.projects);
CREATE TABLE public.user_push_subscriptions(worker_id uuid REFERENCES public.workers ON DELETE CASCADE,company_id uuid REFERENCES public.companies ON DELETE CASCADE);
INSERT INTO auth.users(id,email) VALUES('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','superadmin@example.invalid');
INSERT INTO public.workers(auth_id,name,username,role,status) VALUES('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Local test administrator','local.test.admin','superadmin','active');
