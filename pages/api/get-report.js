// pages/api/get-report.js
export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ success: false, error: 'Missing report ID' });
  }

  try {
    // Fetch from Cloudflare R2
    const response = await fetch(
      `https://${process.env.R2_PUBLIC_DOMAIN}/reports/${id}/report.json`
    );
    
    if (!response.ok) {
      throw new Error('Report not found');
    }
    
    const reportData = await response.json();
    res.status(200).json({ success: true, report: reportData });
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(404).json({ 
      success: false, 
      error: 'Report not found or access denied' 
    });
  }
}
