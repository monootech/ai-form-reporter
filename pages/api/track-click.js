// pages/api/track-click.js - Track User Interactions
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { reportId, linkType } = req.body;

  try {
    // Send tracking data to Pipedream
    await fetch(process.env.PIPEDREAM_TRACKING_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reportId,
        linkType,
        timestamp: new Date().toISOString(),
        action: `Clicked_${linkType.charAt(0).toUpperCase() + linkType.slice(1)}_Link_AI_Report`
      })
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Tracking error:', error);
    // Don't fail the request if tracking fails
    res.status(200).json({ success: false });
  }
}
