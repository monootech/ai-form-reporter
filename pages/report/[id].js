// pages/report/[id].js - Dynamic Report Page (Updated)
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
      // ✅ Fetch report via internal API (get-report.js)
      const response = await fetch(`/api/get-report?id=${reportId}`);
      
      if (!response.ok) {
        throw new Error('Report not found or access denied');
      }
      
      const reportJson = await response.json();
      const reportData = reportJson.report;

      // ✅ Optional: Transform JSON into HTML-ready format
      const htmlContent = reportData.analysis
        ? reportData.analysis.replace(/\n/g, '<br />') // simple line breaks
        : '<p>No analysis content</p>';

      setReport({ ...reportData, htmlContent });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    fetch(`/api/track-click`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportId: id, linkType: 'pdf_download' })
    });
    
    window.open(
      `https://pub-5fd9b7e823f34897ac9194436fa60593.r2.dev/reports/${id}/report.pdf`,
      '_blank'
    );
  };

  const handleLinkClick = (type) => {
    fetch(`/api/track-click`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportId: id, linkType: type })
    });
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading your Personalized AI Habit Blueprint...</p>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center text-red-600">
        <h2 className="text-xl font-bold mb-2">Report Not Found</h2>
        <p>{error}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-green-700 mb-4">
            🎯 Personalized AI Habit Blueprint
          </h1>
          <p className="text-gray-600 text-lg">
            Generated on {new Date(report.generatedAt).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>

        <div className="bg-white shadow-xl rounded-lg p-8 mb-8">
          <div 
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: report.htmlContent }} 
          />
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
          <button
            onClick={handleDownloadPDF}
            className="bg-green-600 text-white px-8 py-4 rounded-lg hover:bg-green-700 font-semibold text-lg transition-colors"
          >
            📥 Download PDF Version
          </button>
          {report.recommendations?.templateVault && !report.purchaseTags?.includes('Bought_Template_Vault') && (
            <button
              onClick={() => handleLinkClick('vault')}
              className="border-2 border-green-600 text-green-600 px-8 py-4 rounded-lg hover:bg-green-50 font-semibold text-lg transition-colors"
            >
              🔑 Get Template Vault
            </button>
          )}
          {report.recommendations?.accountability && !report.purchaseTags?.includes('Bought_Accountability_System') && (
            <button
              onClick={() => handleLinkClick('accountability')}
              className="border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-lg hover:bg-blue-50 font-semibold text-lg transition-colors"
            >
              👥 Get Accountability System
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
