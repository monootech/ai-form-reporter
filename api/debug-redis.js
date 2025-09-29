import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export default async function handler(req, res) {
  console.log('🔍 KV_REST_API_URL:', process.env.KV_REST_API_URL ? 'EXISTS' : 'MISSING');
  console.log('🔍 KV_REST_API_TOKEN:', process.env.KV_REST_API_TOKEN ? 'EXISTS' : 'MISSING');
  
  try {
    // Test Redis connection
    await redis.set('test', 'connection_works');
    const testResult = await redis.get('test');
    
    res.json({
      redis_connection: 'SUCCESS',
      test_value: testResult,
      env_vars: {
        KV_REST_API_URL: process.env.KV_REST_API_URL ? 'SET' : 'MISSING',
        KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN ? 'SET' : 'MISSING'
      }
    });
  } catch (error) {
    console.error('❌ Redis connection failed:', error);
    res.status(500).json({
      redis_connection: 'FAILED',
      error: error.message
    });
  }
}
