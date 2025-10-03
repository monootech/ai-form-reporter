// pages/index.js - MINIMAL VERSION
import { useState } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();
  const { email, contactId } = router.query;
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Simple test submission
      const response = await fetch(process.env.PUBLISHER_WORKFLOW_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId: contactId || 'test-' + Date.now(),
          email: email || 'test@example.com',
          formData: { primaryGoal: 'Test' }
        })
      });

      const result = await response.json();
      console.log('Submission result:', result);
      
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Habit Mastery System</h1>
      <form onSubmit={handleSubmit}>
        <button type="submit" disabled={loading}>
          {loading ? 'Loading...' : 'Test Form'}
        </button>
      </form>
    </div>
  );
}
