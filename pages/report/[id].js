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
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/reports/${reportId}/report.json`
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
    // For now, just track the click - PDF generation will be added later
    fetch('/api/track-click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportId: id, linkType: 'pdf_download' })
    });
    
    alert('PDF download will be available soon!');
  };

  const handleLinkClick = (type) => {
    fetch('/api/track-click', {
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
        <button 
          onClick={() => router.push('/')}
          className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg"
        >
          Go Back to Form
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Report Header */}
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

        {/* Report Content */}
        <div className="bg-white shadow-xl rounded-lg p-8 mb-8">
          <div 
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: report.htmlContent }} 
          />
        </div>

        {/* Action Buttons */}
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

        {/* Debug Info (remove in production) */}
        <div className="mt-8 p-4 bg-gray-100 rounded-lg text-sm">
          <details>
            <summary className="cursor-pointer font-semibold">Debug Info</summary>
            <pre className="mt-2 whitespace-pre-wrap">
              {JSON.stringify({
                reportId: id,
                aiSuccess: report.aiSuccess,
                storageSuccess: true,
                recommendations: report.recommendations,
                purchaseTags: report.purchaseTags
              }, null, 2)}
            </pre>
          </details>
        </div>
      </div>
    </div>
  );
}
