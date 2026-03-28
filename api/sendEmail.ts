export default async function handler(req: any, res: any) {
  // Solo POST consentito
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  const { companyName, contactName, email, phone, notes } = req.body;

  // Formato richiesto dall'utente
  const textBody = `Salve,

Vorrei registrare la mia azienda su JobsReport.

Nome azienda: ${companyName || '...'}
Referente: ${contactName || '...'}
Email: ${email || '...'}
Telefono: ${phone || '...'}
Note: ${notes || '...'}

Grazie`;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY || 'PLACEHOLDER_INSERIRE_API_KEY_QUI'}`,
      },
      body: JSON.stringify({
        from: 'JobsReport <onboarding@resend.dev>', // Modificare se si attiva un proprio dominio verificato in Resend
        to: ['jorgtw@gmail.com'],
        subject: '[JobsReport] Richiesta nuova registrazione',
        text: textBody,
      }),
    });

    const data = await response.json();
    if (response.ok) {
      return res.status(200).json({ success: true, data });
    } else {
      return res.status(400).json({ success: false, error: data });
    }
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
