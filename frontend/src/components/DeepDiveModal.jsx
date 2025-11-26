import React, { useState, useEffect } from 'react'
import { Search, X, Loader2, Send, MessageCircle } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function DeepDiveModal({ onClose, initialTopic = '', cachedData = null, onSaveCache, searchProvider = 'tavily' }) {
    const [topic, setTopic] = useState(initialTopic)
    const [result, setResult] = useState(cachedData?.result || null)
    const [loading, setLoading] = useState(false)
    const [messages, setMessages] = useState(cachedData?.messages || [])
    const [chatInput, setChatInput] = useState('')
    const [chatLoading, setChatLoading] = useState(false)

    // Auto-run deep dive if initialTopic is provided and no cache
    useEffect(() => {
        if (initialTopic && !cachedData) {
            handleDeepDive()
        }
    }, [initialTopic])

    const handleDeepDive = async () => {
        if (!topic.trim()) return

        setLoading(true)
        setResult(null)
        setMessages([]) // Clear chat when new deep dive

        try {
            const response = await fetch('/api/deep_dive', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topic: topic.trim(),
                    searchProvider: searchProvider
                })
            })

            if (!response.ok) {
                throw new Error('HTTP error! status: ' + response.status)
            }

            const data = await response.json()
            setResult(data.summary)

            // Save to cache
            if (onSaveCache) {
                onSaveCache(topic, { result: data.summary, messages: [] })
            }
        } catch (error) {
            console.error('Deep dive error:', error)
            setResult('Error: Could not perform deep dive. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleChatSend = async () => {
        if (!chatInput.trim() || !result) return

        const userMessage = { role: 'user', content: chatInput }
        setMessages(prev => [...prev, userMessage])
        setChatInput('')
        setChatLoading(true)

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    report_context: 'Deep Dive on "' + topic + '":\n\n' + result,
                    user_message: chatInput
                })
            })
            const data = await response.json()
            const newMessages = [...messages, { role: 'assistant', content: data.response }]
            setMessages(newMessages)

            // Update cache with new messages
            if (onSaveCache) {
                onSaveCache(topic, { result, messages: newMessages })
            }
        } catch (error) {
            console.error('Chat error:', error)
            setMessages(prev => [...prev, { role: 'assistant', content: 'Error: Could not get response.' }])
        } finally {
            setChatLoading(false)
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
                maxWidth: '800px',
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
                        <Search size={24} color="#3b82f6" />
                        <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-primary)' }}>
                            Deep Dive Research
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
                    <label style={{
                        display: 'block',
                        marginBottom: '8px',
                        color: 'var(--text-secondary)',
                        fontSize: '0.9rem',
                        fontWeight: 600
                    }}>
                        Research Topic
                    </label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input
                            type="text"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleDeepDive()}
                            placeholder="e.g., SEC WhatsApp enforcement, Microsoft Teams compliance..."
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
                            onClick={handleDeepDive}
                            disabled={loading || !topic.trim()}
                            style={{
                                padding: '12px 24px',
                                background: loading ? '#9ca3af' : '#3b82f6',
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
                                    Researching...
                                </>
                            ) : (
                                <>
                                    <Search size={18} />
                                    Research
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
                    {result ? (
                        <>
                            {/* Deep Dive Result */}
                            <div style={{
                                background: 'var(--bg-primary)',
                                padding: '20px',
                                borderRadius: '8px',
                                border: '1px solid var(--border-color)',
                                lineHeight: '1.7',
                                color: 'var(--text-primary)',
                                fontSize: '0.95rem'
                            }}>
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        h1: ({ node, ...props }) => <h1 style={{ fontSize: '1.5rem', marginTop: '1.5rem', marginBottom: '0.75rem', fontWeight: 700, color: '#1e293b' }} {...props} />,
                                        h2: ({ node, ...props }) => <h2 style={{ fontSize: '1.25rem', color: '#2563eb', marginTop: '1.5rem', marginBottom: '0.75rem', fontWeight: 600 }} {...props} />,
                                        h3: ({ node, ...props }) => <h3 style={{ fontSize: '1.1rem', marginTop: '1rem', marginBottom: '0.5rem', fontWeight: 600, color: '#334155' }} {...props} />,
                                        ul: ({ node, ...props }) => <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem', listStyleType: 'disc' }} {...props} />,
                                        ol: ({ node, ...props }) => <ol style={{ paddingLeft: '1.5rem', marginBottom: '1rem', listStyleType: 'decimal' }} {...props} />,
                                        li: ({ node, ...props }) => <li style={{ marginBottom: '0.5rem', paddingLeft: '0.25rem' }} {...props} />,
                                        p: ({ node, ...props }) => <p style={{ marginBottom: '1rem' }} {...props} />,
                                        strong: ({ node, ...props }) => <strong style={{ color: '#0f172a', fontWeight: 600 }} {...props} />,
                                        a: ({ node, ...props }) => <a style={{ color: '#2563eb', textDecoration: 'underline', textUnderlineOffset: '2px' }} {...props} />,
                                        code: ({ node, inline, ...props }) => inline
                                            ? <code style={{ background: '#f1f5f9', color: '#0f172a', padding: '2px 6px', borderRadius: '4px', fontSize: '0.9em', fontFamily: 'monospace' }} {...props} />
                                            : <code style={{ display: 'block', background: '#f8fafc', color: '#334155', padding: '16px', borderRadius: '8px', overflowX: 'auto', fontSize: '0.9em', border: '1px solid #e2e8f0', fontFamily: 'monospace', margin: '1rem 0' }} {...props} />,
                                        blockquote: ({ node, ...props }) => (
                                            <blockquote
                                                style={{
                                                    borderLeft: '4px solid #cbd5e1',
                                                    paddingLeft: '1rem',
                                                    marginLeft: 0,
                                                    marginRight: 0,
                                                    marginBottom: '1rem',
                                                    color: '#64748b',
                                                    fontStyle: 'italic'
                                                }}
                                                {...props}
                                            />
                                        )
                                    }}
                                >
                                    {result}
                                </ReactMarkdown>
                            </div>

                            {/* Chat Messages */}
                            {messages.length > 0 && (
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '12px',
                                    marginTop: '8px'
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        color: 'var(--text-secondary)',
                                        fontSize: '0.9rem',
                                        fontWeight: 600
                                    }}>
                                        <MessageCircle size={16} />
                                        Follow-up Discussion
                                    </div>
                                    {messages.map((msg, idx) => (
                                        <div key={idx} style={{
                                            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                            maxWidth: '80%',
                                            padding: '10px 14px',
                                            borderRadius: '12px',
                                            background: msg.role === 'user' ? '#3b82f6' : 'var(--bg-primary)',
                                            color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
                                            border: msg.role === 'user' ? 'none' : '1px solid var(--border-color)',
                                            fontSize: '0.95rem',
                                            lineHeight: '1.5'
                                        }}>
                                            {msg.content}
                                        </div>
                                    ))}
                                    {chatLoading && (
                                        <div style={{ alignSelf: 'flex-start', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                            Thinking...
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    ) : (
                        <div style={{
                            textAlign: 'center',
                            color: 'var(--text-secondary)',
                            padding: '40px 20px'
                        }}>
                            <Search size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
                            <p>Enter a topic above to perform in-depth research using Tavily and Gemini.</p>
                            <p style={{ fontSize: '0.85rem', marginTop: '8px' }}>
                                After the research, you can ask follow-up questions to dive deeper.
                            </p>
                        </div>
                    )}
                </div>

                {/* Chat Input (only show after result) */}
                {result && (
                    <div style={{
                        padding: '16px',
                        borderTop: '1px solid var(--border-color)',
                        display: 'flex',
                        gap: '8px'
                    }}>
                        <input
                            type="text"
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleChatSend()}
                            placeholder="Ask a follow-up question..."
                            style={{
                                flex: 1,
                                padding: '10px 14px',
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px',
                                background: 'var(--bg-primary)',
                                color: 'var(--text-primary)',
                                fontSize: '0.95rem',
                                outline: 'none'
                            }}
                        />
                        <button onClick={handleChatSend} disabled={chatLoading || !chatInput.trim()} style={{
                            padding: '10px 16px',
                            background: chatLoading ? '#9ca3af' : '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: chatLoading ? 'not-allowed' : 'pointer'
                        }}>
                            <Send size={18} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
