// pages/api/validate-client.js
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

module.exports = async function handler(req, res) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(204).end();
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { contactId, email } = req.body || {};
  if (!contactId || !email) return res.status(400).json({ valid: false, error: 'Missing contactId or email' });

  try {
    const GHL_API_KEY = process.env.GHL_API_KEY;
    const API_VERSION = '2021-07-28';

    const contactRes = await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${GHL_API_KEY}`,
        Version: API_VERSION,
        'Content-Type': 'application/json'
      }
    });

    const contactData = await contactRes.json();

    if (!contactRes.ok || !contactData.email) {
      return res.status(404).json({ valid: false, error: 'Contact not found or API error', details: contactData });
    }

    if ((contactData.emailLowerCase || '').trim() !== email.toLowerCase().trim()) {
      return res.status(403).json({ valid: false, error: 'Email does not match the contact' });
    }

    const PURCHASE_TAGS = [
      'Bought_Main_Tracker',
      'Bought_Template_Vault',
      'Bought_Accountability_System',
      'Bought_Sheets_Mastery_Course',
      'Bought_Community_Basic',
      'Bought_Community_Vip'
    ].map(t => t.toLowerCase());

    const purchaseTags = (contactData.tags || [])
      .map(t => t.toLowerCase())
      .filter(t => PURCHASE_TAGS.includes(t));

    return res.status(200).json({
      valid: true,
      message: 'Client validated successfully',
      contactId: contactData.id,
      email: contactData.email,
      purchaseTags
    });

  } catch (err) {
    console.error('Validate-client error:', err);
    return res.status(500).json({ valid: false, error: 'Unable to validate client', details: err.toString() });
  }
};










/*  THIS IS THE CDOE TO ACTIVATE FOR PIPEDREAM
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { contactId, email } = req.body;

    // Forward the request to your Pipedream workflow
    const response = await fetch("https://eop840dm00k836c.m.pipedream.net", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contactId, email }),
    });

    const data = await response.json();

    return res.status(200).json(data);
  } catch (error) {
    console.error("Validation API error:", error);
    return res.status(500).json({
      valid: false,
      error: "Unable to connect to backend",
    });
  }
}
THIS IS THE CDOE TO ACTIVATE FOR PIPEDREAM    */
