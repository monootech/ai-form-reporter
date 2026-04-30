// latest report page, trying to fix the issue of "track-click" from ghl with fixes from deepseek.
// pages/report/[id].js - Final Production Version
// - No duplicate DOMPurify import
// - Handles GHL "Track Clicks" placeholder
// - Full report UI with structured sections, upsells, & CTA

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { marked } from "marked";
import SectionIcon from "../../components/SectionIcon";

export default function ReportPage() {
  const router = useRouter();
  const { id } = router.query;

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [domPurify, setDomPurify] = useState(null);

  const properCase = (name) => {
    if (!name || typeof name !== "string") return "";
    return name[0].toUpperCase() + name.slice(1).toLowerCase();
  };

  // Load DOMPurify only on client (no static import)
  useEffect(() => {
    (async () => {
      if (typeof window === "undefined") return;
      try {
        const module = await import("dompurify");
        setDomPurify(module.default || module);
      } catch (err) {
        console.warn("[ReportPage] Could not load DOMPurify:", err);
        setDomPurify(null);
      }
    })();
  }, []);

  /**
   * Main effect:
   * - Waits for router readiness
   * - Handles GHL placeholder ID (track clicks ON)
   * - Fetches report normally
   */
  useEffect(() => {
    if (!router.isReady) return;
    if (!id || !domPurify) return;
    if (report) return; // already loaded

    const isTemplateId =
      id === "{{contact.id}}" || id === "%7B%7Bcontact.id%7D%7D";

    if (isTemplateId) {
      const actualContactId =
        router.query.contactId ||
        router.query.contact_id ||
        router.query.contactid;

      if (actualContactId) {
        console.log("[ReportPage] Template ID detected, redirecting to:", actualContactId);
        const email = router.query.email || "";
        const query = email ? `?email=${encodeURIComponent(email)}` : "";
        router.replace(`/report/${actualContactId}${query}`);
        return;
      } else {
        setError("Invalid report link. Missing contact identifier. Please use the original email link.");
        setLoading(false);
        return;
      }
    }

    fetchReport(id);
  }, [router.isReady, id, domPurify]);

  async function fetchReport(reportId) {
    setLoading(true);
    setError(null);

    try {
      console.log("[ReportPage] Fetching report for id:", reportId);
      const resp = await fetch(`/api/get-report?id=${encodeURIComponent(reportId)}`);
      if (!resp.ok) {
        const text = await resp.text().catch(() => "");
        throw new Error(`Failed to fetch report (status ${resp.status}) - ${text || "no details"}`);
      }

      const json = await resp.json();
      console.log("[ReportPage] Raw API response:", json);
      if (!json?.success || !json?.report) {
        throw new Error("Report API returned invalid payload");
      }

      const reportData = json.report;

      const sections = reportData?.report?.reportSections || [];
      if (!sections.length && typeof reportData?.report?.analysis === "string") {
        sections.push({ title: "Analysis", content: reportData.report.analysis });
      }

      const sanitizeFn = (html) => {
        if (domPurify && typeof domPurify.sanitize === "function") {
          return domPurify.sanitize(html);
        }
        if (!window.__dompurifyWarnedOnce) {
          console.warn("[ReportPage] DOMPurify not ready; serving unsanitized HTML temporarily.");
          window.__dompurifyWarnedOnce = true;
        }
        return html;
      };

      const htmlContent = sections
        .map((section) => {
          const titleHtml = section?.title
            ? `<h2 class="text-2xl font-bold mt-6 mb-2">${escapeHtml(section.title)}</h2>`
            : "";
          const contentHtml = marked.parse(section?.content || "");
          return `${titleHtml}${sanitizeFn(contentHtml)}`;
        })
        .join("");

      const finalReport = {
        ...reportData,
        htmlContent,
        structuredUpsells:
          reportData?.report?.upsells || reportData?.report?.structuredReport?.upsells || [],
        purchaseTags: (reportData?.purchaseTags || reportData?.report?.purchaseTags || []).map(String),
      };

      console.log("[ReportPage] Transformed report keys:", Object.keys(finalReport));
      console.log("[ReportPage] Structured Upsells Preview:", finalReport.structuredUpsells);
      console.log("[ReportPage] Purchase Tags:", finalReport.purchaseTags);

      setReport(finalReport);
    } catch (err) {
      console.error("[ReportPage] Error loading report:", err);
      setError(err?.message || "Failed to load report.");
    } finally {
      setLoading(false);
    }
  }

  function trackClick(payload) {
    if (!id) return;
    fetch("/api/track-click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportId: id, ...payload }),
    }).catch((err) => console.warn("[ReportPage] trackClick failed:", err));
  }

  function handleDownloadPDF() {
    trackClick({ linkType: "pdf_download" });
    window.open(
      `https://pub-5fd9b7e823f34897ac9194436fa60593.r2.dev/reports/${id}/report.pdf`,
      "_blank"
    );
  }

  // --- UI states ---
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your Personalized AI Habit Blueprint...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-red-600">
          <h2 className="text-xl font-bold mb-2">Report Not Found</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No report data available. If you believe this is an error, check the console logs or contact support.</p>
        </div>
      </div>
    );
  }

  const generatedAt =
    report.generatedAt || report?.report?.metadata?.generatedAt || report?.report?.report?.metadata?.generatedAt;
  const dateText = generatedAt
    ? new Date(generatedAt).toLocaleString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "Unknown date";

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-green-700 mb-3 leading-tight">
            🎯 {properCase(report?.firstName || "Guest")}, Your AI Habit Blueprint
          </h1>
          <p className="text-gray-600 text-lg">
            A personalized system to help you build momentum and stay consistent.
          </p>
          <p className="text-gray-400 text-sm mt-1">Generated on {dateText}</p>
        </div>

        {/* Main Report Content */}
        <div className="bg-white shadow-2xl rounded-2xl p-10 border-t-4 border-green-500 mb-8">
          {Array.isArray(report?.report?.reportSections) && report.report.reportSections.length > 0 ? (
            <div className="space-y-12">
              {report.report.reportSections.map((section, sectionIdx) => (
                <div key={sectionIdx} className="border-b border-gray-200 pb-10 last:border-none">
                  {section?.title && (
                    <div className="flex items-center gap-4 mb-6">
                      <SectionIcon
                        name={
                          section.title.toLowerCase().includes("executive")
                            ? "summary"
                            : section.title.toLowerCase().includes("habit")
                            ? "analysis"
                            : section.title.toLowerCase().includes("roadmap")
                            ? "roadmap"
                            : section.title.toLowerCase().includes("long-term") || section.title.toLowerCase().includes("long term")
                            ? "longterm"
                            : section.title.toLowerCase().includes("strategic")
                            ? "strategy"
                            : section.title.toLowerCase().includes("tools") || section.title.toLowerCase().includes("upsell")
                            ? "tools"
                            : "summary"
                        }
                        className="w-10 h-10 text-green-600"
                      />
                      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
                        {section.title}
                      </h2>
                    </div>
                  )}

                  {section?.summary && (
                    <p className="text-lg text-gray-700 mb-6 leading-relaxed">{section.summary}</p>
                  )}

                  {Array.isArray(section.subsections) && section.subsections.length > 0 && (
                    <div className="space-y-10">
                      {section.subsections.map((sub, subIdx) => (
                        <div
                          key={subIdx}
                          className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition"
                        >
                          {sub?.subtitle && (
                            <h3 className="text-2xl font-semibold text-green-700 mb-4">{sub.subtitle}</h3>
                          )}
                          {Array.isArray(sub.paragraphs) && sub.paragraphs.length > 0 && (
                            <div className="space-y-4 text-gray-800 leading-relaxed max-w-2xl">
                              {sub.paragraphs.map((p, pIdx) => (
                                <p key={pIdx}>{p}</p>
                              ))}
                            </div>
                          )}
                          {Array.isArray(sub.bullets) && sub.bullets.length > 0 && (
                            <ul className="list-disc list-inside mt-4 space-y-2 text-gray-700 pl-2">
                              {sub.bullets.map((b, bIdx) => (
                                <li key={bIdx}>{b}</li>
                              ))}
                            </ul>
                          )}
                          {Array.isArray(sub.quotes) && sub.quotes.length > 0 && (
                            <div className="mt-6 border-l-4 border-green-500 pl-4 text-gray-600 italic space-y-2 bg-gray-50 py-3 rounded-r-lg">
                              {sub.quotes.map((q, qIdx) => (
                                <blockquote key={qIdx}>"{q}"</blockquote>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">No structured sections available.</p>
          )}
        </div>

        {/* Dynamic Upsells */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Tools That Can Help You Move Faster</h3>
          {Array.isArray(report.structuredUpsells) && report.structuredUpsells.length > 0 ? (
            report.structuredUpsells
              .filter((u) => u.show === true)
              .map((upsell) => {
                const userHas = upsell?.userHas === true;
                const displayName = upsell?.name || formatUpsellLabel(upsell?.id);
                return (
                  <div
                    key={upsell?.id}
                    className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-lg font-semibold text-gray-800">{displayName}</h4>
                      {userHas && <span className="text-green-600 font-medium text-sm">✅ Already in your toolkit</span>}
                    </div>
                    <p className="text-gray-700 mb-3 whitespace-pre-line">
                      {upsell?.reason || "This tool can help you achieve your goals faster."}
                    </p>
                    <div className="flex justify-between items-center">
                      {!userHas && (
                        <a
                          href={upsell?.purchaseLink || "#"}
                          onClick={() => trackClick({ linkType: `upsell_click:${upsell?.id}` })}
                          className={`inline-block px-5 py-2 rounded-lg font-semibold text-sm transition-colors ${
                            upsell?.id === "main_tracker"
                              ? "bg-green-600 text-white hover:bg-green-700"
                              : "border-2 border-blue-600 text-blue-600 hover:bg-blue-50"
                          }`}
                        >
                          {upsell?.id === "main_tracker" ? "Start tracking with this system" : `Explore ${displayName}`}
                        </a>
                      )}
                      {userHas && <span className="text-sm text-gray-500 italic">You already have access to this system.</span>}
                    </div>
                  </div>
                );
              })
          ) : (
            <div className="text-gray-500">No additional tools needed right now — you're good to go.</div>
          )}
        </div>

        {/* Start Here CTA */}
        <div className="mt-10 p-6 bg-gray-50 rounded-lg">
          <h3 className="text-xl font-bold mb-3">🚀 Start Here</h3>
          <ul className="text-gray-700 space-y-2">
            <li>Pick one habit from your plan</li>
            <li>Start today — even if it's small</li>
            <li>Track your first completion</li>
          </ul>
          <p className="mt-4 text-sm text-gray-500">Consistency builds momentum. Momentum builds results.</p>
        </div>

        {/* PDF download (commented for now) */}
        {/*
        <div className="flex justify-center mb-8">
          <button onClick={handleDownloadPDF} className="bg-green-600 text-white px-8 py-4 rounded-lg hover:bg-green-700 font-semibold text-lg transition-colors">
            📥 Download PDF Version
          </button>
        </div>
        */}
      </div>
    </div>
  );
}

// Helpers
function formatUpsellLabel(id) {
  if (!id) return "Product";
  return id.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

function escapeHtml(unsafe) {
  if (!unsafe) return "";
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
