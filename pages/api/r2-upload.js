import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(204).setHeader('Access-Control-Allow-Origin', '*')
      .setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
      .setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
      .end();
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { contactId, email, formData, generatedTags, analysis } = req.body;

  try {
    const reportData = {
      reportId: contactId,
      contactId,
      email,
      formData,
      analysis,
      generatedTags,
      generatedAt: new Date().toISOString()
    };

    const jsonContent = JSON.stringify(reportData, null, 2);
    const r2Url = `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${process.env.R2_BUCKET_NAME}/reports/${contactId}/report.json`;
    const contentHash = crypto.createHash('sha256').update(jsonContent).digest('hex');

    const response = await fetch(r2Url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${process.env.R2_ACCESS_KEY_ID}`,
        'Content-Type': 'application/json',
        'x-amz-content-sha256': contentHash
      },
      body: jsonContent
    });

    if (!response.ok) throw new Error(await response.text());

    return res.status(200).json({ storageSuccess: true, reportUrl: r2Url });

  } catch (err) {
    console.error('R2 upload error:', err);
    return res.status(500).json({ storageSuccess: false, storageError: err.message });
  }
}
