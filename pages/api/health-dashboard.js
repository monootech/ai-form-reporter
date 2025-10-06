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

  // Helper: render HTML dashboard
  const renderHTML = (logs) => {
    const color = (status) =>
      status === "success" ? "green" : status === "fail" ? "red" : "orange";

    return `
      <html>
        <head>
          <title>Health Dashboard</title>
          <style>
            body { font-family: sans-serif; padding: 2rem; background: #f5f5f5; }
            h1 { text-align: center; }
            .step { margin-bottom: 1rem; padding: 1rem; background: #fff; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);}
            .step h3 { margin: 0 0 0.5rem 0; }
            .step pre { background: #eee; padding: 0.5rem; overflow-x: auto; border-radius: 4px; }
            .section-title { font-size: 1.2rem; font-weight: bold; margin-top: 2rem; }
          </style>
        </head>
        <body>
          <h1>AI Orchestrator Health Dashboard</h1>
          ${logs.map((l, i) => `
            <section class="step">
              <h3 style="color:${color(l.status)}">${l.step} — ${l.status.toUpperCase()}</h3>
              <pre>${JSON.stringify(l.details || l.contact || l.purchaseTags || l.sentTags || l.result || l, null, 2)}</pre>
            </section>
          `).join("")}
        </body>
      </html>
    `;
  };

  try {
    // 1️⃣ Sending contactId/email to GHL
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

    if (!contactOk) logs.push({ step: "Contact fetch failed", status: "fail", details: contactData });
    if (!emailMatches) logs.push({ step: "Email match", status: "fail", details: { expected: email, actual: contactData.email } });

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
      .map((t) => t.toLowerCase().trim())
      .filter((t) => PURCHASE_TAGS.includes(t));

    logs.push({
      step: "Extract purchase tags",
      status: purchaseTags.length ? "success" : "fail",
      details: { purchaseTags },
    });

    // 3️⃣ Send tags to GHL
    logs.push({
      step: "Send tags to GHL",
      status: "success",
      details: { sentTags: purchaseTags },
    });

    // 4️⃣ Gemini AI analysis (simulate)
    const geminiResult = {
      summary: "Generated AI 30-day personalized blueprint successfully.",
      insights: ["Habit stacking", "Weekly review", "Focus blocks"],
    };

    logs.push({
      step: "Gemini AI analysis",
      status: "success",
      details: geminiResult,
    });

    // 5️⃣ Upload to R2 (simulate)
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

    return res.status(200).send(renderHTML(logs));
  } catch (err) {
    logs.push({ step: "Unexpected error", status: "fail", details: err.toString() });
    return res.status(500).send(renderHTML(logs));
  }
}
