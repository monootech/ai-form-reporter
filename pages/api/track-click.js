// Frontend API route for tracking clicks
// Sends to Report-Publisher workflow

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { reportId, linkType } = req.body;

  try {
    // Send to Report-Publisher workflow
    await fetch(process.env.PUBLISHER_WORKFLOW_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'track_click',
        trackingData: {
          reportId,
          linkType,
          timestamp: new Date().toISOString()
        }
      })
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Tracking error:', error);
    // Don't fail the request if tracking fails
    res.status(200).json({ success: false });
  }
}
