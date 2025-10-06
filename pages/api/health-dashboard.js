// FILE: pages/api/health-dashboard.js
export default async function handler(req, res) {
  const { contactId, email } = req.query;

  const logs = [];

  try {
    // Test 1: Basic API check
    logs.push({ step: "Health Check", status: "success", details: "API is running" });

    // Test 2: Environment variables
    const envCheck = {
      GEMINI_API_KEY: process.env.GEMINI_API_KEY ? "Set" : "Missing",
      GHL_API_KEY: process.env.GHL_API_KEY ? "Set" : "Missing", 
      R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID ? "Set" : "Missing"
    };
    logs.push({ step: "Environment Variables", status: "success", details: envCheck });

    // Test 3: Test orchestrator with validation
    if (contactId && email) {
      const testResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/orchestrator`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId, email, formData: {} })
      });
      
      const testResult = await testResponse.json();
      logs.push({ 
        step: "Orchestrator Validation", 
        status: testResult.valid ? "success" : "fail", 
        details: testResult 
      });
    }

    // Return HTML dashboard
    const html = `
      <html>
        <head>
          <title>Health Dashboard</title>
          <style>
            body { font-family: sans-serif; padding: 2rem; background: #f5f5f5; }
            .step { margin-bottom: 1rem; padding: 1rem; background: white; border-radius: 8px; }
            .success { border-left: 4px solid #10B981; }
            .fail { border-left: 4px solid #EF4444; }
            pre { background: #f8f8f8; padding: 1rem; overflow-x: auto; }
          </style>
        </head>
        <body>
          <h1>🚀 System Health Dashboard</h1>
          <p>Testing URL: <code>https://ai.habitmasterysystem.com/?contactId=${contactId}&email=${email}</code></p>
          
          ${logs.map(log => `
            <div class="step ${log.status}">
              <h3>${log.step} — <span style="color: ${log.status === 'success' ? '#10B981' : '#EF4444'}">${log.status.toUpperCase()}</span></h3>
              <pre>${JSON.stringify(log.details, null, 2)}</pre>
            </div>
          `).join('')}
          
          <div class="step">
            <h3>Next Steps</h3>
            <ul>
              <li>Set real GEMINI_API_KEY and GHL_API_KEY in environment variables</li>
              <li>Test form submission with valid contact data</li>
              <li>Check R2 bucket for uploaded reports</li>
            </ul>
          </div>
        </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html);

  } catch (error) {
    logs.push({ step: "Health Dashboard Error", status: "fail", details: error.message });
    
    res.setHeader('Content-Type', 'text/html');
    return res.status(500).send(`
      <html>
        <body>
          <h1>Health Dashboard Error</h1>
          <pre>${error.message}</pre>
        </body>
      </html>
    `);
  }
}
