import { useState } from 'react'
import ConfigPanel from './components/ConfigPanel'
import ReportViewer from './components/ReportViewer'
import { ShieldAlert, Search, FileText } from 'lucide-react'

function App() {
    const [loading, setLoading] = useState(false)
    const [report, setReport] = useState(null)

    const handleRunScout = async (config) => {
        setLoading(true)
        setReport(null)
        try {
            const response = await fetch('/api/run', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(config),
            })
            const data = await response.json()
            setReport(data.report)
        } catch (error) {
            console.error("Failed to run scout:", error)
            // Mock fallback for demo if backend isn't running
            setTimeout(() => {
                setReport(`# 🕵️ DCGA Scout Intelligence Report
*Period: Last 7 Days*

## 🚨 Immediate Action Required
* **Microsoft Graph API**: Deprecated the "Teams Export API v1". Engineering to review immediately.

## 📉 Competitor Weakness Watch
* **Smarsh (G2 Reviews)**: 2 users complained about "slow search" this period. Use this in competitive deals.

## 🏛️ Regulatory Tailwinds
* **SEC**: Fined Firm X $5M for WhatsApp usage.
`)
            }, 1500)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="container">
            <header style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        padding: '0.75rem',
                        borderRadius: '0.75rem',
                        display: 'flex',
                        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
                    }}>
                        <ShieldAlert size={32} color="white" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.8rem', letterSpacing: '-0.025em', background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>DCGA Scout</h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.1rem' }}>Market Intelligence & Sales Enablement</p>
                    </div>
                </div>
            </header>

            <div style={{ marginBottom: '2rem' }}>
                <ConfigPanel onRun={handleRunScout} loading={loading} />
            </div>

            <main className="report-section" style={{ maxWidth: '900px', margin: '0 auto' }}>
                {report ? (
                    <ReportViewer report={report} />
                ) : (
                    <div className="card" style={{
                        height: '400px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-secondary)',
                        borderStyle: 'dashed',
                        background: 'transparent'
                    }}>
                        <div style={{
                            background: 'var(--bg-secondary)',
                            padding: '1.5rem',
                            borderRadius: '50%',
                            marginBottom: '1.5rem',
                            border: '1px solid var(--border-color)'
                        }}>
                            <FileText size={40} style={{ opacity: 0.5, color: 'var(--accent-primary)' }} />
                        </div>
                        <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Ready to Scout</h3>
                        <p style={{ fontSize: '0.95rem' }}>Select a time period above and start the intelligence scan.</p>
                    </div>
                )}
            </main>
        </div>
    )
}

export default App
