// pages/report/[id].js - Dynamic Report Page (Updated)

// pages/report/[id].js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { marked } from "marked";

/**
 * Robust Report Page
 * - Safely fetches /api/get-report?id=...
 * - Builds sanitized HTML from report.report.reportSections
 * - Dynamically renders structuredReport.upsells (show + userNeeds)
 * - Tracks clicks for PDF + upsells
 * - Defensive: never throws if fields are missing
 */

export default function ReportPage() {
  const router = useRouter();
  const { id } = router.query;

  const [report, setReport] = useState(null);      // will hold the raw report object from API + htmlContent
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // We'll load DOMPurify only on client inside effect to avoid SSR issues
  const [domPurify, setDomPurify] = useState(null);

  useEffect(() => {
    // dynamic import of DOMPurify — only runs in browser
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

  useEffect(() => {
    if (!id) return;
    fetchReport(id);
  }, [id, domPurify]); // re-run when domPurify is ready (so we can sanitize)

  /**
   * fetchReport
   * Fetches JSON from /api/get-report and transforms sections -> htmlContent safely
   */
  async function fetchReport(reportId) {
    setLoading(true);
    setError(null);
    setReport(null);

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

      // Defensive: handle both old style (analysis string) and new structured report sections
      // Prefer structured sections at: reportData.report.reportSections
      const sections = reportData?.report?.reportSections || [];

      // If no sections but a single analysis text exists (older flows), fallback to that
      if (!sections.length && typeof reportData?.report?.analysis === "string") {
        // create a single section with analysis
        sections.push({
          title: "Analysis",
          content: reportData.report.analysis
        });
      }

      // Build HTML from sections safely
      let htmlContent = "";

      // If domPurify isn't loaded yet, we still convert markdown but we WILL NOT sanitize.
      // We log a warning (sanitization is strongly recommended for production).
      const sanitizeFn = (html) => {
        if (domPurify && typeof domPurify.sanitize === "function") {
          return domPurify.sanitize(html);
        } else {
          // fallback: log and return raw HTML (less safe). This only happens briefly until domPurify loads.
          console.warn("[ReportPage] DOMPurify not ready; serving unsanitized HTML temporarily.");
          return html;
        }
      };

      htmlContent = sections
        .map((section) => {
          const titleHtml = section?.title
            ? `<h2 class="text-2xl font-bold mt-6 mb-2">${escapeHtml(section.title)}</h2>`
            : "";
          const contentMd = section?.content || "";
          const contentHtml = marked.parse(contentMd);
          const cleaned = sanitizeFn(contentHtml);
          return `${titleHtml}${cleaned}`;
        })
        .join("");

      // Construct final in-memory report for rendering
      const finalReport = {
        // raw top-level values returned by API (contactId, firstName, report, generatedAt, generatedAt etc.)
        ...reportData,
        // attach transformed content ready to render
        htmlContent,
        // quick-access alias for structured upsells if present
        structuredUpsells: reportData?.report?.upsells || reportData?.report?.structuredReport?.upsells || [],
        // include purchase tags (some reports may include these at top)
        purchaseTags: (reportData?.purchaseTags || reportData?.report?.purchaseTags || []).map(String)
      };

      console.log("[ReportPage] Transformed report (finalReport keys):", Object.keys(finalReport));
      setReport(finalReport);

    } catch (err) {
      console.error("[ReportPage] Error loading report:", err);
      setError(err?.message || "Failed to load report.");
    } finally {
      setLoading(false);
    }
  }

  /**
   * click tracker for PDF and upsell links
   */
  function trackClick(payload) {
    if (!id) return;
    // non-blocking fire-and-forget
    fetch("/api/track-click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportId: id, ...payload })
    }).catch((err) => console.warn("[ReportPage] trackClick failed:", err));
  }

  function handleDownloadPDF() {
    trackClick({ linkType: "pdf_download" });
    // open the public R2 PDF location — note: adjust domain if you change R2 account
    window.open(
      `https://pub-5fd9b7e823f34897ac9194436fa60593.r2.dev/reports/${id}/report.pdf`,
      "_blank"
    );
  }

  // --- Loading / Error states (guarded UI) ---
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

  // Safety: if report somehow still null after loading, show friendly message
  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No report data available. If you believe this is an error, check the console logs or contact support.</p>
        </div>
      </div>
    );
  }

  // --- Render the page using safe optional chaining ---
  const generatedAt = report.generatedAt || report?.report?.metadata?.generatedAt || report?.report?.report?.metadata?.generatedAt;
  const dateText = generatedAt ? new Date(generatedAt).toLocaleString("en-US", {
    year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit"
  }) : "Unknown date";

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-green-700 mb-4">🎯 Personalized AI Habit Blueprint</h1>
          <p className="text-gray-600 text-lg">Generated on {dateText}</p>
        </div>

        {/* Main Report content */}
        <div className="bg-white shadow-2xl rounded-2xl p-10 border-t-4 border-green-500 mb-8">
          <div className="prose prose-lg max-w-none leading-relaxed text-gray-800">
            {/* NOTE: we already sanitized htmlContent earlier with DOMPurify (when available) */}
            <div dangerouslySetInnerHTML={{ __html: report.htmlContent || "<p>No content available.</p>" }} />
          </div>
        </div>






        {/* Dynamic Upsells (structured) */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Recommended Tools & Next Steps</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.isArray(report.structuredUpsells) && report.structuredUpsells.length > 0 ? (
              report.structuredUpsells.map((upsell) => {
                // normalize keys (some outputs might use userNeeds vs UserNeeds)
                const show = upsell?.show === true || upsell?.show === "true";
                const userNeeds = upsell?.userNeeds === true || upsell?.UserNeeds === true || upsell?.userNeeds === "true" || upsell?.UserNeeds === "true";

                if (!show) return null; // respect model's show flag

                const alreadyPurchased = !userNeeds;

                return (
                  <div key={upsell?.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <div className="mb-2 text-gray-700">{upsell?.reason || "This tool can help you progress faster."}</div>

                    <div className="flex items-center justify-between gap-2">
                      {userNeeds ? (
                        <a
                          href={upsell?.purchaseLink || "#"}
                          onClick={() => { trackClick({ linkType: `upsell_click:${upsell?.id}` }); }}
                          className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${
                            upsell?.id === "main_tracker"
                              ? "bg-green-600 text-white hover:bg-green-700"
                              : "border-2 border-blue-600 text-blue-600 hover:bg-blue-50"
                          }`}
                        >
                          {upsell?.id === "main_tracker" ? "📈 Get Main Tracker" : `Get ${formatUpsellLabel(upsell?.id)}`}
                        </a>
                      ) : (
                        <span className="text-sm text-gray-500 italic">Already owned or not recommended now.</span>
                      )}

                      {/* small tag shows ID for debugging */}
                      <span className="text-xs text-gray-400 ml-2">{upsell?.id}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-gray-600">No recommended upsells at this time.</div>
            )}
          </div>
        </div>








{/* 🧩 Recommended Tools & Next Steps */}
<section className="mt-12">
  <h2 className="text-2xl font-bold mb-6 text-center">
    Recommended Tools & Next Steps
  </h2>

  <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
    {finalReport?.structuredUpsells?.filter(u => u.show).map((upsell) => (
      <div key={upsell.id} className="p-6 bg-white shadow-md rounded-2xl border border-gray-200">
        <h3 className="text-lg font-semibold capitalize mb-2">{formatProductName(upsell.id)}</h3>

        <p className="text-gray-700 mb-4 whitespace-pre-line">
          {upsell.reason}
        </p>

        {/* Show button only if user needs it */}
        {upsell.UserNeeds ? (
          <a
            href={upsell.purchaseLink}
            className="block w-full text-center bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Get Access →
          </a>
        ) : (
          <p className="text-sm text-green-700 font-medium text-center mt-2">
            ✅ You already own this!
          </p>
        )}
      </div>
    ))}
  </div>
</section>



// New thing Start

function formatProductName(id) {
  if (!id || typeof id !== "string") return "";

  const names = {
    main_tracker: "Viral Habit Tracker Kit",
    template_vault: "Template Vault",
    accountability_system: "Accountability System",
    sheets_mastery_course: "Google Sheets Mastery Course",
    community_basic: "Habit Community (Basic)",
    community_vip: "Habit Community (VIP)",
  };

  // Use custom name if available, otherwise format fallback
  if (names[id]) return names[id];

  // Fallback: replace underscores, capitalize first letter
  const formatted = id.replace(/_/g, " ");
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

// New thing End










        {/* PDF download */}
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

/**
 * formatUpsellLabel
 * small helper to prettify upsell IDs into human labels.
 */
function formatUpsellLabel(id) {
  if (!id) return "Product";
  return id
    .replace(/_/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

/**
 * escapeHtml
 * very small helper for titles to prevent injecting raw title HTML.
 */
function escapeHtml(unsafe) {
  if (!unsafe) return "";
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
