-- JOB REPORT V2 COMMUNICATIONS MIGRATION
-- Senior Staff Engineer / Database Architect

-- 1. Schema Evolution
ALTER TABLE internal_communications 
ADD COLUMN IF NOT EXISTS parent_forward_id UUID REFERENCES internal_communications(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS sender_name_snap TEXT,
ADD COLUMN IF NOT EXISTS target_name_snap TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 2. Performance Indexing
CREATE INDEX IF NOT EXISTS idx_comms_target_id_type ON internal_communications (target_id, target_type);
CREATE INDEX IF NOT EXISTS idx_comms_company_status ON internal_communications (company_id, status);
CREATE INDEX IF NOT EXISTS idx_comms_created_at_desc ON internal_communications (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_receipts_user_comm ON communication_read_receipts (user_id, communication_id);

-- 3. Server-Side Filtering Function (RPC)
CREATE OR REPLACE FUNCTION get_filtered_communications(
  p_user_id UUID, 
  p_company_id UUID, 
  p_section TEXT
)
RETURNS SETOF internal_communications AS $$
BEGIN
  RETURN QUERY
  SELECT ic.* FROM internal_communications ic
  WHERE ic.company_id = p_company_id
    AND CASE 
      WHEN p_section = 'inbox' THEN 
        ic.status = 'open' AND ic.sender_id != p_user_id AND (ic.target_id = p_user_id OR ic.target_type = 'all')
      WHEN p_section = 'working' THEN 
        (ic.status IN ('acknowledged', 'in_progress')) OR (ic.status = 'open' AND ic.sender_id = p_user_id)
      WHEN p_section = 'completed' THEN 
        ic.status IN ('closed', 'archived')
      ELSE FALSE
    END
  ORDER BY ic.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
