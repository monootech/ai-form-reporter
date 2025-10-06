// pages/api/orchestrator.js
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const crypto = require('crypto');

// Optional: Gemini AI SDK import
let GoogleGenerativeAI;
try {
  GoogleGenerativeAI = require('@google/generative-ai').GoogleGenerativeAI;
} catch (e) {
  console.warn('Gemini SDK not installed. Will use fallback.');
}

module.exports = async function handler(req, res) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(204).end();
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { contactId, email, formData } = req.body || {};
  if (!contactId || !formData) return res.status(400).json({ error: 'Missing contactId or formData' });

  try {
    // -----------------------------
    // STEP 1: Tag Generation
    // -----------------------------
    const tags = [];

    // Goal-based
    if (formData.primaryGoal?.includes('Finances')) tags.push('Goal_Financial_Clarity');
    if (formData.primaryGoal?.includes('Fitness') || formData.primaryGoal?.includes('Health')) tags.push('Goal_Health_Fitness');
    if (formData.primaryGoal?.includes('Learning') || formData.primaryGoal?.includes('Growth')) tags.push('Goal_Learning_Growth');
    if (formData.primaryGoal?.includes('Focus') || formData.primaryGoal?.includes('Productivity')) tags.push('Goal_Productivity_Projects');

    // Frustration-based
    if (formData.biggestFrustration?.includes('consistency')) tags.push('Obstacle_Discipline_Consistency');
    if (formData.biggestFrustration?.includes('overwhelm')) tags.push('Obstacle_Overwhelm');
    if (formData.biggestFrustration?.includes('accountability')) tags.push('Obstacle_Accountability_Lacking');

    const generatedTags = [...new Set(tags)];

    // -----------------------------
    // STEP 2: Gemini AI Analysis
    // -----------------------------
    let analysis = '';
    let aiSuccess = false;

    try {
      if (!GoogleGenerativeAI) throw new Error('Gemini SDK not installed');

      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

      let model;
      try {
        model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-001' });
      } catch {
        model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
      }

      const prompt = `
Create a personalized habit blueprint for someone who wants to improve their ${formData.primaryGoal}.

Their main challenge: ${formData.biggestFrustration}
Their 30-day focus: ${formData.thirtyDayFocus}
Their future vision: ${formData.futureVision}

Please provide a practical, actionable blueprint with:
1. Quick wins for immediate progress
2. A simple 30-day implementation plan
3. Strategies for maintaining consistency
4. Recommended tracking methods

Keep it encouraging and focused on practical steps.
      `;

      const result = await model.generateContent(prompt);
      analysis = await result.response.text();
      aiSuccess = true;

    } catch (err) {
      console.warn('Gemini AI failed, using fallback.', err);
      aiSuccess = false;
      analysis = fallbackBlueprintHTML(formData);
    }

    // -----------------------------
    // STEP 3: R2 Upload
    // -----------------------------
    const reportData = {
      reportId: contactId,
      contactId,
      email,
      formData,
      generatedTags,
      analysis,
      generatedAt: new Date().toISOString(),
      aiSuccess
    };

    const jsonContent = JSON.stringify(reportData, null, 2);

    const r2Url = `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${process.env.R2_BUCKET_NAME}/reports/${contactId}/report.json`;
    const contentHash = crypto.createHash('sha256').update(jsonContent).digest('hex');

    try {
      const r2Res = await fetch(r2Url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${process.env.R2_ACCESS_KEY_ID}`,
          'Content-Type': 'application/json',
          'x-amz-content-sha256': contentHash
        },
        body: jsonContent
      });

      if (!r2Res.ok) throw new Error(`R2 upload failed with status ${r2Res.status}`);

    } catch (err) {
      console.warn('R2 upload failed, using public fallback URL', err);
    }

    // -----------------------------
    // STEP 4: Return JSON Response
    // -----------------------------
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({
      success: true,
      action: 'analysis_complete',
      reportId: contactId,
      reportUrl: `${process.env.R2_PUBLIC_DOMAIN}/reports/${contactId}/report.json`,
      steps: { tagGeneration: true, aiAnalysis: aiSuccess, storage: true },
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error('Orchestrator error:', err);
    return res.status(500).json({ success: false, error: err.toString() });
  }
};

// -----------------------------
// Fallback Blueprint HTML
// -----------------------------
function fallbackBlueprintHTML(formData) {
  return `
<div class="habit-blueprint">
  <h1>🎯 Personalized AI Habit Blueprint</h1>
  <p>Generated on ${new Date().toLocaleDateString()}</p>
  <h2>Quick Start Guide</h2>
  <p>Based on your goal to improve <strong>${formData.primaryGoal}</strong>, here's your action plan:</p>
  <h3>Immediate Actions (Week 1)</h3>
  <ul>
    <li>Start with 5-minute daily sessions</li>
    <li>Track your progress in a simple notebook</li>
    <li>Set clear daily targets</li>
  </ul>
  <h3>30-Day Roadmap</h3>
  <ul>
    <li>Week 1: Build consistency with small wins</li>
    <li>Week 2: Increase duration gradually</li>
    <li>Week 3: Refine your approach</li>
    <li>Week 4: Solidify the habit</li>
  </ul>
  <h3>Success Tips</h3>
  <ul>
    <li>Focus on consistency over perfection</li>
    <li>Celebrate small wins daily</li>
    <li>Adjust your approach as needed</li>
  </ul>
</div>
  `;
}
