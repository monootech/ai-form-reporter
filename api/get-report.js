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

  console.log('🔍 Looking for report ID:', id);
  
  if (!id) {
    return res.status(400).json({ error: 'Report ID is required' });
  }

  try {
    console.log('🔍 Attempting to fetch from Redis...');
    
    // ✅ GET FROM REDIS - Upstash automatically parses JSON, no need for JSON.parse!
    const reportData = await redis.get(id);
    console.log('🔍 Redis response type:', typeof reportData);
    console.log('🔍 Redis response for ID', id, ':', reportData ? 'DATA FOUND' : 'NO DATA');
    
    if (!reportData) {
      console.log('❌ No data found in Redis for ID:', id);
      return res.status(404).json({ error: 'Report not found' });
    }

    console.log('✅ Successfully retrieved report data for:', reportData.userName);
    
    res.json({ success: true, report: reportData });
    
  } catch (error) {
    console.error('❌ Error fetching from Redis:', error);
    console.error('❌ Error details:', error.message);
    
    res.status(500).json({ 
      error: 'Failed to fetch report',
      details: error.message 
    });
  }
}
