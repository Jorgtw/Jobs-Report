# Atomic report saves and summary exports

Report creation and editing use `save_report_atomic` so report fields, expenses and additional workers commit together. A child-row error rolls back the entire save. The function runs as SECURITY INVOKER and retains existing table privileges and RLS. The client deliberately does not fall back to separate writes if the function is unavailable.

## Deployment order

1. Apply `scripts/migrations/20261108_save_report_atomic.sql` to a staging database with the actual schema, policies and triggers.
2. Verify admin and operator saves, tenant isolation and child-row failure rollback.
3. Apply the migration to the destination database **before deploying the frontend**. Until installed, this frontend rejects report saves.
4. Deploy the frontend and repeat the operational smoke test in a test company.

The migration adds a function only. It does not change table definitions or table permissions. Existing deployed frontend remains compatible after the migration is installed.

## Validation

- `node node_modules/typescript/bin/tsc --noEmit`
- `node node_modules/vite/bin/vite.js build`
- `node scripts/test-report-cache.mjs`
- `node scripts/test-summary-export.mjs`
- `node scripts/test-workflow-isolated.mjs`
- `node node_modules/tsx/dist/cli.mjs scripts/test-worker-compensation.ts`
- `node scripts/test-report-atomic-db.mjs` (requires PGlite; install with `npm install --prefix scratch/db-test @electric-sql/pglite --ignore-scripts --no-audit --no-fund`, or set PGLITE_MODULE to its dist/index.js).

PostgreSQL tests use a representative local schema and cannot certify production policies or schema compatibility. Workflow fixtures use simulated transport, never production credentials. They are not included in production entry points.

The summary PDF now converts the actual summary fields (`overtimeHours`, `festiveHours`, `nightHours`) into the export model; ordinary hours are the total minus these categories. Regression coverage includes mixed hour categories and zero values. A UI-generated PDF with three reports was re-read to verify 20 ordinary hours, 20 total hours and 57.40 expenses.
