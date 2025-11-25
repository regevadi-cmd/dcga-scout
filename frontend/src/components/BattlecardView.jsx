import React, { useState, useEffect } from 'react'
import { Shield, TrendingUp, AlertTriangle, Target } from 'lucide-react'

export default function BattlecardView() {
    const [cards, setCards] = useState({})
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchBattlecards()
    }, [])

    const fetchBattlecards = async () => {
        setLoading(true)
        try {
            console.log('Fetching battlecards...')
            const response = await fetch('/api/battlecards', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    competitors: ['Smarsh', 'Global Relay', 'Microsoft Purview']
                })
            })

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const data = await response.json()
            console.log('Battlecards data:', data)
            setCards(data.cards || {})
        } catch (error) {
            console.error('Error fetching battlecards:', error)
            alert('Failed to load battlecards. Check console for details.')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                Loading battlecards...
            </div>
        )
    }

    return (
        <div style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px', color: '#1f2937' }}>
                Competitor Battlecards
            </h2>
            {Object.keys(cards).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                    No battlecards available. This may take 30-60 seconds to generate.
                    <br />
                    Check the browser console for errors.
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                    gap: '24px'
                }}>
                    {Object.entries(cards).map(([competitor, swot]) => (
                        <div key={competitor} style={{
                            background: 'white',
                            borderRadius: '12px',
                            padding: '24px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            border: '1px solid #e5e7eb'
                        }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: '#1f2937' }}>
                                {competitor}
                            </h3>

                            {swot.error ? (
                                <div style={{ color: '#ef4444', fontSize: '14px' }}>Error: {swot.error}</div>
                            ) : (
                                <>
                                    {/* Strengths */}
                                    <div style={{ marginBottom: '16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                            <Shield size={16} color="#10b981" />
                                            <span style={{ fontWeight: 600, color: '#10b981' }}>Strengths</span>
                                        </div>
                                        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#4b5563' }}>
                                            {swot.strengths?.map((item, idx) => (
                                                <li key={idx}>{item}</li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Weaknesses */}
                                    <div style={{ marginBottom: '16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                            <AlertTriangle size={16} color="#ef4444" />
                                            <span style={{ fontWeight: 600, color: '#ef4444' }}>Weaknesses</span>
                                        </div>
                                        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#4b5563' }}>
                                            {swot.weaknesses?.map((item, idx) => (
                                                <li key={idx}>{item}</li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Opportunities */}
                                    <div style={{ marginBottom: '16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                            <TrendingUp size={16} color="#3b82f6" />
                                            <span style={{ fontWeight: 600, color: '#3b82f6' }}>Opportunities</span>
                                        </div>
                                        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#4b5563' }}>
                                            {swot.opportunities?.map((item, idx) => (
                                                <li key={idx}>{item}</li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Threats */}
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                            <Target size={16} color="#f59e0b" />
                                            <span style={{ fontWeight: 600, color: '#f59e0b' }}>Threats</span>
                                        </div>
                                        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#4b5563' }}>
                                            {swot.threats?.map((item, idx) => (
                                                <li key={idx}>{item}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
