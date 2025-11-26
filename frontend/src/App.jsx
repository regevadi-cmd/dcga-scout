import { useState, useRef } from 'react'
import ConfigPanel from './components/ConfigPanel'
import ReportViewer from './components/ReportViewer'
import ScanningAnimation from './components/ScanningAnimation'
import DeepDiveModal from './components/DeepDiveModal'
import { ShieldAlert, X, Volume2, FileText } from 'lucide-react'
import versionData from './version.json'

function App() {
    const [loading, setLoading] = useState(false)
    const [report, setReport] = useState(null)
    const [deepDiveTopic, setDeepDiveTopic] = useState(null)
    const [deepDiveCache, setDeepDiveCache] = useState({}) // Cache deep dive results
    const [audioUrl, setAudioUrl] = useState(null)
    const [audioLoading, setAudioLoading] = useState(false)
    const [showAbout, setShowAbout] = useState(false)
    const [searchProvider, setSearchProvider] = useState('tavily')
    const [useMockData, setUseMockData] = useState(false)
    const [searchMode, setSearchMode] = useState('deep')
    const audioRef = useRef(null)

    const handleRunScout = async (config) => {
        setLoading(true)
        setReport(null)
        try {
            const fullConfig = {
                ...config,
                searchProvider,
                useMockData,
                searchMode
            }
            const response = await fetch('/api/run', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(fullConfig),
            })
            const data = await response.json()
            setReport(data.report)
        } catch (error) {
            console.error("Failed to run scout:", error)
            alert("Failed to generate report. Please check that the backend is running.")
        } finally {
            setLoading(false)
        }
    }

    const handleGenerateAudio = async () => {
        if (!report) return
        setAudioLoading(true)
        setAudioUrl(null)
        try {
            console.log('Generating audio...')
            const response = await fetch('/api/audio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ report_text: report })
            })
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }
            const blob = await response.blob()
            const url = URL.createObjectURL(blob)
            setAudioUrl(url)
            console.log('Audio generated successfully!')
        } catch (error) {
            console.error('Error generating audio:', error)
            alert('Failed to generate audio. Check console for details.')
        } finally {
            setAudioLoading(false)
        }
    }

    const handleSaveDeepDive = (topic, data) => {
        setDeepDiveCache(prev => ({
            ...prev,
            [topic]: data
        }))
    }

    return (
        <div className="container">
            <header className="header-container">
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
                        <h1 style={{ fontSize: '1.8rem', letterSpacing: '-0.025em', background: 'linear-gradient(to right, #0f172a, #475569)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>DCGA Scout</h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.1rem' }}>Market Intelligence & Sales Enablement</p>
                    </div>
                </div>

                <button
                    onClick={() => setShowAbout(true)}
                    className="about-button"
                >
                    About
                </button>
            </header>

            {/* About Modal */}
            {showAbout && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(15, 23, 42, 0.5)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1rem'
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '1rem',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                        maxWidth: '28rem',
                        width: '100%',
                        padding: '1.5rem',
                        border: '1px solid #e2e8f0'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ padding: '0.5rem', backgroundColor: '#e0e7ff', borderRadius: '0.5rem' }}>
                                    <ShieldAlert size={24} color="#4f46e5" />
                                </div>
                                <div>
                                    <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>DCGA Scout</h2>
                                    <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>Market Intelligence Agent</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowAbout(false)}
                                style={{ padding: '0.25rem', cursor: 'pointer', background: 'none', border: 'none', color: '#94a3b8' }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #f1f5f9' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                                    <span style={{ color: '#64748b' }}>Version</span>
                                    <span style={{ fontWeight: 500, color: '#0f172a' }}>{versionData.version} (Build {versionData.buildNumber})</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                                    <span style={{ color: '#64748b' }}>Build Date</span>
                                    <span style={{ fontWeight: 500, color: '#0f172a' }}>{versionData.buildDate}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginTop: '0.5rem', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem' }}>
                                    <span style={{ color: '#64748b' }}>Search Engine</span>
                                    <select
                                        value={searchProvider}
                                        onChange={(e) => setSearchProvider(e.target.value)}
                                        style={{ padding: '0.25rem', borderRadius: '0.25rem', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                                    >
                                        <option value="tavily">Tavily (Default)</option>
                                        <option value="perplexity">Perplexity AI</option>
                                        <option value="websearch">WebSearchAPI.ai</option>
                                        <option value="exa">Exa.ai</option>
                                        <option value="you">You.com</option>
                                    </select>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginTop: '0.5rem', alignItems: 'center' }}>
                                    <span style={{ color: '#64748b' }}>Search Mode</span>
                                    <select
                                        value={searchMode}
                                        onChange={(e) => setSearchMode(e.target.value)}
                                        style={{ padding: '0.25rem', borderRadius: '0.25rem', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                                    >
                                        <option value="deep">Deep (Standard)</option>
                                        <option value="fast">Fast (Cheaper)</option>
                                    </select>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginTop: '0.5rem', alignItems: 'center' }}>
                                    <span style={{ color: '#64748b' }}>Use Mock Data</span>
                                    <input
                                        type="checkbox"
                                        checked={useMockData}
                                        onChange={(e) => setUseMockData(e.target.checked)}
                                        style={{ cursor: 'pointer' }}
                                    />
                                </div>
                            </div>

                            <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: '1.5' }}>
                                DCGA Scout is an advanced AI agent designed to track market shifts, competitor moves, and regulatory changes in the Digital Communications Governance & Archiving space.
                            </p>

                            <div style={{ paddingTop: '1rem', borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
                                <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>
                                    © {new Date().getFullYear()} Theta Lake. Confidential & Proprietary.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ marginBottom: '2rem' }}>
                <ConfigPanel onRun={handleRunScout} loading={loading} />
            </div>

            {/* Action Bar - Audio Briefing */}
            {report && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'white',
                    padding: '1rem',
                    borderRadius: '0.75rem',
                    border: '1px solid var(--border-color)',
                    marginBottom: '1.5rem',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <button
                            onClick={handleGenerateAudio}
                            disabled={audioLoading || audioUrl}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.5rem 1rem',
                                borderRadius: '0.5rem',
                                border: '1px solid ' + (audioUrl ? '#86efac' : '#e2e8f0'),
                                background: audioUrl ? '#f0fdf4' : 'white',
                                color: audioUrl ? '#15803d' : '#475569',
                                cursor: (audioLoading || audioUrl) ? 'default' : 'pointer',
                                fontWeight: 500,
                                transition: 'all 0.2s'
                            }}
                        >
                            {audioLoading ? (
                                <>
                                    <div className="spinner" style={{ width: 16, height: 16, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                                    Generating...
                                </>
                            ) : audioUrl ? (
                                <>
                                    <div style={{ width: 8, height: 8, background: '#22c55e', borderRadius: '50%' }} />
                                    Audio Ready
                                </>
                            ) : (
                                <>
                                    <Volume2 size={18} />
                                    Audio Briefing
                                </>
                            )}
                        </button>

                        {audioUrl && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', animation: 'fadeIn 0.5s ease-out' }}>
                                <audio
                                    ref={audioRef}
                                    controls
                                    src={audioUrl}
                                    onLoadedMetadata={(e) => {
                                        e.currentTarget.playbackRate = 1.25
                                    }}
                                    style={{ height: 32, width: 240 }}
                                />
                                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                    Generated by Google TTS
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <main className="report-section" style={{ maxWidth: '900px', margin: '0 auto' }}>
                {loading ? (
                    <div className="card">
                        <ScanningAnimation searchProvider={searchProvider} />
                    </div>
                ) : report ? (
                    <ReportViewer
                        report={report}
                        onDeepDive={(topic) => setDeepDiveTopic(topic)}
                        deepDiveCache={deepDiveCache}
                    />
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

            {/* Modals */}
            {deepDiveTopic && (
                <DeepDiveModal
                    initialTopic={deepDiveTopic}
                    onClose={() => setDeepDiveTopic(null)}
                    cachedData={deepDiveCache[deepDiveTopic]}
                    onSaveCache={(data) => handleSaveDeepDive(deepDiveTopic, data)}
                    searchProvider={searchProvider}
                />
            )}
        </div>
    )
}

export default App
