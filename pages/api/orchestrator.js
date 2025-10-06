// FILE: pages/api/orchestrator.js
import fetch from 'node-fetch';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_PUBLIC_DOMAIN = process.env.R2_PUBLIC_DOMAIN;
const GHL_API_KEY = process.env.GHL_API_KEY;

async function logStep(stepName, payload) {
  try {
    // 1️⃣ Log to Vercel console
    console.log(`🟢 [${stepName}]`, JSON.stringify(payload, null, 2));

    // 2️⃣ Optional: persist to R2 for permanent trace
    // const filename = `${Date.now()}-${stepName}.json`;
    // await fetch(`https://api.cloudflare.com/client/v4/accounts/${R2_ACCOUNT_ID}/r2/buckets/${R2_BUCKET_NAME}/objects/${filename}`, {
    //   method: 'PUT',
    //   headers: {
    //     Authorization: `Bearer ${R2_ACCESS_KEY_ID}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify(payload)
    // });

  } catch (err) {
    console.error(`Failed to log step "${stepName}":`, err);
  }
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(204).setHeader('Access-Control-Allow-Origin', '*')
      .setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
      .setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
      .end();
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { contactId, email, formData } = req.body || {};

  await logStep('Received request', { contactId, email, formData });

  if (!contactId || !email) {
    await logStep('Missing parameters', { contactId, email });
    return res.status(400).json({ error: 'Missing contactId or email' });
  }

  // ===== Step 1: Validate Client =====
  let clientValid = false;
  let purchaseTags = [];
  try {
    const contactRes = await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${GHL_API_KEY}`,
        Version: '2021-07-28',
        'Content-Type': 'application/json'
      }
    });
    const contactData = await contactRes.json();
    await logStep('Validate client - response', contactData);

    if (!contactRes.ok || !contactData.email) {
      await logStep('Validate client - failed', contactData);
      return res.status(403).json({ valid: false, error: 'Invalid contact or API error', details: contactData });
    }

    if ((contactData.emailLowerCase || '').trim() !== email.toLowerCase().trim()) {
      await logStep('Validate client - email mismatch', { email, contactDataEmail: contactData.email });
      return res.status(403).json({ valid: false, error: 'Email does not match the contact' });
    }

    // Filter purchase tags
    const PURCHASE_TAGS = [
      'Bought_Main_Tracker',
      'Bought_Template_Vault',
      'Bought_Accountability_System',
      'Bought_Sheets_Mastery_Course',
      'Bought_Community_Basic',
      'Bought_Community_Vip'
    ].map(t => t.toLowerCase());

    purchaseTags = (contactData.tags || [])
      .map(t => t.toLowerCase())
      .filter(t => PURCHASE_TAGS.includes(t));

    clientValid = true;
    await logStep('Validate client - success', { clientValid, purchaseTags });

  } catch (err) {
    await logStep('Validate client - error', { error: err.toString() });
    return res.status(500).json({ error: 'Error validating client', details: err.toString() });
  }

  // ===== Step 2: AI Analysis / Generate Report =====
  let aiResult = {};
  try {
    // Example placeholder AI call, replace with your Gemini API integration
    aiResult = {
      summary: `Generated 30-day blueprint for ${email}`,
      formData
    };
    await logStep('AI analysis', aiResult);

  } catch (err) {
    await logStep('AI analysis failed', { error: err.toString() });
    // Optional fallback: Gemini HTML output
    aiResult = { fallbackHtml: `<h2>30-Day Blueprint for ${email}</h2>` };
  }

  // ===== Step 3: Upload to R2 (optional) =====
  try {
    // Example: store AI result to R2
    // const filename = `report-${contactId}-${Date.now()}.json`;
    // await fetch(`${R2_PUBLIC_DOMAIN}/${filename}`, { method: 'PUT', body: JSON.stringify(aiResult) });
    await logStep('R2 upload', { uploaded: true, contactId });
  } catch (err) {
    await logStep('R2 upload failed', { error: err.toString() });
  }

  // ===== Step 4: Return response =====
  const reportId = `report-${contactId}-${Date.now()}`;
  const responsePayload = {
    action: 'analysis_complete',
    reportId,
    aiResult,
    clientValid,
    purchaseTags
  };

  await logStep('Final response', responsePayload);
  return res.status(200).json(responsePayload);
}
