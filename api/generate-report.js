import { Redis } from '@upstash/redis';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Redis with your Vercel KV environment variables
const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  try {
    const { formData } = req.body;
    console.log('Received form data:', formData);
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // Use the correct model name
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash-001",
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 800,
      }
    });

    const prompt = `Create a detailed, personalized analysis report based on this form submission: ${JSON.stringify(formData)}. Provide actionable insights and recommendations. Format the response in clear paragraphs.`;

    console.log('Calling Gemini API...');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiText = response.text();
    console.log('AI response received, length:', aiText.length);

    const reportId = generateReportId();
    console.log('Generated report ID:', reportId);

    // ✅ STORE IN REDIS (not in memory)
    await redis.set(reportId, JSON.stringify({
      content: aiText,
      userName: formData.name,
      timestamp: new Date().toISOString()
    }));

    const reportUrl = `https://${req.headers.host}/report?id=${reportId}`;
    console.log('Report URL:', reportUrl);
    
    // Send email with report link
    console.log('Attempting to send email to:', formData.email);
    const emailResult = await sendEmailNotification(formData.email, reportUrl, aiText, formData.name);
    console.log('Email result:', emailResult);

    res.json({ 
      success: true, 
      report: aiText,
      reportUrl: reportUrl,
      reportId: reportId,
      emailSent: emailResult
    });
    
  } catch (error) {
    console.error('Error in generate-report:', error);
    res.json({ 
      success: false, 
      error: error.message 
    });
  }
}

// Email notification function
async function sendEmailNotification(userEmail, reportUrl, aiReport, userName) {
  console.log('Starting email send process...');
  console.log('RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY);
  
  // For testing, use Resend's test domain
  const fromEmail = 'onboarding@resend.dev';
  
  // Create email preview (first 200 characters)
  const emailPreview = aiReport.substring(0, 200) + (aiReport.length > 200 ? '...' : '');
  
  const emailData = {
    from: `AI Report System <${fromEmail}>`,
    to: userEmail,
    subject: `Your Personalized AI Report is Ready!`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 14px 28px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
            .preview { background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; font-style: italic; border-radius: 5px; }
            .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🎉 Your AI Report is Ready!</h1>
          </div>
          <div class="content">
            <p>Hello <strong>${userName || 'there'}</strong>,</p>
            
            <p>Your personalized AI analysis has been completed and is now available for you to view.</p>
            
            <div class="preview">
              <strong>Quick Preview:</strong><br>
              ${emailPreview}
            </div>
            
            <p><strong>View your complete detailed report with personalized recommendations:</strong></p>
            
            <div style="text-align: center;">
              <a href="${reportUrl}" class="button">📊 View Your Full Report</a>
            </div>
            
            <p>Or copy and paste this link in your browser:<br>
            <a href="${reportUrl}">${reportUrl}</a></p>
            
            <div class="footer">
              <p><strong>Best regards,</strong><br>Your AI Analysis Team</p>
              <p><small>This is an automated message. Please do not reply to this email.</small></p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Hello ${userName || 'there'}! Your personalized AI report is ready. View it here: ${reportUrl}`
  };

  try {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    
    if (!RESEND_API_KEY) {
      console.error('❌ RESEND_API_KEY is not set!');
      return { success: false, error: 'RESEND_API_KEY not configured' };
    }

    console.log('Sending request to Resend API...');
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify(emailData)
    });

    console.log('Resend API response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ Resend API error:', errorData);
      return { success: false, error: `API error: ${response.status}`, details: errorData };
    }

    const result = await response.json();
    console.log('✅ Email sent successfully to:', userEmail);
    console.log('Resend response:', result);
    
    return { success: true, data: result };
    
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return { success: false, error: error.message };
  }
}

function generateReportId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
