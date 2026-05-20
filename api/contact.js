module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://photographer.fomus.jp');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, email, contactInfo, purpose, timing, location, usage, message, lang } = req.body || {};

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  const isEN = lang === 'en';

  const subject = isEN
    ? `[Session Inquiry] ${name}`
    : `【撮影相談】${name}様より`;

  const html = isEN ? `
<h2 style="color:#181816;font-family:sans-serif">New Session Inquiry</h2>
<table style="font-family:sans-serif;font-size:14px;border-collapse:collapse;width:100%">
  <tr><td style="padding:8px;color:#666;width:140px">Name</td><td style="padding:8px"><strong>${name}</strong></td></tr>
  <tr><td style="padding:8px;color:#666">Email</td><td style="padding:8px"><a href="mailto:${email}">${email}</a></td></tr>
  ${purpose ? `<tr><td style="padding:8px;color:#666">Session type</td><td style="padding:8px">${purpose}</td></tr>` : ''}
  ${timing  ? `<tr><td style="padding:8px;color:#666">Timing</td><td style="padding:8px">${timing}</td></tr>` : ''}
  ${message ? `<tr><td style="padding:8px;color:#666;vertical-align:top">Message</td><td style="padding:8px">${message.replace(/\n/g,'<br>')}</td></tr>` : ''}
</table>
` : `
<h2 style="color:#181816;font-family:sans-serif">撮影相談フォーム</h2>
<table style="font-family:sans-serif;font-size:14px;border-collapse:collapse;width:100%">
  <tr><td style="padding:8px;color:#666;width:140px">お名前</td><td style="padding:8px"><strong>${name}</strong></td></tr>
  <tr><td style="padding:8px;color:#666">メール</td><td style="padding:8px"><a href="mailto:${email}">${email}</a></td></tr>
  ${contactInfo ? `<tr><td style="padding:8px;color:#666">電話/SNS</td><td style="padding:8px">${contactInfo}</td></tr>` : ''}
  ${purpose    ? `<tr><td style="padding:8px;color:#666">撮影目的</td><td style="padding:8px">${purpose}</td></tr>` : ''}
  ${timing     ? `<tr><td style="padding:8px;color:#666">希望時期</td><td style="padding:8px">${timing}</td></tr>` : ''}
  ${location   ? `<tr><td style="padding:8px;color:#666">希望エリア</td><td style="padding:8px">${location}</td></tr>` : ''}
  ${usage      ? `<tr><td style="padding:8px;color:#666">使用用途</td><td style="padding:8px">${usage}</td></tr>` : ''}
  ${message    ? `<tr><td style="padding:8px;color:#666;vertical-align:top">メッセージ</td><td style="padding:8px">${message.replace(/\n/g,'<br>')}</td></tr>` : ''}
</table>
`;

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'MaSU Photography <contact@fomus.jp>',
        to: ['contact@fomus.jp'],
        reply_to: email,
        subject,
        html,
      }),
    });

    if (!r.ok) {
      const err = await r.json();
      console.error('Resend error:', err);
      return res.status(500).json({ error: 'Failed to send email' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};
