// pages/report/[id].js - Dynamic Report Page (Updated)

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

/**
 * ReportPage
 * Dynamic page to display a user's Personalized AI Habit Blueprint
 * Handles:
 * - Rendering AI analysis (HTML safe)
 * - Rendering dynamic upsells from structuredReport
 * - PDF download and link tracking
 */
export default function ReportPage() {
  const router = useRouter();
  const { id } = router.query;

  // --- State management ---
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Fetch report when `id` is available ---
  useEffect(() => {
    if (id) fetchReport(id);
  }, [id]);

  /**
   * fetchReport
   * Fetch report JSON from internal API
   * @param {string} reportId
   */
  const fetchReport = async (reportId) => {
    try {
      console.log("[ReportPage] Fetching report for ID:", reportId);

      const response = await fetch(`/api/get-report?id=${reportId}`);
      if (!response.ok) throw new Error('Report not found or access denied');

      const reportJson = await response.json();
      const reportData = reportJson.report;

      // --- Transform AI analysis Markdown to sanitized HTML ---
      const rawAnalysis = reportData.analysis || '';
      const cleanHtml = DOMPurify.sanitize(marked.parse(rawAnalysis));

      setReport({ ...reportData, htmlContent: cleanHtml });
      console.log("[ReportPage] Report loaded successfully:", reportData);

    } catch (err) {
      console.error("[ReportPage] Error fetching report:", err);
      setError(err.message || "Failed to load report.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * handleDownloadPDF
   * Tracks click and opens PDF in new tab
   */
  const handleDownloadPDF = () => {
    if (!id) return;

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

  /**
   * handleLinkClick
   * Tracks upsell link clicks
   * @param {string} type - upsell id or link type
   */
  const handleLinkClick = (type) => {
    if (!id) return;

    fetch(`/api/track-click`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportId: id, linkType: type })
    });
  };

  // --- Loading state ---
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading your Personalized AI Habit Blueprint...</p>
      </div>
    </div>
  );

  // --- Error state ---
  if (error) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center text-red-600">
        <h2 className="text-xl font-bold mb-2">Report Not Found</h2>
        <p>{error}</p>
      </div>
    </div>
  );

  // --- Main content render ---
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">

        {/* --- Header --- */}
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

        {/* --- AI Analysis Content --- */}
        <div className="bg-white shadow-2xl rounded-2xl p-10 border-t-4 border-green-500 mb-8">
          <div className="prose prose-lg max-w-none leading-relaxed text-gray-800">
            <div dangerouslySetInnerHTML={{ __html: report.htmlContent }} />
          </div>
        </div>

        {/* --- Dynamic Upsells Section --- */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
          {report.structuredReport?.upsells?.map((upsell) => {
            if (!upsell.show) return null; // skip hidden upsells

            const alreadyPurchased = !upsell.UserNeeds;

            return (
              <div key={upsell.id} className="flex flex-col items-center bg-white shadow-md p-4 rounded-lg border border-gray-200">
                
                {/* Upsell Reason / Explanation */}
                <p className="text-gray-700 mb-2 text-center">{upsell.reason}</p>

                {/* Show purchase button only if user needs it */}
                {upsell.UserNeeds && (
                  <a
                    href={upsell.purchaseLink}
                    onClick={() => handleLinkClick(upsell.id)}
                    className={`px-6 py-3 rounded-lg font-semibold text-lg transition-colors ${
                      upsell.id === "main_tracker"
                        ? "bg-green-600 text-white hover:bg-green-700"
                        : "border-2 border-blue-600 text-blue-600 hover:bg-blue-50"
                    }`}
                  >
                    {upsell.id === "main_tracker" ? "📈 Get Main Tracker" : "🔑 Get Product"}
                  </a>
                )}

                {/* Optional: Show message if already purchased */}
                {alreadyPurchased && (
                  <span className="text-sm text-gray-500 mt-2 italic text-center">
                    Already in your toolkit ✅
                  </span>
                )}

              </div>
            );
          })}
        </div>

        {/* --- PDF Download Button --- */}
        <div className="flex justify-center mb-8">
          <button
            onClick={handleDownloadPDF}
            className="bg-green-600 text-white px-8 py-4 rounded-lg hover:bg-green-700 font-semibold text-lg transition-colors"
          >
            📥 Download PDF Version
          </button>
        </div>

      </div>
    </div>
  );
}
