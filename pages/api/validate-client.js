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
