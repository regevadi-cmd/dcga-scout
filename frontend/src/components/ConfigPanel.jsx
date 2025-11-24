import { useState } from 'react'
import { Play, Loader2, Calendar } from 'lucide-react'

export default function ConfigPanel({ onRun, loading }) {
    const [timeRange, setTimeRange] = useState('7d')

    const handleSubmit = (e) => {
        e.preventDefault()
        onRun({ timeRange })
    }

    return (
        <div className="card" style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                    <Calendar size={18} />
                    <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Scan Period:</span>
                </div>
                <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '0.5rem',
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-primary)',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        minWidth: '200px'
                    }}
                >
                    <option value="7d">Last 7 Days (Tactical)</option>
                    <option value="14d">Last 2 Weeks</option>
                    <option value="30d">Last Month (Strategic)</option>
                </select>
            </div>

            <button
                onClick={handleSubmit}
                disabled={loading}
                style={{
                    background: loading ? 'var(--bg-primary)' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    color: 'white',
                    padding: '0.6rem 1.5rem',
                    borderRadius: '0.5rem',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s',
                    opacity: loading ? 0.7 : 1,
                    boxShadow: loading ? 'none' : '0 2px 4px rgba(37, 99, 235, 0.2)'
                }}
            >
                {loading ? (
                    <>
                        <Loader2 size={18} className="spin" />
                        Scanning...
                    </>
                ) : (
                    <>
                        <Play size={18} fill="currentColor" />
                        Run Scout
                    </>
                )}
            </button>
        </div>
    )
}
