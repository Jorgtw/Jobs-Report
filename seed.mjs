import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gqetgbqlxljhhcaggoke.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_-VutZPQsHpnFTEEjizkGSw_vRAmuVvd';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function seed() {
    console.log('Iniziando il seeding dei dati...');

    // 1. Inserisci Clienti
    const { data: clients, error: clientsErr } = await supabase.from('clients').insert([
        { name: 'Acme Corp', vatNumber: 'IT12345678901', billingAddress: 'Via Roma 1, Milano', mainContactName: 'Mario Rossi', mainContactPhone: '3331122334', email: 'info@acme.it', status: 'active', createdAt: Date.now() },
        { name: 'Tech Solutions SpA', vatNumber: 'IT09876543210', billingAddress: 'Viale Europa 22, Roma', mainContactName: 'Luigi Verdi', mainContactPhone: '3339988776', email: 'contatti@techsol.it', status: 'active', createdAt: Date.now() }
    ]).select();

    if (clientsErr) {
        console.error('Errore inserimento clienti:', clientsErr);
        return;
    }
    console.log('Clienti inseriti:', clients.length);

    // 2. Inserisci Progetti
    const { data: projects, error: projectsErr } = await supabase.from('projects').insert([
        { clientId: clients[0].id, name: 'Rifacimento Rete Elettrica', description: 'Aggiornamento completo dell\'impianto elettrico', address: 'Via Roma 1, Milano', status: 'active', financialAgreement: 'fixed', sellingPrice: 5000, createdAt: Date.now() },
        { clientId: clients[1].id, name: 'Manutenzione Server', description: 'Pulizia e aggiornamento server', address: 'Viale Europa 22, Roma', status: 'active', financialAgreement: 'hourly', sellingPrice: 65, createdAt: Date.now() }
    ]).select();

    if (projectsErr) {
        console.error('Errore inserimento progetti:', projectsErr);
        return;
    }
    console.log('Progetti inseriti:', projects.length);

    // 3. Inserisci Dipendenti (Workers)
    // Nota: l'utente 'admin'/'admin' dovrebbe essere già presente. Aggiungiamo un paio di dipendenti.
    const { data: workers, error: workersErr } = await supabase.from('workers').insert([
        { name: 'Paolo Bianchi', username: 'paolo', password_hash: 'paolo123', email: 'paolo@azienda.it', role: 'operator', status: 'active', hourlyRate: 20, extraCost: 5, phone: '3334455667', createdAt: Date.now() },
        { name: 'Giulia Neri', username: 'giulia', password_hash: 'giulia123', email: 'giulia@azienda.it', role: 'supervisor', status: 'active', hourlyRate: 25, extraCost: 0, phone: '3337788990', createdAt: Date.now() }
    ]).select();

    if (workersErr) {
        console.error('Errore inserimento dipendenti:', workersErr);
        return;
    }
    console.log('Dipendenti inseriti:', workers.length);

    // 4. Inserisci Rapportino
    const { data: reports, error: reportsErr } = await supabase.from('reports').insert([
        {
            projectId: projects[0].id,
            userId: workers[0].id,
            date: new Date().toISOString().split('T')[0],
            startTime: '08:00',
            endTime: '17:00',
            breakHours: 1,
            totalHours: 8,
            description: 'Lavoro di tracciatura cavi ed installazione quadri.',
            createdAt: Date.now()
        }
    ]).select();

    if (reportsErr) {
        console.error('Errore inserimento rapportino:', reportsErr);
        return;
    }
    console.log('Rapportini inseriti:', reports.length);

    console.log('Seeding completato con successo!');
}

seed();
