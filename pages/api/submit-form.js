// FILE: pages/api/submit-form.js
// Robust, timeout-safe proxy to Workflow 2 (Pipedream).
// Expects POST { contactId, email, firstName, formData }
// Env vars:
// - WORKFLOW2_URL or NEXT_PUBLIC_WORKFLOW2_URL
// - WORKFLOW2_BEARER_TOKEN (optional)

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const { contactId, email, firstName, formData } = req.body || {};
  if (!contactId || !email || !formData) {
    return res.status(400).json({ success: false, error: "Missing contactId, email, or formData" });
  }

  const workflow2Url = process.env.WORKFLOW2_URL || process.env.NEXT_PUBLIC_WORKFLOW2_URL;
  const bearer = process.env.WORKFLOW2_BEARER_TOKEN;

  if (!workflow2Url) {
    console.error("Submit-form: WORKFLOW2_URL not configured");
    return res.status(500).json({ success: false, error: "Server misconfiguration: Workflow 2 URL missing" });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 29_000); // 29 seconds

  try {
    const fetchRes = await fetch(workflow2Url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
      },
      body: JSON.stringify({ contactId, email, firstName, formData }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    

// Reading the response
let parsed = null;
let text = "";

try {

  text = await fetchRes.text(); // read only once


  if (text.trim()) {
    parsed = JSON.parse(text);
  } else {
    parsed = { message: "Workflow 2 completed but returned empty response" };
  }

} catch (err) {
  console.warn("Submit-form: Failed to parse Workflow 2 JSON, returning fallback", err);
  parsed = { message: "Workflow 2 completed but returned unparseable JSON", raw: text };
}

// ✅ Return standardized Response envelope
return res.status(200).json({ success: true, data: parsed });




    

  } catch (err) {
    clearTimeout(timeout);
    const isAbort = err.name === "AbortError";
    console.error("Submit-form: Error contacting Workflow2:", err);

    return res.status(500).json({
      success: false,
      error: isAbort
        ? "Request to Workflow 2 timed out (29s). Please try again."
        : "Failed to submit form to Workflow 2.",
      details: err.message,
    });
  }
}
