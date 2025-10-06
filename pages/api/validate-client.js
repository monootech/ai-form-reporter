// pages/api/validate-client.js
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ valid: false, error: "Method not allowed" });
  }

  const { contactId, email } = req.body || {};

  if (!contactId || !email) {
    return res.status(400).json({ valid: false, error: "Missing contactId or email" });
  }

  const GHL_API_KEY = process.env.GHL_API_KEY; // Put your private integration key in Vercel environment
  const API_VERSION = "2021-07-28"; // As per GHL docs

  try {
    // Fetch contact by ID
    const response = await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${GHL_API_KEY}`,
        "Version": API_VERSION,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    // Check if contact exists
    if (!response.ok || !data.contact) {
      return res.status(404).json({ valid: false, error: "Contact not found or API error", details: data });
    }

    const contact = data.contact;

    // Verify email matches (case-insensitive)
    if ((contact.emailLowerCase || "").trim() !== email.toLowerCase().trim()) {
      return res.status(400).json({ valid: false, error: "Email does not match the contact" });
    }

    // Filter purchase tags
    const PURCHASE_TAGS = [
      "Bought_Main_Tracker",
      "Bought_Template_Vault",
      "Bought_Accountability_System",
      "Bought_Sheets_Mastery_Course",
      "Bought_Community_Basic",
      "Bought_Community_Vip"
    ].map(tag => tag.toLowerCase());

    const clientTags = (contact.tags || [])
      .map(tag => tag.toLowerCase())
      .filter(tag => PURCHASE_TAGS.includes(tag));

    return res.status(200).json({
      valid: true,
      message: "Client validated successfully",
      email: contact.email,
      contactId: contact.id,
      purchaseTags: clientTags,
    });

  } catch (err) {
    console.error("GHL API error:", err);
    return res.status(500).json({ valid: false, error: "Unable to validate contact at this time", details: err.toString() });
  }
}









/*  THIS IS THE CDOE TO ACTIVATE FOR PIPEDREAM
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { contactId, email } = req.body;

    // Forward the request to your Pipedream workflow
    const response = await fetch("https://eop840dm00k836c.m.pipedream.net", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contactId, email }),
    });

    const data = await response.json();

    return res.status(200).json(data);
  } catch (error) {
    console.error("Validation API error:", error);
    return res.status(500).json({
      valid: false,
      error: "Unable to connect to backend",
    });
  }
}
THIS IS THE CDOE TO ACTIVATE FOR PIPEDREAM    */
