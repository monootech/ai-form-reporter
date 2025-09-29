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





// Add this function to send emails
async function sendReportEmail(email, reportUrl, userName) {
  // Using SendGrid (free tier available)
  const sgResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: email }] }],
      from: { email: 'noreply@yourdomain.com', name: 'AI Report System' },
      subject: `Your Personalized AI Report is Ready, ${userName}!`,
      content: [{
        type: 'text/html',
        value: `
          <h2>Your AI Report is Ready!</h2>
          <p>Hi ${userName},</p>
          <p>Your personalized AI analysis report has been generated.</p>
          <a href="${reportUrl}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Your Report
          </a>
          <p><small>This link will remain active for 30 days.</small></p>
        `
      }]
    })
  });
  return sgResponse.ok;
}
