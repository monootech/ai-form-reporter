// pages/report/[id].js - Dynamic Report Page (Updated)

// pages/report/[id].js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

export default function ReportPage() {
  const router = useRouter();
  const { id } = router.query;

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) fetchReport(id);
  }, [id]);

  const fetchReport = async (reportId) => {
    try {
      console.log("[ReportPage] Fetching report for ID:", reportId);

      const response = await fetch(`/api/get-report?id=${reportId}`);
      if (!response.ok) throw new Error('Report not found or access denied');

      const json = await response.json();
      console.log("[ReportPage] Raw report JSON:", json);

      if (!json.success || !json.report) {
        throw new Error("Report JSON invalid or empty");
      }

      const reportData = json.report;

      // --- Transform reportSections into safe HTML ---
      const sections = reportData.report?.reportSections || [];
      const htmlContent = sections
        .map((section) => {
          const titleHtml = section.title
            ? `<h2 class="text-2xl font-bold mt-6 mb-2">${section.title}</h2>`
            : "";
          const contentHtml = section.content
            ? DOMPurify.sanitize(marked.parse(section.content))
            : "";
          return `${titleHtml}${contentHtml}`;
        })
        .join("");

      setReport({ ...reportData, htmlContent });
      console.log("[ReportPage] Report loaded and transformed successfully");

    } catch (err) {
      console.error("[ReportPage] Error fetching or processing report:", err);
      setError(err.message || "Failed to load report.");
    } finally {
      setLoading(false);
    }
  };

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

  const handleLinkClick = (type) => {
    if (!id) return;
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

        {/* --- Main Report Sections --- */}
        <div className="bg-white shadow-2xl rounded-2xl p-10 border-t-4 border-green-500 mb-8">
          <div className="prose prose-lg max-w-none leading-relaxed text-gray-800">
            <div dangerouslySetInnerHTML={{ __html: report.htmlContent }} />
          </div>
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

        {/* --- Optional: Upsells / Recommendations --- */}
        {/* Can be added here later when structuredReport.upsells is available */}

      </div>
    </div>
  );
}
