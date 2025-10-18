// /pages/api/track-event.js
// Handles tagging, field updates, and click tracking for all report events

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    // Handle CORS preflight
    return res.status(204).setHeader("Access-Control-Allow-Origin", "*")
      .setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
      .setHeader("Access-Control-Allow-Headers", "Content-Type")
      .end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const GHL_API_KEY = process.env.GHL_API_KEY;
  const API_VERSION = "2021-07-28";
  const { contactId, eventType } = req.body || {};

  if (!contactId || !eventType) {
    return res.status(400).json({ success: false, message: "Missing contactId or eventType" });
  }

  console.log(`[track-event] Received event: ${eventType} for contactId: ${contactId}`);

  try {
    // --- Step 1: Map event types to GHL tags and fields ---
    const tagMap = {
      submitting: "Submitting_AI_Report",
      submitted: "Submitted_AI_Report",
      generated: "Generated_AI_Report",
      regenerated: "Regenerated_AI_Report",
      viewed_html: "Viewed_HTML_AI_Report",
      downloaded_pdf: "Downloaded_PDF_AI_Report",
      vault_click: "Clicked_Vault_Link_AI_Report",
      accountability_click: "Clicked_Accountability_Link_AI_Report",
      sheets_click: "Clicked_Sheets_Mastery_Link_AI_Report"
    };

    const tagToAdd = tagMap[eventType];

    // --- Step 2: Add GHL tag ---
    if (tagToAdd) {
      await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}/tags`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GHL_API_KEY}`,
          Version: API_VERSION,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ tags: [tagToAdd] })
      });
      console.log(`[track-event] Added tag: ${tagToAdd}`);
    }

    // --- Step 3: Handle field updates ---
    const updateBody = {};

    // (1) On view event: update last viewed date & increment view count
    if (eventType === "viewed_html") {
      const now = new Date().toLocaleString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });

      updateBody["customField.last_report_viewed_at"] = now;

      // Fetch current view count first
      const contactRes = await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}`, {
        headers: {
          Authorization: `Bearer ${GHL_API_KEY}`,
          Version: API_VERSION
        }
      });
      const contactData = await contactRes.json();
      const currentCount = Number(contactData?.contact?.customFields?.find(f => f.name === "AI_Report_Viewed_Count")?.value || 0);
      updateBody["customField.ai_report_viewed_count"] = currentCount + 1;
    }

    // (2) On report generation: increment Report_Generated_Count
    if (eventType === "generated" || eventType === "regenerated") {
      const contactRes = await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}`, {
        headers: {
          Authorization: `Bearer ${GHL_API_KEY}`,
          Version: API_VERSION
        }
      });
      const contactData = await contactRes.json();
      const currentCount = Number(contactData?.contact?.customFields?.find(f => f.name === "Report_Generated_Count")?.value || 0);
      updateBody["customField.report_generated_count"] = currentCount + 1;
    }

    if (Object.keys(updateBody).length > 0) {
      await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${GHL_API_KEY}`,
          Version: API_VERSION,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(updateBody)
      });
      console.log(`[track-event] Updated fields for ${contactId}:`, updateBody);
    }

    return res.status(200).json({ success: true, tagAdded: tagToAdd || null, updatedFields: updateBody });
  } catch (err) {
    console.error("[track-event] Error:", err);
    return res.status(500).json({ success: false, message: "Internal Server Error", error: err.message });
  }
}
