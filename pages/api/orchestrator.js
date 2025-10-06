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
    // Validate client first
    const validationResult = await validateGHLClient(contactId, email);
    if (!validationResult.valid) {
      return res.status(400).json(validationResult);
    }

    const purchaseTags = validationResult.purchaseTags || [];

    // ===== STEP 3: GENERATE TAGS =====
    const generatedTags = generateTagsFromFormData(formData);
    
    // ===== STEP 4: CALL GEMINI AI =====
    const analysisResult = await generateGeminiAnalysis(formData, purchaseTags, generatedTags);
    
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
    const storageResult = await saveToR2(contactId, reportData);

    // ===== STEP 7: RETURN SUCCESS RESPONSE =====
    return res.status(200).json({
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
    });

  } catch (error) {
    console.error('Orchestrator error:', error);
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



/**
 * Validate GHL client with better email handling
 */
async function validateGHLClient(contactId, email) {
  try {
    const GHL_API_KEY = process.env.GHL_API_KEY;
    const API_VERSION = '2021-07-28';

    console.log('🔍 Validating GHL client:', { contactId, email });

    // Fetch contact from GHL
    const contactRes = await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${GHL_API_KEY}`,
        Version: API_VERSION,
        'Content-Type': 'application/json'
      }
    });

    console.log('📡 GHL Response status:', contactRes.status);

    if (!contactRes.ok) {
      const errorText = await contactRes.text();
      console.error('❌ GHL API error:', errorText);
      return { 
        valid: false, 
        error: `Contact not found in GHL (Status: ${contactRes.status})` 
      };
    }

    const contactData = await contactRes.json();
    console.log('📋 GHL Contact data:', {
      id: contactData.id,
      email: contactData.email,
      emailLowerCase: contactData.emailLowerCase,
      tags: contactData.tags
    });

    // Get email from contact data - try multiple fields
    const contactEmail = contactData.email || contactData.emailLowerCase || contactData.contactEmail;
    
    if (!contactEmail) {
      console.error('❌ No email found in contact data');
      return { 
        valid: false, 
        error: 'No email found in contact data' 
      };
    }

    // Improved email normalization
    const normalizeEmail = (emailStr) => {
      if (!emailStr) return '';
      return emailStr
        .toString()
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '') // Remove any spaces
        .replace(/\.(?=.*@)/g, '') // Remove dots in local part (gmail specific)
        .replace(/\+.*(?=@)/, ''); // Remove + aliases (gmail specific)
    };

    const normalizedContactEmail = normalizeEmail(contactEmail);
    const normalizedInputEmail = normalizeEmail(email);

    console.log('📧 Email comparison:', {
      input: email,
      normalizedInput: normalizedInputEmail,
      contact: contactEmail,
      normalizedContact: normalizedContactEmail,
      match: normalizedContactEmail === normalizedInputEmail
    });

    if (normalizedContactEmail !== normalizedInputEmail) {
      return { 
        valid: false, 
        error: `Email does not match contact. Contact email: ${contactEmail}, Provided: ${email}` 
      };
    }

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

    console.log('🏷️ Purchase tags found:', purchaseTags);

    return {
      valid: true,
      message: 'Client validated successfully',
      purchaseTags,
      contactEmail: contactEmail // Return actual email for debugging
    };

  } catch (error) {
    console.error('❌ GHL validation error:', error);
    return { 
      valid: false, 
      error: `Unable to validate client: ${error.message}` 
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
 * Generate AI analysis using Gemini
 */
async function generateGeminiAnalysis(formData, purchaseTags, generatedTags) {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Try different models
    let model;
    try {
      model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-001' });
    } catch {
      model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
    }

    // Limit output with maxTokens
    const generationConfig = {
      maxOutputTokens: 2000, // Limit to ~1500 words
      temperature: 0.7,
    };

    const prompt = `
Create a personalized habit blueprint for someone who wants to improve their ${formData.primaryGoal}.

Their main challenge: ${formData.biggestFrustration}
Their 30-day focus: ${formData.thirtyDayFocus}
Their future vision: ${formData.futureVision}

Please provide a comprehensive but practical blueprint with:
1. Quick wins for immediate progress
2. A specific 30-day implementation plan
3. Strategies for maintaining consistency
4. Recommended tracking methods

Keep it encouraging and actionable. Focus on practical steps.
Be concise and limit to approximately 1000 words.
    `;

    const result = await model.generateContent(prompt);
    const analysis = await result.response.text();

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
    console.error('Gemini AI error:', error);
    
    // Fallback analysis
    const fallbackAnalysis = `# Personalized Habit Blueprint for ${formData.primaryGoal}

## Quick Start Guide
Based on your goal to improve **${formData.primaryGoal}**, here's your action plan:

### Your Challenge
You mentioned: "${formData.biggestFrustration}"

### 30-Day Action Plan
**Week 1-2: Foundation Building**
- Start with small, consistent daily sessions
- Use simple tracking methods
- Identify what works for you

**Week 3-4: Consistency Building**  
- Gradually increase your efforts
- Implement accountability checks
- Refine your approach

## Success Tips
- Focus on consistency over perfection
- Celebrate small daily wins
- Adjust your approach weekly

You've got this! Start small and stay consistent.`;

    return {
      analysis: fallbackAnalysis,
      recommendations: {},
      aiSuccess: false
    };
  }
}

/**
 * Convert analysis to HTML
 */
function convertAnalysisToHTML(analysis) {
  return analysis
    .split('\n')
    .map(line => {
      if (line.startsWith('### ')) return `<h3 class="text-xl font-bold mt-6 mb-3 text-green-700">${line.slice(4)}</h3>`;
      if (line.startsWith('## ')) return `<h2 class="text-2xl font-bold mt-8 mb-4 text-green-800">${line.slice(3)}</h2>`;
      if (line.startsWith('# ')) return `<h1 class="text-3xl font-bold mt-10 mb-6 text-green-900">${line.slice(2)}</h1>`;
      if (line.startsWith('- ')) return `<li class="ml-4 mb-2">${line.slice(2)}</li>`;
      if (line.startsWith('**') && line.endsWith('**')) return `<strong class="font-bold">${line.slice(2, -2)}</strong>`;
      return `<p class="mb-4">${line}</p>`;
    })
    .join('');
}

/**
 * Save report to R2
 */
async function saveToR2(contactId, reportData) {
  try {
    const jsonContent = JSON.stringify(reportData, null, 2);
    const r2Url = `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${process.env.R2_BUCKET_NAME}/reports/${contactId}/report.json`;
    
    // Create SHA256 hash for R2 authentication
    const contentHash = crypto.createHash('sha256').update(jsonContent).digest('hex');
    
    const response = await fetch(r2Url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${process.env.R2_ACCESS_KEY_ID}`,
        'Content-Type': 'application/json',
        'x-amz-content-sha256': contentHash,
      },
      body: jsonContent
    });

    if (!response.ok) {
      throw new Error(`R2 upload failed: ${response.status} ${response.statusText}`);
    }

    return {
      storageSuccess: true,
      reportUrl: `${process.env.R2_PUBLIC_DOMAIN}/reports/${contactId}/report.json`
    };

  } catch (error) {
    console.error('R2 storage error:', error);
    return {
      storageSuccess: false,
      reportUrl: `https://ai.habitmasterysystem.com/report/${contactId}`
    };
  }
}
