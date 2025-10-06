// FILE: pages/api/orchestrator.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import crypto from 'crypto';

export default async function handler(req, res) {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return res.status(204)
      .setHeader('Access-Control-Allow-Origin', '*')
      .setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
      .setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
      .end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { contactId, email, formData } = req.body;

  try {
    // ===== STEP 1: VALIDATE CLIENT =====
    if (!contactId || !email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing contactId or email' 
      });
    }

    // If this is just validation (empty formData), validate and return
    if (!formData || Object.keys(formData).length === 0) {
      const validationResult = await validateGHLClient(contactId, email);
      return res.status(200).json(validationResult);
    }

    // ===== STEP 2: FULL PROCESSING =====
    console.log('🚀 Starting full processing for:', { contactId, email });

    // Validate client first
    const validationResult = await validateGHLClient(contactId, email);
    if (!validationResult.valid) {
      return res.status(400).json(validationResult);
    }

    const purchaseTags = validationResult.purchaseTags || [];

    // ===== STEP 3: GENERATE TAGS =====
    const generatedTags = generateTagsFromFormData(formData);
    console.log('🏷️ Generated tags:', generatedTags);
    
    // ===== STEP 4: CALL GEMINI AI =====
    console.log('🤖 Calling Gemini AI...');
    const analysisResult = await generateGeminiAnalysis(formData, purchaseTags, generatedTags);
    console.log('✅ Gemini analysis completed');
    
    // ===== STEP 5: CREATE REPORT DATA =====
    const reportData = {
      reportId: contactId,
      contactId,
      email,
      formData,
      analysis: analysisResult.analysis,
      generatedTags,
      purchaseTags,
      generatedAt: new Date().toISOString(),
      htmlContent: convertAnalysisToHTML(analysisResult.analysis),
      recommendations: analysisResult.recommendations,
      aiSuccess: analysisResult.aiSuccess
    };

    // ===== STEP 6: SAVE TO R2 =====
    console.log('💾 Saving to R2...');
    const storageResult = await saveToR2(contactId, reportData);
    console.log('✅ Storage result:', storageResult);

    // ===== STEP 7: RETURN SUCCESS RESPONSE =====
    const responseData = {
      success: true,
      action: 'analysis_complete',
      reportId: contactId,
      message: 'AI analysis completed successfully',
      steps: {
        tagGeneration: true,
        aiAnalysis: analysisResult.aiSuccess,
        storage: storageResult.storageSuccess
      },
      reportUrl: storageResult.reportUrl,
      timestamp: new Date().toISOString()
    };

    console.log('🎉 Returning success response');
    return res.status(200).json(responseData);

  } catch (error) {
    console.error('❌ Orchestrator error:', error);
    return res.status(500).json({
      success: false,
      error: 'Processing failed',
      details: error.message
    });
  }
}

// ===== HELPER FUNCTIONS =====

/**
 * Validate GHL client
 */
