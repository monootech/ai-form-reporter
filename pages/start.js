// pages/start.js - Entry Point with Access Control
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function StartPage() {
  const router = useRouter();
  const { user, token } = router.query;

  useEffect(() => {
    if (user && token) {
      checkReportAccess(user, token);
    }
  }, [user, token]);

  const checkReportAccess = async (userId, accessToken) => {
    try {
      // Verify token and check if report exists within 7 days
      const response = await fetch(
        `https://your-pipedream-webhook.pipedream.net/check-access`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, token: accessToken })
        }
      );

      const { hasRecentReport, reportId } = await response.json();

      if (hasRecentReport) {
        // Redirect to existing report
        router.push(`/report/${reportId}`);
      } else {
        // Redirect to form (or show form directly)
        router.push(`/form?user=${userId}&token=${accessToken}`);
      }
    } catch (error) {
      console.error('Access check failed:', error);
      router.push('/form');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Checking your access...</p>
      </div>
    </div>
  );
}
