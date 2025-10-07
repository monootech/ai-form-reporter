
// FILE: pages/api/submit-form.js
// Purpose: Secure proxy to Workflow 2 (analysis + Gemini + tag generation + R2 storage).
// Expects POST { contactId, email, firstName, formData } from the front-end HabitForm.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { contactId, email, firstName, formData } = req.body || {};

  if (!contactId || !email || !formData) {
    return res.status(400).json({
      success: false,
      error: "Missing contactId, email, or form data."
    });
  }

  try {
    const workflow2Url = process.env.NEXT_PUBLIC_WORKFLOW2_URL;

    if (!workflow2Url) {
      throw new Error("Workflow 2 URL not configured in environment variables.");
    }

    const response = await fetch(workflow2Url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "generate_blueprint",
        contactId,
        email,
        firstName,
        formData
      })
    });

    const result = await response.json();

    // Expected Workflow 2 output:
    // { success: true, reportUrl?, contactId?, message? }
    if (result.success) {
      return res.status(200).json({
        success: true,
        reportUrl: result.reportUrl || null,
        contactId: result.contactId || contactId,
        message: result.message || "Blueprint generated successfully."
      });
    } else {
      return res.status(200).json({
        success: false,
        error: result.error || "Workflow 2 returned an error."
      });
    }
  } catch (error) {
    console.error("Submit-form API error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to submit form to Workflow 2."
    });
  }
}

