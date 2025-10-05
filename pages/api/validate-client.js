export default async function handler(req, res) {
    console.log("validate-client hit:", req.method, req.body);
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { contactId, email } = req.body;
  console.log("Incoming:", contactId, email);

  // TODO: Call your backend / Pipedream here
  return res.status(200).json({ valid: false, error: "Test response - backend not connected" });
  
  
  try {
    // Call your Pipedream workflow or GHL API to validate the contact
    const response = await fetch(process.env.NEXT_PUBLIC_ORCHESTRATOR_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'validate_contact',
        contactId,
        email
      })
    });

    const result = await response.json();
    
    if (result.valid) {
      res.status(200).json({ valid: true });
    } else {
      res.status(200).json({ 
        valid: false, 
        error: result.error || 'Contact not found in our system' 
      });
    }
  } catch (error) {
    console.error('Validation API error:', error);
    res.status(200).json({ 
      valid: false, 
      error: 'Unable to validate contact at this time' 
    });
  }
}
