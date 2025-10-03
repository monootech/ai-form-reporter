// Pipedream workflow: GHL Webhook Handler
// Trigger: HTTP API (Webhook)
// Purpose: Receive GHL purchase data and form submissions

export default defineComponent({
  async run({ steps, $ }) {
    const { body } = steps.trigger.event;
    
    // Validate incoming data
    if (!body.contactId || !body.formData) {
      await $end('Invalid data: missing contactId or formData');
    }

    const { contactId, formData, purchaseTags = [] } = body;

    // Check if report exists and is within 7 days
    const existingReport = await checkExistingReport(contactId);
    
    if (existingReport && isWithin7Days(existingReport.generatedAt)) {
      // Return existing report info
      return {
        statusCode: 200,
        body: {
          action: 'redirect_to_existing',
          reportId: existingReport.reportId,
          message: 'Report exists and is within 7 days'
        }
      };
    }

    // Trigger Gemini analysis workflow
    const analysisResult = await $send.http({
      method: 'POST',
      url: 'https://your-pipedream-analysis-workflow.pipedream.net',
      data: {
        contactId,
        formData,
        purchaseTags,
        overwrite: !!existingReport // True if regenerating after 7 days
      }
    });

    return {
      statusCode: 200,
      body: {
        action: 'processing_started',
        reportId: analysisResult.reportId,
        message: 'AI analysis started successfully'
      }
    };
  },
})

// Helper function to check R2 for existing report
async function checkExistingReport(contactId) {
  try {
    const response = await fetch(
      `https://<your-r2-bucket>.r2.dev/reports/${contactId}/report.json`
    );
    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch (error) {
    return null;
  }
}

// Helper function to check if timestamp is within 7 days
function isWithin7Days(timestamp) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  return new Date(timestamp) > sevenDaysAgo;
}
