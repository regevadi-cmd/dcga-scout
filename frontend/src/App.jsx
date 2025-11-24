import { useState, useRef } from 'react'
import ConfigPanel from './components/ConfigPanel'
import ReportViewer from './components/ReportViewer'
import ScanningAnimation from './components/ScanningAnimation'
import DeepDiveModal from './components/DeepDiveModal'
import { ShieldAlert, Search, FileText, Volume2 } from 'lucide-react'

function App() {
    const [loading, setLoading] = useState(false)
    const [report, setReport] = useState(null)
    const [deepDiveTopic, setDeepDiveTopic] = useState(null)
    const [deepDiveCache, setDeepDiveCache] = useState({}) // Cache deep dive results
    const [audioUrl, setAudioUrl] = useState(null)
    const [audioLoading, setAudioLoading] = useState(false)
    const audioRef = useRef(null)

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

            {/* Action Bar - Audio Briefing */}
            {report && (
                <div style={{
                    display: 'flex',
                    gap: '1rem',
                    marginBottom: '2rem',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    flexWrap: 'wrap'
                }}>
                    {/* Audio Section - Button + Player */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        <button
                            onClick={handleGenerateAudio}
                            disabled={audioLoading || audioUrl}
                            style={{
                                background: audioUrl ? '#10b981' : (audioLoading ? '#9ca3af' : 'var(--accent-secondary)'),
                                color: 'white',
                                border: 'none',
                                padding: '0.5rem 1rem',
                                borderRadius: '0.5rem',
                                cursor: (audioLoading || audioUrl) ? 'not-allowed' : 'pointer',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                transition: 'all 0.2s',
                                opacity: audioUrl ? 0.9 : 1
                            }}
                        >
                            <Volume2 size={18} />
                            {audioLoading ? '⏳ Generating...' : (audioUrl ? '✅ Audio Ready' : '🎧 Generate Audio Briefing')}
                        </button>

                        {/* Inline Audio Player */}
                        {audioUrl && (
                            <audio
                                ref={audioRef}
                                controls
                                src={audioUrl}
                                onLoadedMetadata={() => {
                                    if (audioRef.current) {
                                        audioRef.current.playbackRate = 1.25
                                    }
                                }}
                                style={{
                                    height: '40px',
                                    borderRadius: '8px'
                                }}
                            />
                        )}
                    </div>
                </div>
            )}


            <main className="report-section" style={{ maxWidth: '900px', margin: '0 auto' }}>
                {loading ? (
                    <div className="card">
                        <ScanningAnimation />
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

            {/* Deep Dive Modal */}
            {deepDiveTopic && (
                <DeepDiveModal
                    initialTopic={deepDiveTopic}
                    cachedData={deepDiveCache[deepDiveTopic]}
                    onSaveCache={handleSaveDeepDive}
                    onClose={() => setDeepDiveTopic(null)}
                />
            )}
        </div>
    )
}

export default App
