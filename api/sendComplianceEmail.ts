export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, subject, companyName, projectName, clientName, date, totalHours, userName, pdfBase64, pdfUrl } = req.body;

  if (!to || !Array.isArray(to) || to.length === 0) {
    return res.status(400).json({ error: 'No recipient emails provided' });
  }

  const textBody = `
Compliance Report - ${projectName}

Data: ${date}
Progetto: ${projectName}
Cliente: ${clientName}
Responsabile: ${userName}
Totale ore squadra: ${totalHours} h

Il report è stato generato da ${companyName || 'JobsReport'}.

SCARICA REPORT: ${pdfUrl || 'Disponibile previa richiesta'}

---
Generato automaticamente da JobsReport
  `.trim();

  const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #1e40af; color: white; padding: 20px; border-radius: 12px 12px 0 0;">
    <h1 style="margin: 0; font-size: 20px;">📋 Compliance Report</h1>
    <p style="margin: 4px 0 0; opacity: 0.8; font-size: 13px;">${companyName || 'JobsReport'}</p>
  </div>
  <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
    <table style="width: 100%; border-collapse: collapse;">
      <tr><td style="padding: 8px 0; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">DATA</td><td style="padding: 8px 0; font-weight: bold;">${date}</td></tr>
      <tr><td style="padding: 8px 0; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">PROGETTO</td><td style="padding: 8px 0; font-weight: bold;">${projectName}</td></tr>
      <tr><td style="padding: 8px 0; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">CLIENTE</td><td style="padding: 8px 0; font-weight: bold;">${clientName}</td></tr>
      <tr><td style="padding: 8px 0; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">RESPONSABILE</td><td style="padding: 8px 0; font-weight: bold;">${userName}</td></tr>
      <tr style="background: #eff6ff;">
        <td style="padding: 12px 8px; color: #1e40af; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: bold;">TOTALE ORE SQUADRA</td>
        <td style="padding: 12px 8px; color: #1e40af; font-size: 20px; font-weight: bold;">${totalHours} h</td>
      </tr>
    </table>
    
    <div style="margin: 32px 0; text-align: center;">
      <a href="${pdfUrl || '#'}" style="background: #1e40af; color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        📥 Scarica Report PDF
      </a>
      <p style="margin-top: 12px; font-size: 11px; color: #64748b;">(Il link è valido per 7 giorni)</p>
    </div>

    <p style="margin-top: 24px; font-size: 12px; color: #94a3b8; text-align: center;">
      Generato automaticamente da <strong>JobsReport</strong>
    </p>
  </div>
</body>
</html>
  `.trim();

  // Prepare PDF attachment (optional fallback, normally we use pdfUrl now)
  let attachments: any[] = [];
  if (pdfBase64) {
    const base64Data = pdfBase64.split(',')[1];
    attachments = [{
      filename: `Compliance_${date}_${(projectName || 'Report').replace(/\s+/g, '_')}.pdf`,
      content: base64Data,
      type: 'application/pdf',
      disposition: 'attachment',
    }];
  }


  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'JobsReport <onboarding@resend.dev>',
        to: to,
        subject: subject || `[JobsReport] Compliance Report — ${projectName} — ${date}`,
        text: textBody,
        html: htmlBody,
        attachments,
      }),
    });

    const data = await response.json();
    if (response.ok) {
      return res.status(200).json({ success: true, data });
    } else {
      console.error('Resend API error:', data);
      return res.status(400).json({ success: false, error: data });
    }
  } catch (error: any) {
    console.error('Email send error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
