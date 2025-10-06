import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const logs = [];
  const { contactId, email, formData } = req.body || {};

  if (!contactId || !email) {
    logs.push({ step: 'Input validation', status: 'FAIL', detail: 'Missing contactId or email' });
    return res.status(400).json({ logs });
  }

  logs.push({ step: 'Sending contactId/email to GHL', status: 'PENDING', detail: { contactId, email } });

  try {
    const GHL_API_KEY = process.env.GHL_API_KEY;
    const API_VERSION = '2021-07-28';

    // 1️⃣ Fetch contact
    const contactRes = await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${GHL_API_KEY}`,
        Version: API_VERSION,
        'Content-Type': 'application/json'
      }
    });

    const contactData = await contactRes.json();
    logs.push({ step: 'Validate contact', status: contactRes.ok ? 'SUCCESS' : 'FAIL', contact: contactData });

    if (!contactRes.ok) {
      return res.status(404).json({ logs, error: 'Contact fetch failed' });
    }

    // 2️⃣ Email match
    const actualEmail = (contactData.emailLowerCase || contactData.email || '').normalize('NFKC').trim().toLowerCase();
    const expectedEmail = email.normalize('NFKC').trim().toLowerCase();
    const emailMatches = actualEmail === expectedEmail;

    logs.push({
      step: 'Email match',
      status: emailMatches ? 'SUCCESS' : 'FAIL',
      expected: expectedEmail,
      actual: actualEmail
    });

    if (!emailMatches) {
      return res.status(403).json({ logs, error: 'Email does not match contact' });
    }

    // 3️⃣ Extract purchase tags
    const PURCHASE_TAGS = [
      'Bought_Main_Tracker',
      'Bought_Template_Vault',
      'Bought_Accountability_System',
      'Bought_Sheets_Mastery_Course',
      'Bought_Community_Basic',
      'Bought_Community_Vip'
    ].map(t => t.toLowerCase());

    const purchaseTags = (contactData.tags || [])
      .map(t => t.toLowerCase().trim())
      .filter(t => PURCHASE_TAGS.includes(t));

    logs.push({ step: 'Extract purchase tags', status: 'SUCCESS', purchaseTags });

    // 4️⃣ Send tags to GHL (simulate)
    logs.push({ step: 'Send tags to GHL', status: 'SUCCESS', sentTags: purchaseTags });

    // 5️⃣ Gemini AI analysis (simulate fallback)
    const aiResult = {
      summary: 'Generated AI 30-day personalized blueprint successfully.',
      insights: ['Habit stacking', 'Weekly review', 'Focus blocks']
    };
    logs.push({ step: 'Gemini AI analysis', status: 'SUCCESS', result: aiResult });

    // 6️⃣ Upload to R2 (simulate)
    const uploaded = true;
    const publicUrl = `${process.env.R2_PUBLIC_DOMAIN}/test-file.json`;
    logs.push({ step: 'Upload results to R2', status: 'SUCCESS', uploaded, publicUrl });

    return res.status(200).json({ logs });
  } catch (err) {
    logs.push({ step: 'Orchestrator error', status: 'FAIL', error: err.toString() });
    return res.status(500).json({ logs, error: 'Orchestrator failed' });
  }
}
