import { useState } from 'react';

export default function HealthDashboard() {
  const [logs, setLogs] = useState([]);
  const [running, setRunning] = useState(false);

  const testOrchestrator = async () => {
    setRunning(true);
    setLogs([]);
    try {
      const res = await fetch('/api/orchestrator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId: 'AZFoDKn2KDw8JpRBFKuK', // example contact
          email: 'mnnmetcacc@gmail.com',
          formData: {}
        })
      });

      const data = await res.json();
      setLogs(data.logs || []);
    } catch (err) {
      setLogs([{ step: 'Fetch orchestrator', status: 'FAIL', error: err.toString() }]);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '2rem' }}>
      <h1>Health Dashboard</h1>
      <button onClick={testOrchestrator} disabled={running} style={{ marginBottom: '1rem' }}>
        {running ? 'Running...' : 'Run Orchestrator Test'}
      </button>

      {logs.map((log, idx) => (
        <section key={idx} style={{ border: '1px solid #ddd', padding: '1rem', marginBottom: '1rem' }}>
          <h3>{log.step} — {log.status}</h3>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {JSON.stringify(log, null, 2)}
          </pre>
        </section>
      ))}
    </div>
  );
}
