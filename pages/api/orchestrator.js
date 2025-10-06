import fetch from 'node-fetch';
import crypto from 'crypto';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Helper: Convert analysis to HTML
function convertToProperHTML(analysis) {
  return `
    <div class="habit-blueprint">
      <div class="header">
        <h1>🎯 Personalized AI Habit Blueprint</h1>
        <p>Generated on ${new Date().toLocaleDateString()}</p>
      </div>
      <div class="content">
        ${analysis.replace(/\n/g, '<br>')}
      </div>
      <div class="footer">
        <p>Confidential Report • Habit Mastery System</p>
      </div>
    </div>
  `;
}

export default async function handler(req, res) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).setHeader('Access-Control-Allow-Origin', '*')
      .setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
      .setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
      .end();
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { contactId, email, formData } = req.body || {};
  if (!contactId || !email || !formData) {
    return res.status(400).json({ error: 'Missing contactId, email, or formData' });
  }

  try {
    // 1️⃣ Validate client & fetch purchase tags
    const GHL_API_KEY = process.env.GHL_API_KEY;
    const API_VERSION = '2021-07-28';

    const contactRes = await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${GHL_API_KEY}`,
        Version: API_VERSION,
        'Content-Type': 'application/json'
      }
    });

    const contactData = await contactRes.json();

    if (!contactRes.ok || !contactData.email) {
      return res.status(404).json({ valid: false, error: 'Contact not found or API error', details: contactData });
    }

    if ((contactData.emailLowerCase || '').trim() !== email.toLowerCase().trim()) {
      return res.status(403).json({ valid: false, error: 'Email does not match the contact' });
    }

    const PURCHASE_TAGS = [
      'Bought_Main_Tracker',
      'Bought_Template_Vault',
      'Bought_Accountability_System',
      'Bought_Sheets_Mastery_Course',
      'Bought_Community_Basic',
      'Bought_Community_Vip'
    ].map(t => t.toLowerCase());

    const purchaseTags = (contactData.tags || []).map(t => t.toLowerCase()).filter(t => PURCHASE_TAGS.includes(t));

    // 2️⃣ Generate tags
    const generatedTags = [];
    if (formData.primaryGoal?.includes('Finances')) generatedTags.push('Goal_Financial_Clarity');
    if (formData.primaryGoal?.includes('Fitness') || formData.primaryGoal?.includes('Health')) generatedTags.push('Goal_Health_Fitness');
    if (formData.primaryGoal?.includes('Learning') || formData.primaryGoal?.includes('Growth')) generatedTags.push('Goal_Learning_Growth');
    if (formData.primaryGoal?.includes('Focus') || formData.primaryGoal?.includes('Productivity')) generatedTags.push('Goal_Productivity_Projects');

    if (formData.biggestFrustration?.includes('consistency')) generatedTags.push('Obstacle_Discipline_Consistency');
    if (formData.biggestFrustration?.includes('overwhelm')) generatedTags.push('Obstacle_Overwhelm');
    if (formData.biggestFrustration?.includes('accountability')) generatedTags.push('Obstacle_Accountability_Lacking');

    // 3️⃣ Gemini AI Analysis
    let analysis;
    let aiSuccess = true;
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      let model;
      try {
        model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-001' });
      } catch {
        model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
      }

      const prompt = `
Create a personalized habit blueprint for someone who wants to improve their ${formData.primaryGoal}.
Main challenge: ${formData.biggestFrustration}
30-day focus: ${formData.thirtyDayFocus}
Future vision: ${formData.futureVision}
Provide quick wins, 30-day plan, strategies for consistency, tracking methods.
`;
      const result = await model.generateContent(prompt);
      analysis = await result.response.text();

    } catch (err) {
      aiSuccess = false;
      analysis = `
# Personalized Habit Blueprint
## Quick Start Guide
Based on your goal to improve **${formData.primaryGoal}**:
- Week 1: Small wins
- Week 2: Increase gradually
- Week 3: Refine
- Week 4: Solidify
`;
    }

    // 4️⃣ Upload to R2
    let reportUrl;
    let storageSuccess = true;
    try {
      const reportData = {
        reportId: contactId,
        contactId,
        email,
        formData,
        analysis,
        generatedTags,
        purchaseTags,
        generatedAt: new Date().toISOString(),
        htmlContent: convertToProperHTML(analysis)
      };
      const jsonContent = JSON.stringify(reportData, null, 2);
      const r2Url = `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${process.env.R2_BUCKET_NAME}/reports/${contactId}/report.json`;
      const contentHash = crypto.createHash('sha256').update(jsonContent).digest('hex');

      const r2Res = await fetch(r2Url, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${process.env.R2_ACCESS_KEY_ID}`,
          'Content-Type': 'application/json',
          'x-amz-content-sha256': contentHash
        },
        body: jsonContent
      });

      if (!r2Res.ok) throw new Error(await r2Res.text());
      reportUrl = r2Url;

    } catch (err) {
      console.error('R2 upload failed:', err);
      storageSuccess = false;
      reportUrl = `https://ai.habitmasterysystem.com/report/${contactId}`;
    }

    // 5️⃣ Final JSON response
    return res.status(200).json({
      success: true,
      action: 'analysis_complete',
      reportId: contactId,
      steps: { tagGeneration: true, aiAnalysis: aiSuccess, storage: storageSuccess },
      reportUrl,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error('Orchestrator error:', err);
    return res.status(500).json({ error: err.message });
  }
}
