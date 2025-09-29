import { Redis } from '@upstash/redis';

// Initialize Redis with your Vercel KV environment variables
const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  console.log('Looking for report ID:', id);
  
  if (!id) {
    return res.status(400).json({ error: 'Report ID is required' });
  }

  try {
    // ✅ GET FROM REDIS (not from memory)
    const rawData = await redis.get(id);
    console.log('Redis response for ID', id, ':', rawData);
    
    if (!rawData) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const reportData = JSON.parse(rawData);
    res.json({ success: true, report: reportData });
    
  } catch (error) {
    console.error('Error fetching from Redis:', error);
    res.status(500).json({ error: 'Failed to fetch report' });
  }
}
