import { useState } from 'react'
import { Play, Loader2, Calendar } from 'lucide-react'

export default function ConfigPanel({ onRun, loading }) {
    const [timeRange, setTimeRange] = useState('7d')

    const handleSubmit = (e) => {
        e.preventDefault()
        onRun({ timeRange })
    }

    return (
        <div className="card config-panel">
            <div className="config-controls">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                    <Calendar size={18} />
                    <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Scan Period:</span>
                </div>
                <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    className="config-select"
                >
                    <option value="24h">Last 24 Hours (Real-time)</option>
                    <option value="7d">Last 7 Days (Tactical)</option>
                    <option value="14d">Last 2 Weeks</option>
                    <option value="30d">Last Month (Strategic)</option>
                </select>
            </div>

            <button
                onClick={handleSubmit}
                disabled={loading}
                className="run-button"
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
