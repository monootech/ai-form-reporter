import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  try {
    const { formData } = req.body;
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const model = genAI.getGenerativeModel({ 
      model: "gemini-pro",
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 800,
      }
    });

    const prompt = `Create a detailed, personalized analysis report based on this form submission: ${JSON.stringify(formData)}. Provide actionable insights and recommendations.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiText = response.text();

    // Generate a unique report ID
    const reportId = generateReportId();
    
    // Return both the AI response and the report URL
    res.json({ 
      success: true, 
      report: aiText,
      reportUrl: `https://${req.headers.host}/report.html?id=${reportId}`,
      reportId: reportId
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.json({ 
      success: false, 
      error: error.message 
    });
  }
}

function generateReportId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
