import React, { useState, useEffect } from 'react'
import { Search, Radar, Zap, CheckCircle2, Loader2 } from 'lucide-react'

export default function ScanningAnimation({ searchProvider = 'tavily' }) {
    const [progressStep, setProgressStep] = useState(0)

    const providerNames = {
        tavily: 'Tavily Search',
        perplexity: 'Perplexity AI',
        websearch: 'WebSearchAPI',
        exa: 'Exa.ai',
        you: 'You.com'
    }

    const providerName = providerNames[searchProvider] || 'Search Engine'

    const steps = [
        { message: "Initializing Agent...", duration: 800 },
        { message: `Connecting to ${providerName}...`, duration: 1500 },
        { message: "Connection Established", duration: 1000, success: true },
        { message: "Gathering Intelligence...", duration: 2000 },
        { message: "Analyzing Market Data...", duration: 2000 },
        { message: "Synthesizing Report...", duration: 3000 } // Stays here until done
    ]

    useEffect(() => {
        let currentStep = 0

        const runStep = () => {
            if (currentStep >= steps.length - 1) return

            setTimeout(() => {
                currentStep++
                setProgressStep(currentStep)
                runStep()
            }, steps[currentStep].duration)
        }

        runStep()
    }, [searchProvider])

    const currentStepData = steps[progressStep]

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px 20px',
            minHeight: '400px'
        }}>
            {/* Radar Container */}
            <div style={{
                position: 'relative',
                width: '200px',
                height: '200px',
                marginBottom: '2rem'
            }} className="radar-container">
                {/* Outer pulse rings */}
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '180px',
                    height: '180px',
                    border: '2px solid rgba(59, 130, 246, 0.3)',
                    borderRadius: '50%',
                    animation: 'pulse-ring 2s ease-in-out infinite'
                }} />

                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '140px',
                    height: '140px',
                    border: '2px solid rgba(59, 130, 246, 0.4)',
                    borderRadius: '50%',
                    animation: 'pulse-ring 2s ease-in-out infinite 0.5s'
                }} />

                {/* Center circle */}
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '100px',
                    height: '100px',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 30px rgba(59, 130, 246, 0.5)'
                }}>
                    <Radar size={40} color="white" />
                </div>

                {/* Scanning beam */}
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: '2px',
                    height: '90px',
                    background: 'linear-gradient(to top, rgba(59, 130, 246, 0), rgba(59, 130, 246, 0.8))',
                    transformOrigin: 'bottom center',
                    animation: 'radar-scan 3s linear infinite'
                }} />

                {/* Data points */}
                {[...Array(6)].map((_, i) => (
                    <div
                        key={i}
                        style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            width: '6px',
                            height: '6px',
                            background: '#10b981',
                            borderRadius: '50%',
                            transform: `translate(-50%, -50%) rotate(${i * 60}deg) translateY(-${40 + i * 10}px)`,
                            animation: `data-stream 2s ease-in-out infinite ${i * 0.3}s`,
                            boxShadow: '0 0 10px rgba(16, 185, 129, 0.8)'
                        }}
                    />
                ))}
            </div>

            {/* Status text */}
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    justifyContent: 'center'
                }}>
                    {currentStepData.success ? (
                        <CheckCircle2 size={24} style={{ color: '#10b981' }} />
                    ) : (
                        <Loader2 size={20} className="spin" style={{ color: '#3b82f6' }} />
                    )}
                    {currentStepData.message}
                </h3>

                {/* Progress Bar */}
                <div style={{
                    width: '200px',
                    height: '4px',
                    background: '#e2e8f0',
                    borderRadius: '2px',
                    marginTop: '0.5rem',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        height: '100%',
                        background: '#3b82f6',
                        width: `${((progressStep + 1) / steps.length) * 100}%`,
                        transition: 'width 0.5s ease-out'
                    }} />
                </div>

                <p style={{
                    color: 'var(--text-secondary)',
                    fontSize: '0.95rem',
                    maxWidth: '400px',
                    lineHeight: '1.5',
                    marginTop: '0.5rem'
                }}>
                    Analyzing market intelligence, competitor movements, and regulatory updates...
                </p>

                {/* Progress indicators */}
                <div style={{
                    display: 'flex',
                    gap: '1rem',
                    marginTop: '1rem',
                    justifyContent: 'center',
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Zap size={14} style={{ color: progressStep >= 2 ? '#10b981' : '#94a3b8' }} />
                        {providerName}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Zap size={14} style={{ color: '#3b82f6' }} />
                        Gemini Analysis
                    </div>
                </div>
            </div>
        </div>
    )
}
