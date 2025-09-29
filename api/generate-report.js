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
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 800,
      }
    });

    const prompt = `Create a detailed, personalized analysis report based on this form submission: ${JSON.stringify(formData)}. Provide actionable insights and recommendations. Format the response in clear paragraphs.`;

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
  // For testing, use Resend's test domain
  const fromEmail = 'onboarding@resend.dev'; // This works without domain verification
  
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
            .preview { background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; font-style: italic; }
            .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; }
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
              ${aiReport.split('\n').slice(0, 3).map(line => line.trim()).filter(line => line.length > 0).join('<br>')}...
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
      console.log('RESEND_API_KEY not set - email would have been sent');
      return;
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify(emailData)
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Email API error:', errorData);
      // Don't fail the entire request if email fails
      return;
    }
    
    console.log('✅ Email sent successfully to:', userEmail);
  } catch (error) {
    console.error('Error sending email:', error);
    // Don't fail the entire request if email fails
  }
}

function generateReportId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