async function validateGHLClient(contactId, email) {
  try {
    const GHL_API_KEY = process.env.GHL_API_KEY;

    if (!GHL_API_KEY || GHL_API_KEY === 'GHL_API_KEY') {
      console.log('⚠️ Using mock GHL validation (no API key set)');
      return {
        valid: true,
        message: 'Mock validation - GHL API key not configured',
        purchaseTags: ['Bought_Main_Tracker'] // Mock purchase tag for testing
      };
    }

    console.log('🔍 Validating GHL client:', { contactId, email });

    // Fetch contact from GHL
    const contactRes = await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${GHL_API_KEY}`,
        Version: '2021-07-28',
        'Content-Type': 'application/json'
      }
    });

    if (!contactRes.ok) {
      console.log('❌ GHL contact not found, using mock validation');
      return {
        valid: true, // For testing, allow anyway
        message: 'GHL contact not found, but proceeding for testing',
        purchaseTags: []
      };
    }

    const contactData = await contactRes.json();
    
    // Extract purchase tags
    const PURCHASE_TAGS = [
      'Bought_Main_Tracker',
      'Bought_Template_Vault',
      'Bought_Accountability_System',
      'Bought_Sheets_Mastery_Course',
      'Bought_Community_Basic',
      'Bought_Community_Vip'
    ].map(t => t.toLowerCase());

    const purchaseTags = (contactData.tags || [])
      .map(t => t.toString().toLowerCase().trim())
      .filter(t => PURCHASE_TAGS.includes(t));

    console.log('✅ GHL validation successful, purchase tags:', purchaseTags);

    return {
      valid: true,
      message: 'Client validated successfully',
      purchaseTags
    };

  } catch (error) {
    console.error('❌ GHL validation error, using mock:', error);
    // For now, allow access even if GHL fails (for testing)
    return {
      valid: true,
      message: 'GHL validation failed, but proceeding for testing',
      purchaseTags: []
    };
  }
}

/**
 * Generate tags from form data
 */
function generateTagsFromFormData(formData) {
  const tags = [];

  // Goal Tags
  if (formData.primaryGoal?.includes('Finances')) tags.push('Goal_Financial_Clarity');
  if (formData.primaryGoal?.includes('Fitness') || formData.primaryGoal?.includes('Health')) tags.push('Goal_Health_Fitness');
  if (formData.primaryGoal?.includes('Learning') || formData.primaryGoal?.includes('Growth')) tags.push('Goal_Learning_Growth');
  if (formData.primaryGoal?.includes('Focus') || formData.primaryGoal?.includes('Productivity')) {
    tags.push('Goal_Productivity_Projects');
  }

  // Frustration Tags
  if (formData.biggestFrustration?.includes('consistency')) tags.push('Obstacle_Discipline_Consistency');
  if (formData.biggestFrustration?.includes('overwhelm')) tags.push('Obstacle_Overwhelm');
  if (formData.biggestFrustration?.includes('accountability')) tags.push('Obstacle_Accountability_Lacking');

  return [...new Set(tags)];
}

/**
 * Generate AI analysis using Gemini with character limits
 */
async function generateGeminiAnalysis(formData, purchaseTags, generatedTags) {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'GEMINI_API_KEY') {
      throw new Error('Gemini API key not configured');
    }

    // Use gemini-1.5-flash (most reliable)
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        maxOutputTokens: 1500, // Limit to ~1000 words
        temperature: 0.7,
      }
    });

    const prompt = `
Create a CONCISE personalized habit blueprint (MAX 800 words) for someone who wants to improve their ${formData.primaryGoal}.

CLIENT CONTEXT:
- Primary Goal: ${formData.primaryGoal}
- Biggest Challenge: ${formData.biggestFrustration}
- 30-Day Focus: ${formData.thirtyDayFocus}
- Future Vision: ${formData.futureVision}
- Purchase History: ${purchaseTags.join(', ') || 'None'}

REQUIREMENTS:
- Keep it UNDER 800 words total
- Focus on 3-5 most important actionable steps
- Include a simple 30-day implementation plan
- Provide specific strategies for their main challenge
- Make it practical and immediately usable

STRUCTURE:
1. Quick Wins (2-3 immediate actions)
2. 30-Day Roadmap (weekly breakdown)
3. Key Strategies for Success
4. Recommended Tools/Systems

Be direct, practical, and avoid fluff. Focus only on what will deliver results.
    `;

    console.log('📝 Sending prompt to Gemini...');
    const result = await model.generateContent(prompt);
    const analysis = await result.response.text();
    
    console.log('✅ Gemini response received, length:', analysis.length);

    // Generate recommendations
    const recommendations = {
      templateVault: !purchaseTags.includes('bought_template_vault') && generatedTags.some(tag => tag.startsWith('Goal_')),
      accountability: !purchaseTags.includes('bought_accountability_system') && generatedTags.includes('Obstacle_Accountability_Lacking')
    };

    return {
      analysis,
      recommendations,
      aiSuccess: true
    };

  } catch (error) {
    console.error('❌ Gemini AI error:', error);
    
    // Fallback analysis
    const fallbackAnalysis = `# Personalized Habit Blueprint for ${formData.primaryGoal}

## Quick Start Guide

### Your 30-Day Action Plan
**Week 1: Foundation**
- Start with 15-minute daily sessions
- Track progress in a simple notebook
- Identify your peak productivity times

**Week 2: Build Consistency**  
- Increase to 30-minute sessions
- Implement daily check-ins
- Adjust based on Week 1 learnings

**Week 3-4: Solidify Habits**
- Aim for 45-60 minute focused sessions
- Add weekly review sessions
- Celebrate small wins

### Key Success Strategies
- Focus on consistency over perfection
- Use time blocking for important tasks
- Review progress weekly and adjust
- Start small and build gradually

### Recommended Approach
Based on your goal to improve ${formData.primaryGoal}, focus on building one solid habit at a time. Your biggest opportunity is addressing "${formData.biggestFrustration}" through consistent daily practice.

Remember: Small, consistent actions create big results over time.`;

    return {
      analysis: fallbackAnalysis,
      recommendations: {},
      aiSuccess: false,
      error: error.message
    };
  }
}

/**
 * Convert analysis to HTML
 */
function convertAnalysisToHTML(analysis) {
  return `
    <div class="habit-blueprint">
      <div class="header">
        <h1>🎯 Personalized AI Habit Blueprint</h1>
        <p class="generated-date">Generated on ${new Date().toLocaleDateString()}</p>
      </div>
      <div class="content">
        ${analysis.split('\n').map(line => {
          if (line.startsWith('### ')) return `<h3>${line.slice(4)}</h3>`;
          if (line.startsWith('## ')) return `<h2>${line.slice(3)}</h2>`;
          if (line.startsWith('# ')) return `<h1>${line.slice(2)}</h1>`;
          if (line.startsWith('- ')) return `<li>${line.slice(2)}</li>`;
          if (line.startsWith('**') && line.endsWith('**')) return `<strong>${line.slice(2, -2)}</strong>`;
          return `<p>${line}</p>`;
        }).join('')}
      </div>
    </div>
  `;
}

/**
 * Save report to R2 with improved error handling
 */
async function saveToR2(contactId, reportData) {
  try {
    const jsonContent = JSON.stringify(reportData, null, 2);
    
    // Use the public R2 domain for simpler uploads
    const r2Url = `https://pub-5fd9b7e823f34897ac9194436fa60593.r2.dev/reports/${contactId}/report.json`;
    
    console.log('📤 Uploading to R2 URL:', r2Url);

    const response = await fetch(r2Url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: jsonContent
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ R2 upload failed:', errorText);
      throw new Error(`R2 upload failed: ${response.status} - ${errorText}`);
    }

    console.log('✅ R2 upload successful');
    return {
      storageSuccess: true,
      reportUrl: r2Url
    };

  } catch (error) {
    console.error('❌ R2 storage error:', error);
    return {
      storageSuccess: false,
      reportUrl: `https://ai.habitmasterysystem.com/report/${contactId}`,
      error: error.message
    };
  }
}
