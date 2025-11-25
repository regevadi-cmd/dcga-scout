import React, { useState } from 'react'
import { Mail, X, Loader2, Copy, Check } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

export default function SalesEmailModal({ onClose, insightText = '' }) {
    const [recipientName, setRecipientName] = useState('')
    const [emailDraft, setEmailDraft] = useState(null)
    const [loading, setLoading] = useState(false)
    const [copied, setCopied] = useState(false)

    const handleGenerateEmail = async () => {
        if (!recipientName.trim()) return

        setLoading(true)
        setEmailDraft(null)

        try {
            const response = await fetch('/api/draft_email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    insight_text: insightText,
                    recipient_name: recipientName
                })
            })

            if (!response.ok) {
                throw new Error('HTTP error! status: ' + response.status)
            }

            const data = await response.json()
            setEmailDraft(data.email)
        } catch (error) {
            console.error('Email generation error:', error)
            setEmailDraft('Error: Could not generate email. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleCopy = () => {
        if (emailDraft) {
            navigator.clipboard.writeText(emailDraft)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
        }} onClick={onClose}>
            <div style={{
                background: 'var(--bg-secondary)',
                borderRadius: '12px',
                maxWidth: '600px',
                width: '100%',
                maxHeight: '85vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                border: '1px solid var(--border-color)'
            }} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div style={{
                    padding: '20px',
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Mail size={24} color="#10b981" />
                        <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-primary)' }}>
                            Sales Co-Pilot
                        </h2>
                    </div>
                    <button onClick={onClose} style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        padding: '5px'
                    }}>
                        <X size={24} />
                    </button>
                </div>

                {/* Input Section */}
                <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)' }}>
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            color: 'var(--text-secondary)',
                            fontSize: '0.9rem',
                            fontWeight: 600
                        }}>
                            Based on Insight
                        </label>
                        <div style={{
                            padding: '12px',
                            background: 'var(--bg-primary)',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-primary)',
                            fontSize: '0.9rem',
                            maxHeight: '100px',
                            overflowY: 'auto',
                            fontStyle: 'italic'
                        }}>
                            "{insightText}"
                        </div>
                    </div>

                    <label style={{
                        display: 'block',
                        marginBottom: '8px',
                        color: 'var(--text-secondary)',
                        fontSize: '0.9rem',
                        fontWeight: 600
                    }}>
                        Recipient Name
                    </label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input
                            type="text"
                            value={recipientName}
                            onChange={(e) => setRecipientName(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleGenerateEmail()}
                            placeholder="e.g., John Doe"
                            style={{
                                flex: 1,
                                padding: '12px',
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px',
                                background: 'var(--bg-primary)',
                                color: 'var(--text-primary)',
                                fontSize: '1rem',
                                outline: 'none'
                            }}
                        />
                        <button
                            onClick={handleGenerateEmail}
                            disabled={loading || !recipientName.trim()}
                            style={{
                                padding: '12px 24px',
                                background: loading ? '#9ca3af' : '#10b981',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={18} className="spin" />
                                    Drafting...
                                </>
                            ) : (
                                <>
                                    <Mail size={18} />
                                    Draft Email
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Results Section */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px'
                }}>
                    {emailDraft ? (
                        <div style={{ position: 'relative' }}>
                            <div style={{
                                background: 'var(--bg-primary)',
                                padding: '20px',
                                borderRadius: '8px',
                                border: '1px solid var(--border-color)',
                                lineHeight: '1.6',
                                color: 'var(--text-primary)',
                                whiteSpace: 'pre-wrap'
                            }}>
                                <ReactMarkdown>{emailDraft}</ReactMarkdown>
                            </div>
                            <button
                                onClick={handleCopy}
                                style={{
                                    position: 'absolute',
                                    top: '10px',
                                    right: '10px',
                                    background: 'var(--bg-secondary)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '6px',
                                    padding: '6px',
                                    cursor: 'pointer',
                                    color: copied ? '#10b981' : 'var(--text-secondary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}
                                title="Copy to clipboard"
                            >
                                {copied ? <Check size={16} /> : <Copy size={16} />}
                            </button>
                        </div>
                    ) : (
                        <div style={{
                            textAlign: 'center',
                            color: 'var(--text-secondary)',
                            padding: '40px 20px'
                        }}>
                            <Mail size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
                            <p>Enter a recipient name to generate a tailored sales email.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
