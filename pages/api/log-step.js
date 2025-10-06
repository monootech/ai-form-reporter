export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { stepName, payload } = req.body;
      console.log(`🟢 [${stepName}]`, JSON.stringify(payload, null, 2));
      
      // Optional: save logs somewhere permanent (R2 bucket / database)
      // await saveToR2OrDB(stepName, payload);

      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error('Logger error:', err);
      return res.status(500).json({ ok: false, error: err.toString() });
    }
  } else {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
