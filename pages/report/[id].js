// pages/report/[id].js - Dynamic Report Page
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function ReportPage() {
  const router = useRouter();
  const { id } = router.query;
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) {
      fetchReport(id);
    }
  }, [id]);

  const fetchReport = async (reportId) => {
    try {
      // Fetch JSON from Cloudflare R2 via public URL
      const response = await fetch(
        `https://pub-<your-r2-subdomain>.r2.dev/reports/${reportId}/report.json`
      );
      
      if (!response.ok) {
        throw new Error('Report not found');
      }
      
      const reportData = await response.json();
      setReport(reportData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    // Direct link to PDF in R2
    window.open(
      `https://pub-<your-r2-subdomain>.r2.dev/reports/${id}/report.pdf`,
      '_blank'
    );
  };

  const handleLinkClick = (type) => {
    // Track clicks for upsell links
    fetch(`/api/track-click`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportId: id, linkType: type })
    });
  };

  if (loading) return <div className="p-8 text-center">Loading your Personalized AI Habit Blueprint...</div>;
  if (error) return <div className="p-8 text-center text-red-600">Error: {error}</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Report Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-green-700 mb-2">
          Personalized AI Habit Blueprint
        </h1>
        <p className="text-gray-600">Generated on {new Date(report.generatedAt).toLocaleDateString()}</p>
      </div>

      {/* Report Content */}
      <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
        <div dangerouslySetInnerHTML={{ __html: report.htmlContent }} />
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4 mb-8">
        <button
          onClick={handleDownloadPDF}
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
        >
          📥 Download PDF Version
        </button>
        
        {/* Upsell Links - Tracked */}
        {report.recommendations?.templateVault && (
          <button
            onClick={() => handleLinkClick('vault')}
            className="border border-green-600 text-green-600 px-6 py-3 rounded-lg hover:bg-green-50"
          >
            🔑 Get Template Vault
          </button>
        )}
      </div>
    </div>
  );
}
