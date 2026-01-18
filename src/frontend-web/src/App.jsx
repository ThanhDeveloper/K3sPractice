import { useState, useEffect } from 'react'

// API URL - same origin, Ingress route /api/* đến backend
// Browser gọi: http://localhost/api/server-information (Backend vẫn internal, không expose trực tiếp)
const API_URL = import.meta.env.VITE_API_URL || ''

function App() {
  const [serverData, setServerData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  const fetchServerInfo = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_URL}/api/server-information`)
      if (!response.ok) throw new Error('API request failed')
      const data = await response.json()
      setServerData(data)
      setLastRefresh(new Date())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchServerInfo()
    const interval = setInterval(fetchServerInfo, 5000) // Refresh every 5 seconds
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>K3s Microservices Demo</h1>
        <p style={styles.subtitle}>Frontend (React) → Backend (ASP.NET Core)</p>

        <div style={styles.apiInfo}>
          <span style={styles.label}>API Endpoint:</span>
          <code style={styles.code}>{API_URL}/api/server-information</code>
        </div>

        {loading && !serverData && (
          <div style={styles.loading}>Loading...</div>
        )}

        {error && (
          <div style={styles.error}>
            <strong>Error:</strong> {error}
            <br />
            <small>Make sure backend is running at {API_URL}</small>
          </div>
        )}

        {serverData && (
          <div style={styles.result}>
            <div style={styles.timeDisplay}>
              <div style={styles.utcTime}>{serverData.utc}</div>
              <div style={styles.timezone}>{serverData.timezone}</div>
            </div>

            <div style={styles.details}>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Timestamp:</span>
                <span style={styles.detailValue}>{serverData.timestamp}</span>
              </div>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Service:</span>
                <span style={styles.detailValue}>{serverData.service}</span>
              </div>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Version:</span>
                <span style={styles.detailValue}>{serverData.version}</span>
              </div>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Hostname:</span>
                <span style={styles.detailValue}>{serverData.hostname}</span>
              </div>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>GG Client ID:</span>
                <span style={styles.detailValue}>{serverData.gg_client_id}</span>
              </div>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Has Secret:</span>
                <span style={styles.detailValue}>{serverData.has_client_secret ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </div>
        )}

        <button style={styles.button} onClick={fetchServerInfo}>
          Refresh Now
        </button>

        <div style={styles.footer}>
          Last refresh: {lastRefresh.toLocaleTimeString()}
          {loading && <span style={styles.refreshing}> (refreshing...)</span>}
        </div>
      </div>

      <div style={styles.architecture}>
        <h3>Architecture</h3>
        <pre style={styles.diagram}>{`
┌─────────────────┐     ┌─────────────────┐
│   Frontend      │     │   Backend       │
│   (React)       │────▶│   (ASP.NET)     │
│   Port: 7000    │     │   Port: 7001    │
│   NodePort      │     │   ClusterIP     │
│   (External)    │     │   (Internal)    │
└─────────────────┘     └─────────────────┘
        `}</pre>
      </div>
    </div>
  )
}

const styles = {
  container: {
    padding: '20px',
    maxWidth: '800px',
    width: '100%',
  },
  card: {
    background: 'rgba(255,255,255,0.1)',
    borderRadius: '16px',
    padding: '40px',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255,255,255,0.2)',
  },
  title: {
    fontSize: '2rem',
    marginBottom: '8px',
    background: 'linear-gradient(90deg, #00d4ff, #7c3aed)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    color: '#888',
    marginBottom: '24px',
  },
  apiInfo: {
    background: 'rgba(0,0,0,0.3)',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '24px',
  },
  label: {
    color: '#888',
    marginRight: '8px',
  },
  code: {
    color: '#00d4ff',
    fontFamily: 'monospace',
  },
  loading: {
    textAlign: 'center',
    padding: '20px',
    color: '#888',
  },
  error: {
    background: 'rgba(255,0,0,0.2)',
    border: '1px solid rgba(255,0,0,0.3)',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '16px',
    color: '#ff6b6b',
  },
  result: {
    marginBottom: '24px',
  },
  timeDisplay: {
    textAlign: 'center',
    marginBottom: '24px',
  },
  utcTime: {
    fontSize: '3rem',
    fontWeight: 'bold',
    fontFamily: 'monospace',
    color: '#00d4ff',
  },
  timezone: {
    fontSize: '1.2rem',
    color: '#888',
  },
  details: {
    display: 'grid',
    gap: '12px',
  },
  detailItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 16px',
    background: 'rgba(0,0,0,0.2)',
    borderRadius: '8px',
  },
  detailLabel: {
    color: '#888',
  },
  detailValue: {
    color: '#fff',
    fontFamily: 'monospace',
  },
  button: {
    width: '100%',
    padding: '12px',
    fontSize: '1rem',
    background: 'linear-gradient(90deg, #00d4ff, #7c3aed)',
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  footer: {
    textAlign: 'center',
    marginTop: '16px',
    color: '#666',
    fontSize: '0.9rem',
  },
  refreshing: {
    color: '#00d4ff',
  },
  architecture: {
    marginTop: '24px',
    padding: '20px',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '12px',
  },
  diagram: {
    color: '#00d4ff',
    fontSize: '0.8rem',
    overflow: 'auto',
  },
}

export default App
