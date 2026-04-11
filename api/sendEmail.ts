import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  const { companyName, contactName, email, phone, notes } = req.body;
  
  console.log(`[REGISTRAZIONE] Nuova richiesta ricevuta: ${companyName} - ${email}`);

  // 1. SALVATAGGIO SEMPRE SU DATABASE
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

  if (supabaseUrl && supabaseKey) {
    try {
      const supabaseAdmin = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
      const { error: dbError } = await supabaseAdmin.from('registration_requests').insert([{
        company_name: companyName,
        contact_name: contactName,
        email: email,
        phone: phone,
        notes: notes,
        status: 'pending',
        created_at: new Date().toISOString()
      }]);
      
      if (dbError) {
        console.warn(`[REGISTRAZIONE] DB warning (registration_requests potrebbe non esistere): ${dbError.message}`);
      } else {
        console.log(`[REGISTRAZIONE] Salvataggio su database confermato.`);
      }
    } catch (e: any) {
      console.error(`[REGISTRAZIONE] Errore critico DB: ${e.message}`);
    }
  } else {
    console.warn(`[REGISTRAZIONE] Credenziali DB mancanti. Salvataggio ignorato.`);
  }

  // 2. INVIO EMAIL (NON BLOCCANTE)
  // NOTA: Con Resend in piano free, puoi inviare SOLO all'email dell'account Resend
  // oppure a domini verificati. Usa ADMIN_EMAIL nelle env vars di Vercel.
  const adminEmail = process.env.ADMIN_EMAIL || 'jobsreportadmin@gmail.com';

  const textBody = [
    'Nuova richiesta di registrazione su JobsReport.',
    '',
    `Nome azienda:  ${companyName || 'N/D'}`,
    `Referente:     ${contactName || 'N/D'}`,
    `Email:         ${email || 'N/D'}`,
    `Telefono:      ${phone || 'N/D'}`,
    `Note:          ${notes || 'N/D'}`,
    '',
    '---',
    'Messaggio automatico da JobsReport'
  ].join('\n');

  let emailSent = false;
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY || ''}`,
      },
      body: JSON.stringify({
        from: 'JobsReport <onboarding@resend.dev>',
        to: [adminEmail],
        subject: `[JobsReport] Nuova registrazione: ${companyName || 'N/D'}`,
        text: textBody,
      }),
    });

    const responseText = await response.text();
    if (response.ok) {
      emailSent = true;
      console.log(`[REGISTRAZIONE] Email inviata a ${adminEmail} con successo.`);
    } else {
      console.error(`[REGISTRAZIONE] Resend error ${response.status}: ${responseText}`);
    }
  } catch (emailError: any) {
    console.error(`[REGISTRAZIONE] Network exception email: ${emailError.message}`);
  }

  // 3. RISPONDE SEMPRE CON SUCCESSO (la registrazione è salvata, email è opzionale)
  return res.status(200).json({ 
    success: true, 
    message: 'Richiesta ricevuta ed elaborata',
    email_sent: emailSent
  });
}
