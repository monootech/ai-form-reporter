
// FILE: pages/api/validate-client.js
// Purpose: Proxy serverless function that validates client access
// by calling your Pipedream "Workflow 1" endpoint.
// Expects POST { contactId, email } and returns { valid, firstName, error }.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { contactId, email } = req.body || {};

  if (!contactId || !email) {
    return res.status(400).json({ valid: false, error: "Missing contactId or email." });
  }

  try {

    // Workflow 1 URL stored securely in Vercel
    const endpoint = process.env.NEXT_PUBLIC_WORKFLOW1_URL;
    
    
    if (!endpoint) {
      throw new Error("Workflow 1 URL not configured.");
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "validate_client",
        contactId,
        email
      })
    });

    const result = await response.json();

    // Expected Workflow 1 output:
    // { valid: true, contactId, email, firstName, error }
    if (result.valid) {
      return res.status(200).json({
        valid: true,
        contactId: result.contactId,
        email: result.email,
        firstName: result.firstName || "",
        message: result.message || "Validation successful."
      });
    } else {
      return res.status(200).json({
        valid: false,
        error: result.error || "Invalid or unauthorized contact."
      });
    }
  } catch (error) {
    console.error("Validation API error:", error);
    return res.status(500).json({
      valid: false,
      error: "Unable to validate contact at this time."
    });
  }
}

