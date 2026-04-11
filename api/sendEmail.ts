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
        to: ['jtw@live.it'], // UPDATED to jtw@live.it as per recent request not to use jorgtw
        subject: '[JobsReport] Richiesta nuova registrazione',
        text: textBody,
      }),
    });

    const responseText = await response.text();
    let data = {};
    if (responseText) {
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        data = { message: responseText };
      }
    }

    if (response.ok) {
      return res.status(200).json({ success: true, data });
    } else {
      return res.status(400).json({ success: false, error: data, status: response.status });
    }
  } catch (error: any) {
    console.error("sendEmail Error:", error);
    return res.status(500).json({ success: false, error: { message: error.message || 'Internal Server Error' } });
  }
}
