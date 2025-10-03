// Pipedream workflow: Email Sender via Resend
// Trigger: HTTP API (from pdf-generator)
// Purpose: Send email with report links

import { Resend } from 'resend';

export default defineComponent({
  async run({ steps, $ }) {
    const { contactId, reportData } = steps.trigger.event.body;
    
    const resend = new Resend(process.env.RESEND_API_KEY);

    const emailData = {
      from: 'Habit Mastery System <reports@mail.habitmasterysystem.com>',
      to: reportData.formData.email, // Assuming email is in formData
      subject: `🎯 Your Personalized AI Habit Blueprint is Ready!`,
      html: generateEmailHTML(contactId, reportData)
    };

    try {
      const result = await resend.emails.send(emailData);
      
      // Send tags to GHL for tracking
      await $send.http({
        method: 'POST',
        url: 'https://your-pipedream-ghl-webhook.pipedream.net',
        data: {
          contactId,
          tags: [...reportData.generatedTags, 'Submitted_AI_Report'],
          action: 'report_delivered'
        }
      });

      return { status: 'email_sent', emailId: result.id };
    } catch (error) {
      console.error('Email sending failed:', error);
      throw error;
    }
  },
})

function generateEmailHTML(contactId, reportData) {
  const reportUrl = `https://ai.habitmasterysystem.com/report/${contactId}`;
  const pdfUrl = `https://pub-<your-r2-subdomain>.r2.dev/reports/${contactId}/report.pdf`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Inter', sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10B981, #059669); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
        .cta-button { background: #10B981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px; }
        .secondary-button { background: white; color: #10B981; border: 2px solid #10B981; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎯 Your AI Habit Blueprint is Ready!</h1>
          <p>Personalized analysis based on your unique goals</p>
        </div>
        <div class="content">
          <h2>Congratulations!</h2>
          <p>Your <strong>Personalized AI Habit Blueprint™</strong> has been completed and is ready for review.</p>
          
          <p><strong>What's inside your blueprint:</strong></p>
          <ul>
            <li>Your unique Habit Archetype identification</li>
            <li>Custom 30-Day Implementation Roadmap</li>
            <li>Strategic template recommendations</li>
            <li>Advanced tracking systems and success metrics</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${reportUrl}" class="cta-button">👀 View Your Interactive Blueprint</a>
            <br>
            <a href="${pdfUrl}" class="secondary-button">📥 Download PDF Version</a>
          </div>
          
          <p><strong>Pro Tip:</strong> Start with the 30-day implementation roadmap - it's your step-by-step guide to habit mastery.</p>
          
          <p>We're excited to see you achieve your goals!</p>
          
          <div style="text-align: center; margin-top: 30px;">
            <p>To your success,<br><strong>The Habit Mastery System Team</strong></p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}
