import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  const { type = 'registration', companyName, contactName, adminName, email, phone, notes, username, password } = req.body;
  
  const adminEmailRecipient = process.env.ADMIN_EMAIL || 'jobsreportadmin@gmail.com';
  const resendApiKey = process.env.RESEND_API_KEY || '';

  let subject = '';
  let textBody = '';
  let to = [adminEmailRecipient];

  if (type === 'registration') {
    console.log(`[REGISTRAZIONE] Nuova richiesta ricevuta: ${companyName} - ${email}`);
    
    // Save to DB
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (supabaseUrl && supabaseKey) {
      try {
        const supabaseAdmin = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
        await supabaseAdmin.from('registration_requests').insert([{
          company_name: companyName,
          contact_name: contactName,
          email: email,
          phone: phone,
          notes: notes,
          status: 'pending',
          created_at: new Date().toISOString()
        }]);
      } catch (e: any) {
        console.error(`[REGISTRAZIONE] Errore DB: ${e.message}`);
      }
    }

    subject = `[JobsReport] Nuova registrazione: ${companyName || 'N/D'}`;
    textBody = [
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
  } else if (type === 'welcome') {
    console.log(`[WELCOME] Invio credenziali a: ${email}`);
    
    subject = `Benvenuto su JobsReport - Credenziali per ${companyName}`;
    to = [email]; // Send to the new admin
    
    textBody = [
      `Ciao ${adminName || 'Amministratore'},`,
      '',
      `Benvenuto su JobsReport! La tua azienda "${companyName}" è stata registrata con successo.`,
      '',
      'Ecco le tue credenziali di accesso:',
      `URL:        https://jobs-report.vercel.app`,
      `Username:   ${username}`,
      `Password:   ${password}`,
      '',
      'Ti consigliamo di cambiare la password al primo accesso.',
      '',
      'Buon lavoro,',
      'Il team di JobsReport',
      '',
      '---',
      'Messaggio automatico da JobsReport'
    ].join('\n');
  } else if (type === 'contact') {
    console.log(`[CONTATTO] Nuovo messaggio da: ${contactName || companyName || email}`);
    
    subject = `[JobsReport - Contatto] Messaggio da ${contactName || 'Sconosciuto'}`;
    to = [adminEmailRecipient];
    
    textBody = [
      'Nuovo messaggio dal modulo "Contattaci" del sito.',
      '',
      `Nome e Cognome: ${contactName || 'N/D'}`,
      `Azienda:        ${companyName || 'N/D'}`,
      `Email:          ${email || 'N/D'}`,
      `Telefono:       ${phone || 'N/D'}`,
      '',
      `Messaggio:`,
      `${notes || 'N/D'}`,
      '',
      '---',
      'Messaggio generato automaticamente dal modulo contatti di JobsReport'
    ].join('\n');
  }

  let emailSent = false;
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'Jobs Report <onboarding@resend.dev>',
        to: to,
        subject: subject,
        text: textBody,
      }),
    });

    if (response.ok) {
      emailSent = true;
    } else {
      const errorText = await response.text();
      console.error(`[EMAIL] Resend error: ${errorText}`);
    }
  } catch (emailError: any) {
    console.error(`[EMAIL] Network exception: ${emailError.message}`);
  }

  return res.status(200).json({ 
    success: true, 
    email_sent: emailSent
  });
}

