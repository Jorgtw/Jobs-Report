const fs = require('fs');
const file = 'src/services/dbService.ts';
let content = fs.readFileSync(file, 'utf8');

// We want to remove setup_step, setup_error, setup_failed_at from inserts and updates
// because they are missing from the production DB.

// 1. Remove from registerCompany insert
content = content.replace(/status: 'pending',\s+setup_step: 0,\s+setup_error: null,\s+setup_failed_at: null,/, "status: 'pending',");

// 2. Remove all .update({ setup_step: ... }) or variations
content = content.replace(/\.update\(\{\s*setup_step: \d+\s*\}\)/g, ".update({})"); // Dummy update to avoid chain break, or just remove it

// Actually, it's better to remove the whole line if it's an await call
content = content.replace(/await supabase\.from\('companies'\)\.update\(\{\s*setup_step: \d+\s*\}\)\.eq\('id', (newCompanyId|companyId)\);/g, "// setup_step update skipped");

// 3. Remove from the final update in registerCompany and resumeCompanySetup
content = content.replace(/setup_step: 4,\s+setup_error: null,\s+setup_failed_at: null/g, "status: 'active'");

// 4. Remove setup_error update in catch blocks
content = content.replace(/await supabase\.from\('companies'\)\.update\(\{\s*setup_error: [\s\S]*?status: 'pending'\s*\}\)\.eq\('id', (newCompanyId|companyId)\);/g, "/* setup_error update skipped */");

// 5. Fix mapSupabaseCompany to be safe
content = content.replace(/setupStep: c\.setup_step,/, "setupStep: c.setup_step || 0,");
content = content.replace(/setupError: c\.setup_error,/, "setupError: c.setup_error || null,");
content = content.replace(/setupFailedAt: c\.setup_failed_at/, "setupFailedAt: c.setup_failed_at || null");

fs.writeFileSync(file, content);
console.log('Made dbService.ts safe for missing schema columns');
