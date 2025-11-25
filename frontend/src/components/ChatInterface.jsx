import React, { useState } from 'react'
import { MessageCircle, Send, X } from 'lucide-react'

export default function ChatInterface({ reportContext, onClose }) {
    const [messages, setMessages] = useState([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSend = async () => {
        if (!input.trim()) return

        const userMessage = { role: 'user', content: input }
        setMessages(prev => [...prev, userMessage])
        setInput('')
        setLoading(true)

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    report_context: reportContext,
                    user_message: input
                })
            })
            const data = await response.json()
            setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
        } catch (error) {
            console.error('Chat error:', error)
            setMessages(prev => [...prev, { role: 'assistant', content: 'Error: Could not get response.' }])
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '400px',
            height: '500px',
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1000
        }}>
            {/* Header */}
            <div style={{
                padding: '16px',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                borderRadius: '12px 12px 0 0'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MessageCircle size={20} />
                    <span style={{ fontWeight: 600 }}>Scout Chat</span>
                </div>
                <button onClick={onClose} style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer'
                }}>
                    <X size={20} />
                </button>
            </div>

            {/* Messages */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
            }}>
                {messages.length === 0 && (
                    <div style={{ textAlign: 'center', color: '#9ca3af', marginTop: '40px' }}>
                        Ask me anything about the report!
                    </div>
                )}
                {messages.map((msg, idx) => (
                    <div key={idx} style={{
                        alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                        maxWidth: '80%',
                        padding: '10px 14px',
                        borderRadius: '12px',
                        background: msg.role === 'user' ? '#667eea' : '#f3f4f6',
                        color: msg.role === 'user' ? 'white' : '#1f2937',
                        fontSize: '14px',
                        lineHeight: '1.5'
                    }}>
                        {msg.content}
                    </div>
                ))}
                {loading && (
                    <div style={{ alignSelf: 'flex-start', color: '#9ca3af', fontSize: '14px' }}>
                        Thinking...
                    </div>
                )}
            </div>

            {/* Input */}
            <div style={{
                padding: '16px',
                borderTop: '1px solid #e5e7eb',
                display: 'flex',
                gap: '8px'
            }}>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Type your question..."
                    style={{
                        flex: 1,
                        padding: '10px 14px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '14px',
                        outline: 'none'
                    }}
                />
                <button onClick={handleSend} disabled={loading} style={{
                    padding: '10px 16px',
                    background: '#667eea',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1
                }}>
                    <Send size={18} />
                </button>
            </div>
        </div>
    )
}
