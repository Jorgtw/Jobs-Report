import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

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
const sb = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const results = {};

  // 1. Aziende attive
  const { data: companies } = await sb.from('companies').select('id, name').eq('status', 'active');
  const validCompanies = companies.filter(c => !c.name.toLowerCase().includes('test') && !c.name.toLowerCase().includes('demo'));
  results.activeCompaniesCount = validCompanies.length;
  results.activeCompanies = validCompanies.map(c => c.name);

  // 2. Dimensione media team
  const { data: workers } = await sb.from('workers').select('id, company_id');
  const workersInRealCompanies = workers.filter(w => validCompanies.some(c => c.id === w.company_id));
  results.totalWorkers = workersInRealCompanies.length;
  results.avgTeamSize = results.activeCompaniesCount > 0 ? (results.totalWorkers / results.activeCompaniesCount).toFixed(1) : 0;

  // 3. Volume comunicazioni
  const { data: comms } = await sb.from('internal_communications').select('status, type');
  const validComms = comms.filter(c => c.status !== 'deleted');
  results.commsByStatus = validComms.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {});
  results.totalComms = validComms.length;

  // 4. Tipologie usate
  results.commsByType = validComms.reduce((acc, c) => {
    acc[c.type || 'note'] = (acc[c.type || 'note'] || 0) + 1;
    return acc;
  }, {});

  // 5. Moduli attivi (Record counts)
  const { count: projectsCount } = await sb.from('projects').select('*', { count: 'exact', head: true });
  const { count: clientsCount } = await sb.from('clients').select('*', { count: 'exact', head: true });
  // The table for 'rapportini' is usually called 'reports' or 'working_days'?
  // Let's check most likely names
  const { count: reportsCount } = await sb.from('reports').select('*', { count: 'exact', head: true });
  const { count: subCount } = await sb.from('subcontractors').select('*', { count: 'exact', head: true });

  results.moduleUsage = {
    projects: projectsCount,
    clients: clientsCount,
    reports: reportsCount,
    subcontractors: subCount
  };

  // 6. Settore clienti (Inference from names)
  const { data: clientNames } = await sb.from('clients').select('name').limit(50);
  results.clientSample = clientNames.map(c => c.name);

  console.log(JSON.stringify(results, null, 2));
}

run();
