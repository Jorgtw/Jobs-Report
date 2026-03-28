-- ============================================================
-- MIGRATION: Add is_premium column to companies table
-- Run this script in Supabase SQL Editor:
-- https://supabase.com/dashboard → SQL Editor → New query
-- ============================================================

-- 1. Add the column (safe: does nothing if it already exists)
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS is_premium BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Verify: show current state of all companies
SELECT id, name, status, is_premium
FROM companies
ORDER BY name;

-- ============================================================
-- HOW TO ACTIVATE PREMIUM FOR A COMPANY:
-- UPDATE companies SET is_premium = TRUE WHERE name = 'Nome Ditta';
-- ============================================================
