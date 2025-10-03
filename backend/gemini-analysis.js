// Pipedream workflow: Gemini AI Analysis
// Trigger: HTTP API (from webhook-handler)
// Purpose: Generate AI analysis and save JSON to R2

import { GoogleGenerativeAI } from '@google/generative-ai';

export default defineComponent({
  async run({ steps, $ }) {
    const { contactId, formData, purchaseTags, overwrite = false } = steps.trigger.event.body;
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Generate tags from form data
    const generatedTags = generateTagsFromFormData(formData);
    
    // Create enhanced prompt with purchase context
    const prompt = createEnhancedPrompt(formData, purchaseTags, generatedTags);
    
    // Call Gemini AI
    const result = await model.generateContent(prompt);
    const analysis = result.response.text();

    // Structure report data
    const reportData = {
      reportId: generateReportId(contactId),
      contactId,
      formData,
      analysis,
      generatedTags,
      purchaseTags,
      generatedAt: new Date().toISOString(),
      htmlContent: convertAnalysisToHTML(analysis),
      recommendations: generateRecommendations(formData, purchaseTags)
    };

    // Save JSON to Cloudflare R2
    await saveToR2(
      `reports/${contactId}/report.json`,
      JSON.stringify(reportData, null, 2),
      'application/json'
    );

    // Trigger PDF generation
    await $send.http({
      method: 'POST',
      url: 'https://your-pipedream-pdf-workflow.pipedream.net',
      data: { contactId, reportData }
    });

    return {
      reportId: reportData.reportId,
      status: 'analysis_complete'
    };
  },
})

// Enhanced prompt creation (from our previous work)
function createEnhancedPrompt(formData, purchaseTags, generatedTags) {
  // ... use the enhanced prompt logic we developed earlier
  // Include purchaseTags to avoid recommending owned products
}

// Tag generation logic (from our previous work)  
function generateTagsFromFormData(formData) {
  // ... use the tag mapping logic we developed
}

function generateReportId(contactId) {
  return `report_${contactId}_${Date.now()}`;
}

function convertAnalysisToHTML(analysis) {
  // Convert markdown-like analysis to HTML
  return analysis
    .split('\n')
    .map(line => {
      if (line.startsWith('### ')) return `<h3 class="text-xl font-bold mt-6 mb-3">${line.slice(4)}</h3>`;
      if (line.startsWith('## ')) return `<h2 class="text-2xl font-bold mt-8 mb-4">${line.slice(3)}</h2>`;
      if (line.startsWith('# ')) return `<h1 class="text-3xl font-bold mt-10 mb-6">${line.slice(2)}</h1>`;
      if (line.startsWith('- ')) return `<li class="ml-4 mb-1">${line.slice(2)}</li>`;
      return `<p class="mb-4">${line}</p>`;
    })
    .join('');
}
