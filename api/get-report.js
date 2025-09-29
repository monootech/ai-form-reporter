// In-memory store (Note: This clears on server restart. For production, use a database.)
const reports = new Map();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id || !reports.has(id)) {
    return res.status(404).json({ error: 'Report not found' });
  }

  const reportData = reports.get(id);
  res.json({ success: true, report: reportData });
}
