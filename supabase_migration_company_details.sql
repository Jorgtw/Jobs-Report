-- ============================================================
-- MIGRATION: Add company detail fields to companies table
-- Run in Supabase SQL Editor
-- ============================================================

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS address    TEXT,
  ADD COLUMN IF NOT EXISTS phone      TEXT,
  ADD COLUMN IF NOT EXISTS email      TEXT,
  ADD COLUMN IF NOT EXISTS vat_number TEXT,
  ADD COLUMN IF NOT EXISTS city       TEXT,
  ADD COLUMN IF NOT EXISTS country    TEXT;

-- Verify
SELECT id, name, address, phone, email, vat_number, city, country, is_premium FROM companies ORDER BY name;
