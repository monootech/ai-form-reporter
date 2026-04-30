// FILE: my_repo/pages/start.js (UPDATED)
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function StartPage() {
  const router = useRouter();
  const { email } = router.query;

  // --- Accept contactId, contact_id OR contactid (browser lowercases) ---
  const rawContactId =
    router.query.contactId || router.query.contact_id || router.query.contactid;
  const contactId = rawContactId || undefined;

  useEffect(() => {
    // Guard: wait until router is fully ready
    if (!router.isReady) return;

    if (contactId) {
      checkExistingReport(contactId);
    } else {
      // No contactId at all → go to index (which will show an error)
      router.push('/');
    }
  }, [router.isReady, contactId]);

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
