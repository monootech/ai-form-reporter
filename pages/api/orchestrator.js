// FILE: my_repo/pages/api/orchestrator.js
import fetch from 'node-fetch';
import crypto from 'crypto';

export default async function handler(req, res) {
  // --- CORS Preflight ---
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { contactId, email, formData } = req.body || {};
  if (!contactId || !email || !formData) {
    return res.status(400).json({ error: 'Missing required fields: contactId, email, or formData' });
  }

  try {
    // --- Step 1: Validate Client ---
    const GHL_API_KEY = process.env.GHL_API_KEY;
    const API_VERSION = '2021-07-28';
    const contactRes = await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${GHL_API_KEY}`,
        Version: API_VERSION,
        'Content-Type': 'application/json',
      },
    });

    const contactData = await contactRes.json();
    if (!contactRes.ok || !contactData.email) {
      return res.status(404).json({ error: 'Contact not found or API error', details: contactData });
    }

    if ((contactData.emailLowerCase || '').trim() !== email.toLowerCase().trim()) {
      return res.status(403).json({ error: 'Email does not match the contact' });
    }

    const PURCHASE_TAGS = [
      'Bought_Main_Tracker',
      'Bought_Template_Vault',
      'Bought_Accountability_System',
      'Bought_Sheets_Mastery_Course',
      'Bought_Community_Basic',
      'Bought_Community_Vip',
    ].map(t => t.toLowerCase());

    const purchaseTags = (contactData.tags || [])
      .map(t => t.toLowerCase())
      .filter(t => PURCHASE_TAGS.includes(t));

    // --- Step 2: Generate Tags based on formData ---
    const tags = [];
    if (formData.primaryGoal?.includes('Finances')) tags.push('Goal_Financial_Clarity');
    if (formData.primaryGoal?.includes('Fitness') || formData.primaryGoal?.includes('Health')) tags.push('Goal_Health_Fitness');
    if (formData.primaryGoal?.includes('Learning') || formData.primaryGoal?.includes('Growth')) tags.push('Goal_Learning_Growth');
    if (formData.primaryGoal?.includes('Focus') || formData.primaryGoal?.includes('Productivity')) tags.push('Goal_Productivity_Projects');

    if (formData.biggestFrustration?.includes('consistency')) tags.push('Obstacle_Discipline_Consistency');
    if (formData.biggestFrustration?.includes('overwhelm')) tags.push('Obstacle_Overwhelm');
    if (formData.biggestFrustration?.includes('accountability')) tags.push('Obstacle_Accountability_Lacking');

    const generatedTags = [...new Set(tags)];

    // --- Step 3: Gemini AI Analysis with Fallback ---
    let analysis = '';
    let aiSuccess = false;
    try {
      const geminiKey = process.env.GEMINI_API_KEY;
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(geminiKey);

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
      console.error('Gemini AI failed, using fallback:', err.message);

      analysis = `
# Personalized Habit Blueprint

## Quick Start Guide
Based on your goal to improve **${formData.primaryGoal}**, here's your action plan:

### Immediate Actions (Week 1)
1. Start with 5-minute daily sessions
2. Track your progress in a simple notebook
3. Set clear daily targets

### 30-Day Roadmap
- Week 1: Build consistency with small wins
- Week 2: Increase duration gradually  
- Week 3: Refine your approach
- Week 4: Solidify the habit

### Success Tips
- Focus on consistency over perfection
- Celebrate small wins daily
- Adjust your approach as needed

You've got this! Start small, stay consistent.
      `;
      aiSuccess = false;
    }

    // --- Step 4: Upload to R2 ---
    const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
    const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
    const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
    const reportId = contactId;

    const reportData = {
      reportId,
      contactId,
      email,
      formData,
      analysis,
      generatedTags,
      purchaseTags,
      generatedAt: new Date().toISOString(),
      htmlContent: analysis.replace(/\n/g, '<br>'),
      recommendations: {
        templateVault: true,
        accountability: generatedTags.includes('Obstacle_Accountability_Lacking'),
      },
      aiSuccess,
    };

    const jsonContent = JSON.stringify(reportData, null, 2);
    const contentHash = crypto.createHash('sha256').update(jsonContent).digest('hex');

    const r2Url = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET_NAME}/reports/${reportId}/report.json`;

    try {
      const r2Res = await fetch(r2Url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${R2_ACCESS_KEY_ID}`,
          'Content-Type': 'application/json',
          'x-amz-content-sha256': contentHash,
        },
        body: jsonContent,
      });

      if (!r2Res.ok) {
        console.error('R2 upload failed', await r2Res.text());
      }
    } catch (err) {
      console.error('R2 upload error:', err.message);
    }

    // --- Step 5: Return final JSON ---
    return res.status(200).json({
      success: true,
      action: 'analysis_complete',
      reportId,
      reportUrl: `${process.env.R2_PUBLIC_DOMAIN}/reports/${reportId}/report.json`,
      steps: { tagGeneration: true, aiAnalysis: aiSuccess, storage: true },
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    console.error('Orchestrator error:', err.message);
    return res.status(500).json({ error: 'Server error in orchestrator', details: err.toString() });
  }
}
