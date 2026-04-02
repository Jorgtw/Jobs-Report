import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

/**
 * Utility to load environment variables from .env and .env.production
 */
function getEnv() {
  const env = {};
  [path.resolve(process.cwd(), '.env'), path.resolve(process.cwd(), '.env.production')].forEach(p => {
    if (fs.existsSync(p)) {
      const content = fs.readFileSync(p, 'utf-8');
      content.split('\n').forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
          let value = match[2] || '';
          if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
          env[match[1]] = value.trim();
        }
      });
    }
  });
  return env;
}

const env = getEnv();
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SERVICE_KEY. Cleanup aborted.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
const BUCKET_NAME = 'compliance-reports';
const EXPIRATION_DAYS = 14;

async function cleanupOldReports() {
  console.log(`--- Starting Cleanup for bucket: ${BUCKET_NAME} ---`);
  console.log(`Files older than ${EXPIRATION_DAYS} days will be deleted.\n`);

  try {
    // 1. Get all companies (top-level folders)
    const { data: companies, error: listErr } = await supabase.storage.from(BUCKET_NAME).list('', {
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' }
    });

    if (listErr) throw listErr;
    if (!companies || companies.length === 0) {
      console.log("No folders found in bucket.");
      return;
    }

    const now = new Date();
    let totalDeleted = 0;

    for (const company of companies) {
      if (!company.id && company.name === '.emptyFolderPlaceholder') continue; 
      
      const companyPath = `${company.name}/reports`;
      console.log(`Checking folder: ${companyPath}`);

      const { data: files, error: fileErr } = await supabase.storage.from(BUCKET_NAME).list(companyPath, {
          limit: 1000
      });

      if (fileErr) {
          console.warn(`Could not list files in ${companyPath}:`, fileErr.message);
          continue;
      }

      const filesToDelete = [];

      for (const file of files) {
          if (file.name === '.emptyFolderPlaceholder') continue;

          const createdAt = new Date(file.created_at);
          const diffTime = Math.abs(now - createdAt);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays > EXPIRATION_DAYS) {
              console.log(`  [DELETE] ${file.name} (Age: ${diffDays} days)`);
              filesToDelete.push(`${companyPath}/${file.name}`);
          }
      }

      if (filesToDelete.length > 0) {
          const { error: delErr } = await supabase.storage.from(BUCKET_NAME).remove(filesToDelete);
          if (delErr) {
              console.error(`  Error deleting files in ${companyPath}:`, delErr.message);
          } else {
              console.log(`  Successfully deleted ${filesToDelete.length} files.`);
              totalDeleted += filesToDelete.length;
          }
      } else {
          console.log(`  No old files found.`);
      }
    }

    console.log(`\n--- Cleanup Finished. Total files deleted: ${totalDeleted} ---`);

  } catch (err) {
    console.error("Critical error during cleanup:", err.message);
    process.exit(1);
  }
}

cleanupOldReports();
