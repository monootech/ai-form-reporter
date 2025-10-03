// Pipedream Workflow: Habit-Analysis-Orchestrator
// Combines: Webhook Handler + Gemini Analysis + Tag Generation
// Trigger: HTTP API (Webhook)
// Environment Variables Needed: 
//   GEMINI_API_KEY, R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_BUCKET_NAME, PUBLISHER_WORKFLOW_URL

export default defineComponent({
  async run({ steps, $ }) {
    const { body } = steps.trigger.event;
    
    // ===== STEP 1: VALIDATE INCOMING DATA =====
    if (!body.contactId || !body.formData) {
      await $end('Invalid data: missing contactId or formData');
      return;
    }

    const { contactId, formData, purchaseTags = [] } = body;

    try {
      // ===== STEP 2: CHECK FOR EXISTING REPORT (7-DAY LIMIT) =====
      const existingReport = await checkExistingReport(contactId);
      
      if (existingReport && isWithin7Days(existingReport.generatedAt)) {
        return {
          statusCode: 200,
          body: {
            action: 'redirect_to_existing',
            reportId: contactId,
            message: 'Report exists and is within 7 days'
          }
        };
      }

      // ===== STEP 3: GENERATE TAGS FROM FORM DATA =====
      const generatedTags = generateTagsFromFormData(formData);
      
      // ===== STEP 4: CALL GEMINI AI FOR ANALYSIS =====
      const analysisResult = await generateGeminiAnalysis(formData, purchaseTags, generatedTags);
      
      // ===== STEP 5: CREATE REPORT DATA STRUCTURE =====
      const reportData = {
        reportId: contactId,
        contactId,
        formData,
        analysis: analysisResult.analysis,
        generatedTags,
        purchaseTags,
        generatedAt: new Date().toISOString(),
        htmlContent: convertAnalysisToHTML(analysisResult.analysis),
        recommendations: analysisResult.recommendations
      };

      // ===== STEP 6: SAVE JSON TO CLOUDFLARE R2 =====
      await saveToR2(
        `reports/${contactId}/report.json`,
        JSON.stringify(reportData, null, 2),
        'application/json'
      );

      // ===== STEP 7: TRIGGER PUBLISHER WORKFLOW =====
      const publisherResponse = await $send.http({
        method: 'POST',
        url: process.env.PUBLISHER_WORKFLOW_URL,
        data: { 
          contactId, 
          reportData,
          action: 'generate_pdf_and_email'
        }
      });

      return {
        statusCode: 200,
        body: {
          action: 'analysis_complete',
          reportId: contactId,
          message: 'AI analysis completed and publisher triggered'
        }
      };

    } catch (error) {
      console.error('Orchestrator error:', error);
      return {
        statusCode: 500,
        body: { error: 'Analysis failed', details: error.message }
      };
    }
  },
})

// ===== HELPER FUNCTIONS =====

/**
 * Check if report exists in R2 and is within 7 days
 */
