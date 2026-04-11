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
        console.warn(`[REGISTRAZIONE] Impossibile salvare su tabella registration_requests (potrebbe non esistere): ${dbError.message}`);
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
  const textBody = `Salve,\n\nVorrei registrare la mia azienda su JobsReport.\n\nNome azienda: ${companyName || '...'}\nReferente: ${contactName || '...'}\nEmail: ${email || '...'}\nTelefono: ${phone || '...'}\nNote: ${notes || '...'}\n\nGrazie`;
  
  let emailSent = false;
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY || 'PLACEHOLDER'}`,
      },
      body: JSON.stringify({
        from: 'JobsReport <onboarding@resend.dev>',
        to: ['jtw@live.it'], 
        subject: '[JobsReport] Richiesta nuova registrazione',
        text: textBody,
      }),
    });

    const responseText = await response.text();
    if (response.ok) {
      emailSent = true;
      console.log(`[REGISTRAZIONE] Email di notifica inviata correttamente.`);
    } else {
      console.error(`[REGISTRAZIONE] Errore invio Email (Resend): ${response.status} - ${responseText}`);
    }
  } catch (emailError: any) {
    console.error(`[REGISTRAZIONE] Network Exception durante email: ${emailError.message}`);
  }

  // 3. RITORNA SEMPRE SUCCESSO 
  return res.status(200).json({ 
    success: true, 
    message: 'Richiesta ricevuta ed elaborata',
    email_status: emailSent ? 'sent' : 'failed'
  });
}
