import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function Report() {
  const router = useRouter();
  const { id } = router.query;
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) {
      const fetchReport = async () => {
        try {
          console.log('Fetching report for ID:', id);
          const response = await fetch(`/api/get-report?id=${id}`);
          const data = await response.json();
          
          if (data.success) {
            console.log('Report found:', data.report);
            setReportData(data.report);
          } else {
            setError('Report not found: ' + (data.error || 'Unknown error'));
          }
        } catch (error) {
          console.error('Error fetching report:', error);
          setError('Failed to load report: ' + error.message);
        } finally {
          setLoading(false);
        }
      };

      fetchReport();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner">📊</div>
        <h2>Loading Your Personalized Report...</h2>
        <p>Please wait while we retrieve your AI analysis...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>⚠️ Error Loading Report</h2>
        <p>{error}</p>
        <p>Please try going back and generating a new report.</p>
      </div>
    );
  }

  return (
    <div className="report-container">
      <header className="report-header">
        <h1>📊 Your Personalized AI Report</h1>
        <p>Created for: <strong>{reportData.userName || 'Valued User'}</strong></p>
        <p>Generated on: {new Date(reportData.timestamp).toLocaleDateString()}</p>
      </header>
      
      <div className="report-content">
        {/* ACTUAL AI CONTENT WILL DISPLAY HERE */}
        <div className="ai-content-section">
          <h2>🎯 Your Personalized Analysis</h2>
          <div className="ai-text-content">
            {reportData.content ? (
              reportData.content.split('\n').map((paragraph, index) => (
                paragraph.trim() ? <p key={index}>{paragraph}</p> : <br key={index} />
              ))
            ) : (
              <p>No content available for this report.</p>
            )}
          </div>
        </div>
        
        <div className="cta-section">
          <h3>🚀 Ready to Implement These Insights?</h3>
          <p>Get personalized coaching to turn these recommendations into real results</p>
          <a href="https://your-ghl-funnel-link.com" className="cta-button">
            Book Your Strategy Session
          </a>
          <p className="small-note">Limited spots available - Book now!</p>
        </div>
      </div>

      <style jsx>{`
        .loading-container, .error-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-align: center;
          padding: 2rem;
        }
        
        .error-container {
          background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
        }
        
        .spinner {
          font-size: 4rem;
          margin-bottom: 1rem;
          animation: bounce 2s infinite;
        }
        
        .report-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
        }
        
        .report-header {
          text-align: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 3rem 2rem;
          border-radius: 15px;
          margin-bottom: 2rem;
        }
        
        .report-header h1 {
          margin: 0 0 1rem 0;
          font-size: 2.5rem;
        }
        
        .ai-content-section {
          background: #f8f9fa;
          padding: 2rem;
          margin: 1.5rem 0;
          border-radius: 10px;
          border-left: 5px solid #667eea;
        }
        
        .ai-text-content p {
          margin-bottom: 1rem;
          white-space: pre-line;
        }
        
        .ai-text-content br {
          margin-bottom: 1rem;
          display: block;
          content: "";
        }
        
        .cta-section {
          text-align: center;
          background: #e8f5e8;
          padding: 2.5rem;
          border-radius: 15px;
          margin-top: 2rem;
          border: 2px solid #28a745;
        }
        
        .cta-button {
          display: inline-block;
          background: #28a745;
          color: white;
          padding: 1rem 2rem;
          text-decoration: none;
          border-radius: 8px;
          font-weight: bold;
          font-size: 1.1rem;
          margin-top: 1rem;
          transition: transform 0.2s;
        }
        
        .cta-button:hover {
          transform: translateY(-2px);
          background: #218838;
        }
        
        .small-note {
          font-size: 0.9rem;
          color: #666;
          margin-top: 1rem;
        }
        
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}
