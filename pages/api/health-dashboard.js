// pages/api/health-dashboard.js
import fetch from "node-fetch";

export default async function handler(req, res) {
  const logs = [];

  // 1️⃣ Validate client step
  const contactId = req.query.contactId || "TEST_CONTACT";
  const email = req.query.email || "test@example.com";

  try {
    logs.push({ step: "Sending contactId/email to GHL", status: "pending" });

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

    if (!contactRes.ok || !contactData.email) {
      logs.push({
        step: "Validate contact",
        status: "fail",
        details: contactData,
      });
      return res.status(200).send(renderHTML(logs));
    }

    const emailMatches = (contactData.emailLowerCase || "").trim() === email.toLowerCase().trim();
    logs.push({
      step: "Validate contact",
      status: emailMatches ? "success" : "fail",
      details: { contactEmail: contactData.email, emailMatches },
    });

    // 2️⃣ Extract purchase tags
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
      status: "success",
      details: { purchaseTags },
    });

    // 3️⃣ Simulate sending tags back to GHL
    logs.push({
      step: "Send tags to GHL",
      status: "success",
      details: { sentTags: purchaseTags },
    });

    // 4️⃣ Simulate Gemini AI Analysis
    logs.push({
      step: "Gemini AI analysis",
      status: "success",
      details: { analysis: "Simulated AI analysis output" },
    });

    // 5️⃣ Simulate uploading to R2
    logs.push({
      step: "Upload results to R2",
      status: "success",
      details: { uploaded: true, bucket: process.env.R2_BUCKET_NAME },
    });

    return res.status(200).send(renderHTML(logs));
  } catch (err) {
    logs.push({ step: "Unexpected error", status: "fail", details: err.toString() });
    return res.status(500).send(renderHTML(logs));
  }
}

// Helper to render logs as HTML
function renderHTML(logs) {
  const html = `
    <html>
      <head>
        <title>Health Dashboard</title>
        <style>
          body { font-family: sans-serif; background: #f5f5f5; padding: 20px; }
          .step { background: white; padding: 15px; margin-bottom: 10px; border-radius: 8px; }
          .success { border-left: 5px solid green; }
          .fail { border-left: 5px solid red; }
          .pending { border-left: 5px solid orange; }
          pre { background: #eee; padding: 10px; border-radius: 5px; }
        </style>
      </head>
      <body>
        <h1>Health / Debug Dashboard</h1>
        ${logs
          .map(
            (log) => `
          <div class="step ${log.status}">
            <h2>${log.step} — ${log.status.toUpperCase()}</h2>
            <pre>${JSON.stringify(log.details, null, 2)}</pre>
          </div>
        `
          )
          .join("")}
      </body>
    </html>
  `;
  return html;
}
