// pages/api/track-click.js - Track Upsell Link Clicks
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { reportId, linkType } = req.body;

  try {
    // Call Pipedream webhook to track the click
    await fetch(process.env.PIPEDREAM_TRACKING_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reportId,
        linkType,
        timestamp: new Date().toISOString(),
        action: `Clicked_${linkType}_Link_AI_Report`
      })
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Tracking error:', error);
    res.status(500).json({ error: 'Tracking failed' });
  }
}
