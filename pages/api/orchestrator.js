export default async function handler(req, res) {
  try {
    // Only allow POST
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { contactId, email, formData } = req.body || {};

    if (!contactId || !email) {
      return res.status(400).json({ error: 'Missing contactId or email' });
    }

    console.log('Orchestrator called with:', { contactId, email, formData });

    // Example: validate your env vars exist
    if (!process.env.RESEND_API_KEY) throw new Error('Missing RESEND_API_KEY');
    if (!process.env.GEMINI_API_KEY) throw new Error('Missing GEMINI_API_KEY');
    if (!process.env.R2_BUCKET_NAME) throw new Error('Missing R2_BUCKET_NAME');

    // TODO: actual orchestrator logic here
    // For now, just respond with a safe success
    return res.status(200).json({
      message: 'Orchestrator received data successfully',
      contactId,
      email,
      formData
    });

  } catch (err) {
    console.error('Orchestrator error:', err);
    // Return JSON instead of Vercel HTML page
    res.status(500).json({ error: err.message, stack: err.stack });
  }
}
