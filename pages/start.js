// FILE: my_repo/pages/start.js (UPDATE)
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function StartPage() {
  const router = useRouter();
  const { email, contactId } = router.query;

  useEffect(() => {
    if (contactId) {
      // Check if report exists by trying to fetch it
      checkExistingReport(contactId);
    } else {
      // No contactId, go to form
      router.push('/');
    }
  }, [contactId]);

  const checkExistingReport = async (contactId) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/reports/${contactId}/report.json`
      );
      
      if (response.ok) {
        // Report exists, redirect to it
        router.push(`/report/${contactId}`);
      } else {
        // No report, go to form with contact info
        router.push(`/?contactId=${contactId}${email ? `&email=${email}` : ''}`);
      }
    } catch (error) {
      // Error or no report, go to form
      router.push(`/?contactId=${contactId}${email ? `&email=${email}` : ''}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Checking for existing report...</p>
      </div>
    </div>
  );
}
