-- Apply before deploying the frontend. Existing table privileges and RLS remain in force.
BEGIN;
CREATE OR REPLACE FUNCTION public.save_report_atomic(
  p_report_id uuid, p_company_id uuid, p_report jsonb,
  p_expenses jsonb DEFAULT NULL, p_workers jsonb DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
DECLARE
  v_id uuid := p_report_id;
  v_payload jsonb;
  v_result jsonb;
  v_item jsonb;
  v_columns text;
  v_values text;
  v_set text;
  v_table text;
  v_allowed text[];
  v_children jsonb;
  v_count integer;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501'; END IF;
  IF p_company_id IS NULL OR jsonb_typeof(p_report) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'Invalid report payload';
  END IF;
  IF p_expenses IS NOT NULL AND jsonb_typeof(p_expenses) IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Invalid expenses'; END IF;
  IF p_workers IS NOT NULL AND jsonb_typeof(p_workers) IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Invalid workers'; END IF;
  -- Row lock serializes replacement of children for concurrent saves of this report.
  IF v_id IS NOT NULL THEN
    PERFORM 1 FROM public.reports WHERE id=v_id AND company_id=p_company_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Report unavailable' USING ERRCODE='42501'; END IF;
  END IF;
  IF p_report->>'project_id' IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.projects WHERE id=(p_report->>'project_id')::uuid AND company_id=p_company_id
  ) THEN RAISE EXCEPTION 'Project unavailable' USING ERRCODE='42501'; END IF;
  IF p_report->>'created_by' IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.workers WHERE id=(p_report->>'created_by')::uuid AND company_id=p_company_id
  ) THEN RAISE EXCEPTION 'Worker unavailable' USING ERRCODE='42501'; END IF;
  v_allowed := ARRAY['schedule_id','schedule_date','project_id','created_by','date','start_time','end_time','break_hours','total_hours','completed_quantity','manual_total_hours','description','Notes','travel_notes','activity_type','ordinary_hours','overtime_hours','festive_hours','night_hours','invoice_status','company_id','created_at'];
  SELECT jsonb_object_agg(key,value) INTO v_payload FROM jsonb_each(p_report) WHERE key=ANY(v_allowed);
  v_payload := coalesce(v_payload,'{}') || jsonb_build_object('company_id',p_company_id);
  SELECT string_agg(format('%I',key),',') , string_agg(format('r.%I',key),','),
         string_agg(format('%I=r.%I',key,key),',')
    INTO v_columns,v_values,v_set FROM jsonb_object_keys(v_payload) AS k(key);
  IF v_id IS NULL THEN
    EXECUTE format('INSERT INTO public.reports (%s) SELECT %s FROM jsonb_populate_record(NULL::public.reports,$1) r RETURNING id',v_columns,v_values)
      INTO v_id USING v_payload;
  ELSE
    EXECUTE format('UPDATE public.reports t SET %s FROM jsonb_populate_record(NULL::public.reports,$1) r WHERE t.id=$2 AND t.company_id=$3',v_set)
      USING v_payload,v_id,p_company_id;
    GET DIAGNOSTICS v_count=ROW_COUNT;
    IF v_count<>1 THEN RAISE EXCEPTION 'Report not writable' USING ERRCODE='42501'; END IF;
  END IF;
  FOREACH v_table IN ARRAY ARRAY['rapportini_expenses','rapportini_workers'] LOOP
    v_children := CASE WHEN v_table='rapportini_expenses' THEN p_expenses ELSE p_workers END;
    IF v_children IS NULL THEN CONTINUE; END IF;
    v_allowed := CASE WHEN v_table='rapportini_expenses' THEN ARRAY['company_id','rapportino_id','worker_id','created_by','type','description','amount','km','category','vat_rate','is_billable','billable_amount'] ELSE ARRAY['rapportino_id','worker_id','startTime','endTime','breakHours','hours','completed_quantity','manual_total_hours','ordinary_hours','overtime_hours','festive_hours','night_hours','hourly_rate','total_cost','person_name','person_role','membership_type','subcontractor_id','is_manual_override'] END;
    EXECUTE format('DELETE FROM public.%I WHERE rapportino_id=$1',v_table) USING v_id;
    FOR v_item IN SELECT value FROM jsonb_array_elements(v_children) LOOP
      IF jsonb_typeof(v_item) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'Invalid child row'; END IF;
      IF v_item->>'worker_id' IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM public.workers WHERE id=(v_item->>'worker_id')::uuid AND company_id=p_company_id
      ) THEN RAISE EXCEPTION 'Worker unavailable' USING ERRCODE='42501'; END IF;
      IF v_item->>'subcontractor_id' IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM public.subcontractors WHERE id=(v_item->>'subcontractor_id')::uuid AND company_id=p_company_id
      ) THEN RAISE EXCEPTION 'Subcontractor unavailable' USING ERRCODE='42501'; END IF;
      SELECT jsonb_object_agg(key,value) INTO v_payload FROM jsonb_each(v_item) WHERE key=ANY(v_allowed);
      v_payload := coalesce(v_payload,'{}') || jsonb_build_object('rapportino_id',v_id);
      IF v_table='rapportini_expenses' THEN v_payload:=v_payload||jsonb_build_object('company_id',p_company_id); END IF;
      SELECT string_agg(format('%I',key),','),string_agg(format('r.%I',key),',')
        INTO v_columns,v_values FROM jsonb_object_keys(v_payload) AS k(key);
      EXECUTE format('INSERT INTO public.%I (%s) SELECT %s FROM jsonb_populate_record(NULL::public.%I,$1) r',v_table,v_columns,v_values,v_table) USING v_payload;
    END LOOP;
  END LOOP;
  SELECT to_jsonb(r) || jsonb_build_object(
    'expenses',coalesce((SELECT jsonb_agg(e) FROM public.rapportini_expenses e WHERE e.rapportino_id=v_id),'[]'::jsonb),
    'additionalWorkers',coalesce((SELECT jsonb_agg(w) FROM public.rapportini_workers w WHERE w.rapportino_id=v_id),'[]'::jsonb)
  ) INTO v_result FROM public.reports r WHERE r.id=v_id;
  RETURN v_result;
END;
$$;
REVOKE ALL ON FUNCTION public.save_report_atomic(uuid,uuid,jsonb,jsonb,jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_report_atomic(uuid,uuid,jsonb,jsonb,jsonb) TO authenticated;
COMMIT;
