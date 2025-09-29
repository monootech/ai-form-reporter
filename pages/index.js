export default function Home() {
  return (
    <div className="container">
      <h1>Get Personalized AI Feedback</h1>
      <form id="feedbackForm">
        <div className="form-group">
          <label htmlFor="name">Your Name:</label>
          <input type="text" id="name" name="name" required />
        </div>
        
        <div className="form-group">
          <label htmlFor="goals">What are your main goals?</label>
          <textarea id="goals" name="goals" rows="3" required></textarea>
        </div>
        
        <div className="form-group">
          <label htmlFor="challenges">What challenges are you facing?</label>
          <textarea id="challenges" name="challenges" rows="3" required></textarea>
        </div>
        
        <div className="form-group">
          <label htmlFor="email">Email for report link:</label>
          <input type="email" id="email" name="email" required />
        </div>
        
        <button type="submit" id="submitBtn">Generate My AI Report</button>
      </form>
      
      <div id="loading" className="loading hidden">
        <p>🤖 AI is analyzing your responses and creating your personalized report...</p>
      </div>
      
      <div id="result" className="result hidden">
        <h2>✅ Your Report is Ready!</h2>
        <p>Your personalized AI report has been generated.</p>
        <a id="reportLink" href="#" target="_blank" className="report-link">
          View Your AI Report
        </a>
      </div>

      <style jsx>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .container {
          max-width: 600px;
          margin: 0 auto;
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
          padding: 40px;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        h1 {
          text-align: center;
          margin-bottom: 30px;
          color: #2c3e50;
        }

        .form-group {
          margin-bottom: 20px;
        }

        label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #2c3e50;
        }

        input, textarea {
          width: 100%;
          padding: 12px;
          border: 2px solid #e1e8ed;
          border-radius: 6px;
          font-size: 16px;
          transition: border-color 0.3s;
          font-family: inherit;
        }

        input:focus, textarea:focus {
          outline: none;
          border-color: #667eea;
        }

        button {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s;
          font-family: inherit;
        }

        button:hover {
          transform: translateY(-2px);
        }

        .loading {
          text-align: center;
          padding: 30px;
        }

        .result {
          text-align: center;
          padding: 20px;
        }

        .report-link {
          display: inline-block;
          padding: 12px 24px;
          background: #28a745;
          color: white;
          text-decoration: none;
          border-radius: 6px;
          margin-top: 15px;
          font-weight: 600;
        }

        .hidden {
          display: none;
        }
      `}</style>

      <style jsx global>{`
        body {
          line-height: 1.6;
          color: #333;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          padding: 20px;
          margin: 0;
        }
      `}</style>

      <script dangerouslySetInnerHTML={{
        __html: `
          document.getElementById('feedbackForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitBtn = document.getElementById('submitBtn');
            const loading = document.getElementById('loading');
            const result = document.getElementById('result');
            
            // Show loading, hide form
            submitBtn.disabled = true;
            this.classList.add('hidden');
            loading.classList.remove('hidden');
            result.classList.add('hidden');
            
            // Collect form data
            const formData = {
              name: document.getElementById('name').value,
              goals: document.getElementById('goals').value,
              challenges: document.getElementById('challenges').value,
              email: document.getElementById('email').value,
              timestamp: new Date().toISOString()
            };
            
            try {
              // Call your Vercel API
              const response = await fetch('/api/generate-report', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ formData })
              });
              
              const data = await response.json();
              
              if (data.success) {
                // Show success with report link
                document.getElementById('reportLink').href = data.reportUrl;
                loading.classList.add('hidden');
                result.classList.remove('hidden');
              } else {
                throw new Error(data.error);
              }
              
            } catch (error) {
              alert('Error generating report: ' + error.message);
              // Reset form
              submitBtn.disabled = false;
              this.classList.remove('hidden');
              loading.classList.add('hidden');
            }
          });
        `
      }} />
    </div>
  )
}
