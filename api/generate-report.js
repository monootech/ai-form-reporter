import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  try {
    const { formData } = req.body;
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // Use the correct model name
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash", // Updated model name
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 800,
      }
    });

    const prompt = `Create a detailed, personalized analysis report based on this form submission: ${JSON.stringify(formData)}. Provide actionable insights and recommendations in HTML format for email.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiText = response.text();

    const reportId = generateReportId();
    const reportUrl = `https://${req.headers.host}/report.html?id=${reportId}`;
    
    // Send email with report link
    await sendEmailNotification(formData.email, reportUrl, aiText, formData.name);

    res.json({ 
      success: true, 
      report: aiText,
      reportUrl: reportUrl,
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

// Email notification function
async function sendEmailNotification(userEmail, reportUrl, aiReport, userName) {
  const emailData = {
    to: userEmail,
    subject: `Your Personalized AI Report is Ready!`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 15px 0; }
            .preview { background: white; padding: 15px; border-left: 4px solid #667eea; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Your AI Report is Ready! 🎉</h1>
            </div>
            <div class="content">
              <p>Hello ${userName || 'there'},</p>
              <p>Your personalized AI analysis has been completed. Here's a quick preview:</p>
              
              <div class="preview">
                ${aiReport.split('\n').slice(0, 3).join('<br>')}...
              </div>
              
              <p>View your complete detailed report with personalized recommendations:</p>
              <a href="${reportUrl}" class="button">View Full Report</a>
              
              <p><strong>Report URL:</strong><br>
              <a href="${reportUrl}">${reportUrl}</a></p>
              
              <p>Best regards,<br>Your AI Analysis Team</p>
            </div>
          </div>
        </body>
      </html>
    `
  };

  // Send email using Resend API (recommended for Vercel)
  try {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify(emailData)
    });

    if (!response.ok) {
      throw new Error('Failed to send email');
    }
    
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
    // Don't fail the entire request if email fails
  }
}

function generateReportId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
