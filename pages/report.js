import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function Report() {
  const router = useRouter();
  const { id } = router.query;
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      // In a real app, you'd fetch the report data using the ID
      // For now, we'll show a beautiful placeholder
      setLoading(false);
    }
  }, [id]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner">📊</div>
        <h2>Loading Your Report...</h2>
      </div>
    );
  }

  return (
    <div className="report-container">
      <header className="report-header">
        <h1>📊 Your Personalized AI Report</h1>
        <p>Report ID: {id}</p>
      </header>
      
      <div className="report-content">
        <div className="report-section">
          <h2>🎯 Executive Summary</h2>
          <p>Your AI-generated insights and recommendations will appear here. This is a beautiful, professional report layout.</p>
        </div>
        
        <div className="report-section">
          <h2>💡 Key Recommendations</h2>
          <ul>
            <li>Personalized strategy based on your goals</li>
            <li>Actionable steps for immediate implementation</li>
            <li>Long-term growth opportunities</li>
          </ul>
        </div>
        
        <div className="cta-section">
          <h3>Ready to Take the Next Step?</h3>
          <p>Get personalized coaching and implementation support</p>
          <a href="https://your-ghl-funnel-link.com" className="cta-button">
            🚀 Book Your Strategy Session
          </a>
        </div>
      </div>

      <style jsx>{`
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-align: center;
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
        
        .report-section {
          background: #f8f9fa;
          padding: 2rem;
          margin: 1.5rem 0;
          border-radius: 10px;
          border-left: 5px solid #667eea;
        }
        
        .report-section h2 {
          color: #2c3e50;
          margin-top: 0;
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
        }
        
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}