async function checkExistingReport(contactId) {
  try {
    const response = await fetch(
      `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${process.env.R2_BUCKET_NAME}/reports/${contactId}/report.json`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.R2_ACCESS_KEY_ID}`,
        }
      }
    );
    
    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch (error) {
    console.error('Error checking existing report:', error);
    return null;
  }
}

/**
 * Check if timestamp is within 7 days
 */
function isWithin7Days(timestamp) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  return new Date(timestamp) > sevenDaysAgo;
}

/**
 * Generate tags from form data for GHL segmentation
 */
function generateTagsFromFormData(formData) {
  const tags = [];

  // Goal Tags
  if (formData.primaryGoal?.includes('Finances')) tags.push('Goal_Financial_Clarity');
  if (formData.primaryGoal?.includes('Fitness') || formData.primaryGoal?.includes('Health')) tags.push('Goal_Health_Fitness');
  if (formData.primaryGoal?.includes('Learning') || formData.primaryGoal?.includes('Growth')) tags.push('Goal_Learning_Growth');
  if (formData.primaryGoal?.includes('Focus') || formData.primaryGoal?.includes('Productivity') || formData.primaryGoal?.includes('Projects')) {
    tags.push('Goal_Productivity_Projects');
  }

  // Obstacle Tags
  if (formData.biggestFrustration?.includes('consistency')) tags.push('Obstacle_Discipline_Consistency');
  if (formData.biggestFrustration?.includes('overwhelm') || formData.biggestFrustration?.includes('where to focus')) {
    tags.push('Obstacle_Clarity_Focus', 'Obstacle_Overwhelm');
  }
  if (formData.biggestFrustration?.includes('accountability')) tags.push('Obstacle_Accountability_Lacking', 'Obstacle_Lonely_Journey');
  if (formData.biggestFrustration?.includes('start strong')) tags.push('Obstacle_Perfectionism');

  // Emotional Tags
  if (formData.biggestFrustration?.includes('frustrat') || formData.biggestFrustration?.includes('struggle')) {
    tags.push('Emotional_Frustrated');
  }
  if (formData.futureVision && formData.futureVision.length > 10) tags.push('Emotional_Hopeful');
  if (formData.biggestFrustration?.includes('overwhelm')) tags.push('Emotional_Overwhelmed');
  if (formData.thirtyDayFocus && formData.thirtyDayFocus.length > 5) tags.push('Emotional_Determined');

  return [...new Set(tags)]; // Remove duplicates
}

/**
 * Generate AI analysis using Google Gemini
 */
async function generateGeminiAnalysis(formData, purchaseTags, generatedTags) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = createEnhancedPrompt(formData, purchaseTags, generatedTags);
  const result = await model.generateContent(prompt);
  const analysis = await result.response.text();

  const recommendations = generateRecommendations(formData, purchaseTags, generatedTags);

  return { analysis, recommendations };
}

/**
 * Create enhanced prompt for Gemini AI
 */
function createEnhancedPrompt(formData, purchaseTags, generatedTags) {
  const availableProducts = {
    templateVault: !purchaseTags.includes('Bought_Template_Vault'),
    accountabilitySystem: !purchaseTags.includes('Bought_Accountability_System'),
    sheetsCourse: !purchaseTags.includes('Bought_Sheets_Mastery_Course')
  };

  return `
You are a $500/hr habit formation expert analyzing a client's profile to create their Personalized AI Habit Blueprint.

CLIENT PROFILE:
Primary Goal: ${formData.primaryGoal}
Biggest Struggle: ${formData.biggestFrustration}
Areas to Track: ${formData.trackingAreas?.join(', ') || 'None'}
Accountability Style: ${formData.accountabilityStyle}
30-Day Focus: ${formData.thirtyDayFocus}
Future Vision: ${formData.futureVision}
Sheets Skill Level: ${formData.sheetsSkillLevel}

CREATE A COMPREHENSIVE HABIT BLUEPRINT FOLLOWING THIS STRUCTURE:

# PERSONALIZED AI HABIT BLUEPRINT

## 🎯 EXECUTIVE SUMMARY & HABIT ARCHETYPE
Identify their habit personality type and create an executive summary.

## 🔍 DEEP HABIT ANALYSIS
**Pattern Analysis:**
- Success triggers and failure patterns
- Hidden opportunities

**Psychological Profile:**
- Motivation style and consistency personality

## 🗓️ 30-DAY IMPLEMENTATION ROADMAP
Create a specific 4-week plan focused on their "${formData.thirtyDayFocus}"

## 🛠️ STRATEGIC RECOMMENDATIONS
${availableProducts.templateVault ? '**Include Template Vault recommendations**' : '**Client already owns Template Vault**'}
${availableProducts.accountabilitySystem ? '**Include Accountability System fit**' : '**Client already has Accountability System**'}

TONE: Professional, encouraging, expert-level but accessible.
STRUCTURE: Use markdown formatting with clear sections.
LENGTH: Comprehensive but scannable - approximately 1500 words.
  `;
}

/**
 * Generate product recommendations based on tags and purchases
 */
function generateRecommendations(formData, purchaseTags, generatedTags) {
  const recommendations = {};
  
  if (!purchaseTags.includes('Bought_Template_Vault') && generatedTags.some(tag => tag.startsWith('Goal_'))) {
    recommendations.templateVault = true;
  }
  
  if (!purchaseTags.includes('Bought_Accountability_System') && generatedTags.includes('Obstacle_Accountability_Lacking')) {
    recommendations.accountability = true;
  }
  
  if (!purchaseTags.includes('Bought_Sheets_Mastery_Course') && 
      (formData.sheetsSkillLevel?.includes('Beginner') || formData.sheetsSkillLevel?.includes('Intermediate'))) {
    recommendations.sheetsCourse = true;
  }
  
  return recommendations;
}

/**
 * Convert analysis text to HTML for web display
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
 * Save file to Cloudflare R2
 */
async function saveToR2(filePath, content, contentType) {
  const url = `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${process.env.R2_BUCKET_NAME}/${filePath}`;
  
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${process.env.R2_ACCESS_KEY_ID}`,
      'Content-Type': contentType,
    },
    body: content
  });

  if (!response.ok) {
    throw new Error(`R2 upload failed: ${response.statusText}`);
  }

  return { success: true, path: filePath };
}
