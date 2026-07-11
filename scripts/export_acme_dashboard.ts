import ExcelJS from 'exceljs';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { DashboardCommesse } from '../src/services/export/templates/DashboardCommesse';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://gqetgbqlxljhhcaggoke.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
    const { data: companies } = await supabase.from('companies').select('*').ilike('name', '%Acme%').limit(1);
    const company = companies[0];

    const { data: reports } = await supabase.from('reports').select(`
        *,
        additionalWorkers:rapportini_workers(*),
        project:projects(*),
        expensesList:rapportini_expenses(*)
    `).eq('company_id', company.id);

    const { data: clients } = await supabase.from('clients').select('*').eq('company_id', company.id);
    const { data: workers } = await supabase.from('workers').select('*').eq('company_id', company.id);
    const { data: subs } = await supabase.from('subcontractors').select('*').eq('company_id', company.id);

    // Map subcontractors from rapportini_workers into externalCosts
    const externalCosts = [];
    
    const summaries = reports.map(r => {
        let totalExpenses = (r.expensesList || []).reduce((acc, curr) => acc + (curr.amount || 0), 0);
        let subCost = 0;
        let pCost = 0;

        // Process main worker
        const mainW = workers.find(w => w.id === r.created_by);
        const mainWCost = (mainW?.hourly_rate || 15) * (r.total_hours || 0);
        
        if (mainW?.subcontractor_id) {
            const s = subs.find(sub => sub.id === mainW.subcontractor_id);
            externalCosts.push({
                id: r.id + '_main',
                date: r.date,
                supplierName: s?.company_name || mainW.name || 'Subappaltatore',
                clientId: r.project?.client_id,
                projectId: r.project_id,
                description: `Lavoro Esterno (Principale) - ${r.total_hours}h`,
                amount: mainWCost
            });
            subCost += mainWCost;
        } else {
            pCost += mainWCost;
        }

        // Process additional workers
        (r.additionalWorkers || []).forEach(aw => {
            if (aw.subcontractor_id || aw.membership_type === 'Esterno' || aw.person_role === 'Subappalto') {
                const s = subs.find(sub => sub.id === aw.subcontractor_id);
                const awCost = aw.total_cost || (aw.hours * (aw.hourly_rate || 35));
                externalCosts.push({
                    id: aw.id,
                    date: r.date,
                    supplierName: s?.company_name || aw.person_name || 'Subappaltatore',
                    clientId: r.project?.client_id,
                    projectId: r.project_id,
                    description: aw.hours > 0 ? `Lavoro Esterno - ${aw.hours}h` : 'Subappalto Fisso',
                    amount: awCost
                });
                subCost += awCost;
            } else {
                const w = workers.find(wk => wk.id === aw.worker_id);
                pCost += (w?.hourly_rate || 15) * (aw.hours || 0);
            }
        });

        return {
            id: r.id,
            userId: r.created_by,
            userName: mainW?.name,
            projectId: r.project_id,
            projectName: r.project?.title || 'Progetto Sconosciuto',
            clientId: r.project?.client_id,
            clientName: clients.find(c => c.id === r.project?.client_id)?.name,
            date: r.date,
            totalHours: r.total_hours,
            personnelCost: pCost,
            subcontractorCost: subCost,
            totalExpenses: totalExpenses,
            revenue: (r.project?.hourly_rate || 50) * r.total_hours,
            cost: pCost + subCost + totalExpenses,
            description: r.description
        };
    });

    const reportData = {
        companyName: company.name,
        projects: reports.map(r => r.project).filter(Boolean).map(p => ({ 
            ...p, 
            name: p.title,
            clientId: p.client_id,
            financialAgreement: p.economic_type || 'fixed',
            sellingPrice: p.economic_type === 'hourly' ? (p.hourly_rate || p.hourly_sale_price || 0) : (p.total_amount || 0)
        })),
        clients: clients,
        workers: workers,
        summaries: summaries,
        externalCosts: externalCosts
    };

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Jobs-Report System';
    
    const dashboard = new DashboardCommesse();
    await dashboard.render(workbook, reportData);

    const outPath = path.join(process.cwd(), 'public', 'Acme_Dashboard_Commesse_V2.xlsx');
    await workbook.xlsx.writeFile(outPath);
    console.log(`Esportato con successo in ${outPath}`);
}
run();
