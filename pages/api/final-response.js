export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(204).setHeader('Access-Control-Allow-Origin', '*')
      .setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
      .setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
      .end();
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { contactId, tagGenerationSuccess, aiSuccess, storageSuccess, reportUrl } = req.body;

  const responseData = {
    success: true,
    action: 'analysis_complete',
    reportId: contactId,
    steps: { tagGeneration: tagGenerationSuccess, aiAnalysis: aiSuccess, storage: storageSuccess },
    reportUrl: reportUrl,
    timestamp: new Date().toISOString()
  };

  return res.status(200).json(responseData);
}
