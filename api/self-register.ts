import { newAuthEmail, usernamePattern, normalizeUsername, validUsername } from './_lib/account-identity.js';
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

  const body = req.body || {};
  const text = (value: unknown) => typeof value === 'string' ? value.trim() : '';
  const companyName = text(body.companyName);
  const email = text(body.email).toLowerCase();
  const password = typeof body.password === 'string' ? body.password : '';
  const username = normalizeUsername(body.username);
  if (!validUsername(username)) return res.status(400).json({ error: 'REGISTRATION_USERNAME_INVALID' });
  const adminName = text(body.adminName) || companyName;
  const phone = text(body.phone);
  const address = text(body.address);
  const city = text(body.city);
  const country = text(body.country);
  const vatNumber = text(body.vatNumber);
  if (!companyName || companyName.length > 160 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return res.status(400).json({ error: 'REGISTRATION_INVALID' });
  }
  if (password.length < 6 || password.length > 128 || !password.trim()) {
    return res.status(400).json({ error: 'REGISTRATION_PASSWORD' });
  }
  if (body.acceptedTerms !== true) {
    return res.status(400).json({ error: 'REGISTRATION_TERMS_REQUIRED' });
  }

  let companyId: string | null = null;
  let authIdCreatedByUs: string | null = null;
  let authId: string | null = null;

  try {
    // 1. Pre-check: unique name, vat, username
    const { data: existingComp, error: companyCheckError } = await supabaseAdmin
      .from('companies')
      .select('id')
      .eq('name', companyName)
      .maybeSingle();
    
    if (companyCheckError) throw companyCheckError;
    let existingByVat = null;
    if (vatNumber) {
      const { data: vatCheck, error: vatCheckError } = await supabaseAdmin
        .from('companies')
        .select('id')
        .eq('vat_number', vatNumber)
        .maybeSingle();
      if (vatCheckError) throw vatCheckError;
      existingByVat = vatCheck;
    }
    
    if (existingComp || existingByVat) return res.status(400).json({ error: 'REGISTRATION_EXISTS' });

    const { data: existingUser, error: userCheckError } = await supabaseAdmin
      .from('workers')
      .select('id')
      .ilike('username', usernamePattern(username))
      .maybeSingle();

    if (userCheckError) throw userCheckError;
    if (existingUser) return res.status(409).json({ error: 'REGISTRATION_EXISTS' });

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

    // Only create a new identity. Never relink or change an existing account.
    const finalEmail = email;
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: newAuthEmail(),
      password,
      email_confirm: true,
      app_metadata: { company_account: true },
      user_metadata: { name: adminName, registration_language: text(body.language) || 'it' }
    });
    if (authError) throw authError;
    authId = authData.user.id;
    authIdCreatedByUs = authId;

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
    const { error: bridgeError } = await supabaseAdmin.from('user_companies').upsert({
      auth_id: authId,
      company_id: companyId,
      role: 'admin'
    }, { onConflict: 'auth_id,company_id' });
    if (bridgeError) throw bridgeError;

    // 6. Create Default Data
    const { data: clientData, error: clientError } = await supabaseAdmin
      .from('clients')
      .insert([{ company_id: companyId, name: `${companyName} - Interno`, status: 'active' }])
      .select();
    
    if (clientError) throw clientError;
    if (clientData?.[0]) {
      const { error: projectError } = await supabaseAdmin.from('projects').insert({
        company_id: companyId,
        client_id: clientData[0].id,
        title: 'Rapportino interno',
        site_address: address,
        created_at: new Date().toISOString(),
        status: 'active',
        economic_type: 'hourly',
        is_internal: true
      });
      if (projectError) throw projectError;
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
            subject: `Benvenuto su JobsReport - ${companyName}`,
            text: `Ciao ${adminName},\n\nLa tua azienda "${companyName}" è stata registrata con successo su JobsReport.\n\nAccedi con il nome utente e la password scelta durante la registrazione:\nURL: https://app.jobs-report.app\nNome utente: ${username}\n\nBuon lavoro!\nIl team di JobsReport`
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

    if (err.code === '23505' || err.code === 'email_exists' || err.code === 'user_already_exists') {
      return res.status(409).json({ error: 'REGISTRATION_EXISTS' });
    }
    return res.status(500).json({ error: 'REGISTRATION_FAILED' });
  }
}
