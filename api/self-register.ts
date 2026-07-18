import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const { 
    companyName, 
    adminName, 
    username, 
    password, 
    email, 
    phone, 
    address, 
    city, 
    country = 'Italia', 
    vatNumber 
  } = req.body;

  let companyId: string | null = null;
  let authIdCreatedByUs: string | null = null;
  let authId: string | null = null;

  try {
    // 1. Pre-check: unique name, vat, username
    const { data: existingComp } = await supabaseAdmin
      .from('companies')
      .select('id')
      .eq('name', companyName)
      .maybeSingle();
    
    let existingByVat = null;
    if (vatNumber) {
      const { data: vatCheck } = await supabaseAdmin
        .from('companies')
        .select('id')
        .eq('vat_number', vatNumber)
        .maybeSingle();
      existingByVat = vatCheck;
    }
    
    if (existingComp || existingByVat) return res.status(400).json({ error: 'Azienda o Partita IVA già registrata.' });

    const { data: existingUser } = await supabaseAdmin
      .from('workers')
      .select('id')
      .eq('username', username)
      .maybeSingle();

    if (existingUser) return res.status(400).json({ error: 'Username già in uso.' });

    // 2. Create Company
    const { data: companyData, error: companyError } = await supabaseAdmin
      .from('companies')
      .insert([{ 
        name: companyName, 
        status: 'active',
        email: email || null,
        phone: phone || null,
        address: address || null,
        city: city || null,
        country: country || null,
        vat_number: vatNumber || null
      }])
      .select();
      
    if (companyError) throw companyError;
    companyId = companyData[0].id;

    // 3. Create or Link Auth User
    const finalEmail = email || `${username.toLowerCase()}@jobsreport.it`;
    let authId: string;

    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) throw listError;
    
    const existingAuthUser = users.find(u => u.email?.toLowerCase() === finalEmail.toLowerCase());

    if (existingAuthUser) {
      authId = existingAuthUser.id;
      // Update password for the existing user to match the new one
      await supabaseAdmin.auth.admin.updateUserById(authId, { password });
    } else {
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: finalEmail,
        password,
        email_confirm: true,
        user_metadata: { name: adminName }
      });
      if (authError) throw authError;
      authId = authData.user.id;
      authIdCreatedByUs = authId;
    }

    // 4. Create Worker
    const { error: workerError } = await supabaseAdmin.from('workers').upsert({
      name: adminName,
      username,
      email: email || `${username.toLowerCase()}@jobsreport.it`,
      phone: phone || null,
      company_id: companyId,
      auth_id: authId,
      role: 'admin',
      status: 'active'
    }, { onConflict: 'auth_id' });

    if (workerError) throw workerError;

    // 5. Create Bridge
    await supabaseAdmin.from('user_companies').upsert({
      auth_id: authId,
      company_id: companyId,
      role: 'admin'
    }, { onConflict: 'auth_id,company_id' });

    // 6. Create Default Data
    const { data: clientData } = await supabaseAdmin
      .from('clients')
      .insert([{ company_id: companyId, name: `${companyName} - Interno`, status: 'active' }])
      .select();
    
    if (clientData?.[0]) {
      await supabaseAdmin.from('projects').insert({
        company_id: companyId,
        client_id: clientData[0].id,
        title: 'Rapportino interno',
        status: 'active',
        economic_type: 'hourly',
        is_internal: true
      });
    }

    // 7. Invia email di notifica
    try {
      const resendApiKey = process.env.RESEND_API_KEY || '';
      const adminEmailRecipient = process.env.ADMIN_EMAIL || 'jorgtw@gmail.com';
      if (resendApiKey) {
        // Invia notifica all'admin
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${resendApiKey}` },
          body: JSON.stringify({
            from: 'Jobs Report <onboarding@resend.dev>',
            to: [adminEmailRecipient],
            subject: `[JobsReport] Nuova azienda attivata: ${companyName}`,
            text: `È stata registrata e attivata una nuova azienda su JobsReport.\n\nAzienda: ${companyName}\nReferente: ${adminName}\nEmail: ${finalEmail}\nTelefono: ${phone || 'N/D'}\n\n--- Messaggio automatico`
          })
        });

        // Invia email di benvenuto all'utente
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${resendApiKey}` },
          body: JSON.stringify({
            from: 'Jobs Report <onboarding@resend.dev>',
            to: [finalEmail],
            subject: `Benvenuto su JobsReport - Credenziali per ${companyName}`,
            text: `Ciao ${adminName},\n\nLa tua azienda "${companyName}" è stata registrata con successo su JobsReport.\n\nEcco le tue credenziali di accesso:\nURL: https://jobs-report.app\nUsername: ${username}\nPassword: ${password}\n\nBuon lavoro!\nIl team di JobsReport`
          })
        });
      }
    } catch (e) {
      console.error('Errore invio email post-registrazione:', e);
    }

    return res.status(200).json({ success: true });

  } catch (err: any) {
    console.error('Self-Registration Error:', err);
    
    // Explicit Rollback
    try {
      if (companyId) {
        await supabaseAdmin.from('projects').delete().eq('company_id', companyId);
        await supabaseAdmin.from('clients').delete().eq('company_id', companyId);
        if (authId) {
          await supabaseAdmin.from('user_companies').delete().match({ auth_id: authId, company_id: companyId });
        }
        await supabaseAdmin.from('workers').delete().eq('company_id', companyId);
        await supabaseAdmin.from('companies').delete().eq('id', companyId);
      }
      if (authIdCreatedByUs) {
        await supabaseAdmin.auth.admin.deleteUser(authIdCreatedByUs);
      }
    } catch (rollbackErr: any) {
      console.error(`CRITICAL: Rollback failed for Company ${companyId} during self-register cleanup. Original Error: ${err.message}. Rollback Error:`, rollbackErr);
    }

    // 23505 Unique Violation translation
    if (err.code === '23505') {
      const errMsg = err.message || '';
      if (errMsg.includes('companies_vat_number_key') || errMsg.includes('vat_number')) {
        return res.status(400).json({ error: 'La Partita IVA risulta già registrata.' });
      } else if (errMsg.includes('workers_username_key') || errMsg.includes('username')) {
        return res.status(400).json({ error: 'Questo username è già in uso.' });
      } else {
        return res.status(400).json({ error: 'Un elemento fornito è già registrato nel sistema.' });
      }
    }

    return res.status(500).json({ error: err.message });
  }
}
