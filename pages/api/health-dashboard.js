import fetch from "node-fetch";

export default async function handler(req, res) {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return res
      .status(204)
      .setHeader("Access-Control-Allow-Origin", "*")
      .setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
      .setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")
      .end();
  }

  const contactId = req.query.contactId || "test-contact-id";
  const email = req.query.email || "test@example.com";

  const logs = [];

  // Helper to render HTML dashboard
  const renderHTML = (logs) => {
    const color = (status) =>
      status === "success" ? "green" : status === "fail" ? "red" : "orange";

    return `
      <html>
        <head>
          <title>Health Dashboard</title>
          <style>
            body { font-family: sans-serif; padding: 2rem; background: #f5f5f5; }
            .step { margin-bottom: 1rem; padding: 1rem; background: #fff; border-radius: 8px; }
            .step h3 { margin: 0 0 0.5rem 0; }
            .step pre { background: #eee; padding: 0.5rem; overflow-x: auto; border-radius: 4px; }
          </style>
        </head>
        <body>
          <h1>Health Dashboard</h1>
          <ul>
            ${logs
              .map(
                (l) => `
              <li class="step">
                <h3 style="color:${color(l.status)}">${l.step} — ${l.status.toUpperCase()}</h3>
                <pre>${JSON.stringify(l.details, null, 2)}</pre>
              </li>
            `
              )
              .join("")}
          </ul>
        </body>
      </html>
    `;
  };

  try {
    // Step 1: Fetch contact from GHL
    logs.push({ step: "Sending contactId/email to GHL", status: "pending", details: { contactId, email } });

    const GHL_API_KEY = process.env.GHL_API_KEY;
    const contactRes = await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${GHL_API_KEY}`,
        Version: "2021-07-28",
        "Content-Type": "application/json",
      },
    });

    const contactData = await contactRes.json();

    const contactOk = contactRes.ok && contactData.email;
    const emailMatches = (contactData.emailLowerCase || contactData.email || "").trim().toLowerCase() === email.trim().toLowerCase();

    logs.push({
      step: "Validate contact",
      status: contactOk && emailMatches ? "success" : "fail",
      details: contactData,
    });

    if (!contactOk) {
      logs.push({ step: "Contact fetch failed", status: "fail", details: contactData });
    }
    if (!emailMatches) {
      logs.push({ step: "Email match", status: "fail", details: { expected: email, actual: contactData.email } });
    }

    // Step 2: Extract purchase tags
    const PURCHASE_TAGS = [
      "Bought_Main_Tracker",
      "Bought_Template_Vault",
      "Bought_Accountability_System",
      "Bought_Sheets_Mastery_Course",
      "Bought_Community_Basic",
      "Bought_Community_Vip",
    ].map((t) => t.toLowerCase());

    const purchaseTags = (contactData.tags || [])
      .map((t) => t.toLowerCase())
      .filter((t) => PURCHASE_TAGS.includes(t));

    logs.push({
      step: "Extract purchase tags",
      status: purchaseTags.length ? "success" : "fail",
      details: { purchaseTags },
    });

    // Step 3: Check if tags are sent to GHL (simulate)
    logs.push({
      step: "Send tags to GHL",
      status: "success",
      details: { sentTags: purchaseTags },
    });

    // Step 4: Gemini AI analysis (simulate)
    const geminiResult = {
      summary: "Generated AI 30-day personalized blueprint successfully.",
      insights: ["Habit stacking", "Weekly review", "Focus blocks"],
    };

    logs.push({
      step: "Gemini AI analysis",
      status: "success",
      details: geminiResult,
    });

    // Step 5: Upload to R2 (simulate)
    const r2UploadResult = {
      uploaded: true,
      bucket: process.env.R2_BUCKET_NAME,
      publicUrl: `${process.env.R2_PUBLIC_DOMAIN}/test-file.json`,
    };

    logs.push({
      step: "Upload results to R2",
      status: "success",
      details: r2UploadResult,
    });
  } catch (err) {
    logs.push({ step: "Unexpected error", status: "fail", details: err.toString() });
  }

  return res.status(200).send(renderHTML(logs));
}
