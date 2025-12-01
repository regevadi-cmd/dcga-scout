import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Download, Compass, Check, Mail } from 'lucide-react'

export default function ReportViewer({ report, onDeepDive, deepDiveCache = {} }) {
    const [showExportModal, setShowExportModal] = React.useState(false)
    const [exportLoading, setExportLoading] = React.useState(false)
    const [selectedSections, setSelectedSections] = React.useState({
        "Executive Summary": true,
        "Partner Updates": true,
        "Competitive Intelligence": true,
        "Regulatory Radar": true,
        "Industry Analysis": true
    })

    const handleExport = async () => {
        setExportLoading(true)
        try {
            const activeSections = Object.keys(selectedSections).filter(k => selectedSections[k])
            const timestamp = new Date().toLocaleString('en-US', {
                month: 'long', day: 'numeric', year: 'numeric',
                hour: 'numeric', minute: 'numeric', hour12: true
            })

            const BACKEND_URL = import.meta.env.VITE_API_URL || ''
            const API_BASE = `${BACKEND_URL}/api`

            const response = await fetch(`${API_BASE}/generate_pdf`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    report_text: report,
                    sections: activeSections,
                    timestamp: timestamp
                })
            })

            if (!response.ok) throw new Error("Failed to generate PDF")

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `DCGA_Scout_Report_${new Date().toISOString().split('T')[0]}.pdf`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
            setShowExportModal(false)
        } catch (error) {
            console.error("Export failed:", error)
            alert("Failed to export PDF")
        } finally {
            setExportLoading(false)
        }
    }

    // Pre-process the report to convert tags into special links
    // This ensures they are parsed correctly regardless of context (bold, blockquote, etc.)
    const processedReport = React.useMemo(() => {
        if (!report) return ''
        let content = report

        // CRITICAL: Sort by length DESCENDING to prevent "Validation" from breaking "Sales Validation"
        const tags = ['Sales Validation', 'Opportunity', 'Risk', 'Threat', 'Validation']

        // Strategy:
        // 1. Find lines containing "Theta Lake Take"
        // 2. Inside those lines, replace tags (bracketed or not) with badge links
        // 3. Handle standalone [Tag] brackets elsewhere

        const tagsPattern = tags.join('|')

        // 1. Process "Theta Lake Take" lines
        content = content.replace(/((?:>|(?:\*+)|(?:\s*))Theta Lake Take:.*?)(\n|$)/gi, (line, prefix, suffix) => {
            // Match:
            // Group 1: Prefix (space, *, /, comma, or start of line)
            // Group 2: Tag WITH brackets (e.g. [Sales Validation])
            // Group 3: Tag WITHOUT brackets (e.g. Sales Validation)
            // Lookahead: Suffix (space, *, /, comma, or end of line)
            const tokenRegex = new RegExp(`(^|[\\s\\*,\\/])(?:(?:\\[(${tagsPattern})\\])|(${tagsPattern}))(?=$|[\\s\\*,\\/\\]])`, 'gi')

            return line.replace(tokenRegex, (match, p1, tagInBrackets, tagNoBrackets) => {
                const tag = tagInBrackets || tagNoBrackets
                // Always return just the badge link, preserving the prefix
                // This fixes the double-bracket issue: [Tag] -> [Tag](badge:Tag)
                // CRITICAL: Must encodeURIComponent because markdown links cannot contain spaces
                return `${p1}[${tag}](badge:${encodeURIComponent(tag)})`
            }) + suffix
        })

        // 2. Handle standalone brackets "[Tag]" anywhere else
        // This catches tags that weren't in a "Theta Lake Take" line
        const bracketRegex = new RegExp(`\\[(${tagsPattern})\\](?!\\(badge:)`, 'gi')
        content = content.replace(bracketRegex, (match, t) => `[${t}](badge:${encodeURIComponent(t)})`)

        return content
    }, [report])

    return (
        <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                <h3>Intelligence Report</h3>
                <button
                    style={{
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-primary)',
                        padding: '0.5rem 1rem',
                        borderRadius: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.9rem',
                        cursor: 'pointer'
                    }}
                    onClick={() => setShowExportModal(true)}
                >
                    <Download size={16} />
                    Export PDF
                </button>
            </div>

            <div className="markdown-content" style={{ padding: '0 1rem' }}>
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                        h1: ({ node, ...props }) => <h1 style={{ fontSize: '1.8rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginTop: '1.5rem', color: 'var(--text-primary)' }} {...props} />,
                        h2: ({ node, ...props }) => <h2 style={{ fontSize: '1.4rem', color: 'var(--accent-primary)', marginTop: '1.5rem', marginBottom: '0.75rem' }} {...props} />,
                        ul: ({ node, ...props }) => <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem', color: 'var(--text-primary)' }} {...props} />,
                        li: ({ node, children, ...props }) => {
                            // Extract text content from children for deep dive (recursively)
                            const extractText = (child) => {
                                if (typeof child === 'string') return child
                                if (typeof child === 'number') return String(child)
                                if (React.isValidElement(child) && child.props.children) {
                                    return extractText(child.props.children)
                                }
                                if (Array.isArray(child)) {
                                    return child.map(extractText).join('')
                                }
                                return ''
                            }

                            let textContent = extractText(children).trim()

                            // Truncate to 300 chars for deep dive (backend limit is 400)
                            if (textContent.length > 300) {
                                textContent = textContent.substring(0, 300).trim() + '...'
                            }

                            const isDone = deepDiveCache[textContent] !== undefined

                            return (
                                <li style={{ marginBottom: '0.5rem', lineHeight: '1.6', display: 'flex', alignItems: 'flex-start', gap: '8px', position: 'relative', color: 'var(--text-primary)' }} {...props}>
                                    <span style={{ flex: 1 }}>{children}</span>
                                    {onDeepDive && textContent && (
                                        <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                                            <button
                                                onClick={() => onDeepDive(textContent)}
                                                className="deep-dive-btn"
                                                style={{
                                                    background: isDone
                                                        ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                                                        : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                                    border: 'none',
                                                    color: 'white',
                                                    cursor: 'pointer',
                                                    padding: '4px 8px',
                                                    borderRadius: '6px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 600,
                                                    boxShadow: isDone
                                                        ? '0 2px 8px rgba(16, 185, 129, 0.3)'
                                                        : '0 2px 8px rgba(59, 130, 246, 0.3)',
                                                    transition: 'all 0.2s',
                                                    transform: 'scale(1)'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.transform = 'scale(1.05)'
                                                    e.currentTarget.style.boxShadow = isDone
                                                        ? '0 4px 12px rgba(16, 185, 129, 0.5)'
                                                        : '0 4px 12px rgba(59, 130, 246, 0.5)'
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.transform = 'scale(1)'
                                                    e.currentTarget.style.boxShadow = isDone
                                                        ? '0 2px 8px rgba(16, 185, 129, 0.3)'
                                                        : '0 2px 8px rgba(59, 130, 246, 0.3)'
                                                }}
                                                title={isDone ? "View cached deep dive" : "Deep Dive into this topic"}
                                            >
                                                {isDone ? <Check size={12} /> : <Compass size={12} />}
                                                <span style={{ fontSize: '0.7rem' }}>{isDone ? 'Done' : 'Dive'}</span>
                                            </button>
                                        </div>
                                    )}
                                </li>
                            )
                        },
                        p: ({ node, ...props }) => <p style={{ lineHeight: '1.6', marginBottom: '1rem', color: 'var(--text-primary)' }} {...props} />,
                        strong: ({ node, ...props }) => <strong style={{ color: 'var(--text-primary)', fontWeight: 700 }} {...props} />,

                        // Custom Link Renderer for Badges
                        a: ({ node, href, children, ...props }) => {
                            if (href && href.startsWith('badge:')) {
                                const type = decodeURIComponent(href.replace('badge:', ''))
                                let bg = '#64748b' // Default Slate
                                if (type.includes('Sales')) bg = '#8b5cf6' // Violet
                                if (type.includes('Opportunity')) bg = '#10b981' // Emerald
                                if (type.includes('Risk')) bg = '#f59e0b' // Amber
                                if (type.includes('Threat')) bg = '#ef4444' // Red

                                return (
                                    <span style={{
                                        background: bg,
                                        color: 'white',
                                        padding: '0.15rem 0.5rem',
                                        borderRadius: '0.25rem',
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                        marginRight: '0.25rem',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                        display: 'inline-block',
                                        transform: 'translateY(-1px)',
                                        textDecoration: 'none'
                                    }}>
                                        {children}
                                    </span>
                                )
                            }
                            return <a href={href} style={{ color: 'var(--accent-primary)', textDecoration: 'none' }} {...props}>{children}</a>
                        },

                        blockquote: ({ node, ...props }) => (
                            <blockquote
                                style={{
                                    borderLeft: '4px solid #8b5cf6', // Violet border
                                    background: 'rgba(139, 92, 246, 0.1)', // Violet tint
                                    margin: '1rem 0 1.5rem 1rem',
                                    padding: '1rem',
                                    borderRadius: '0 0.5rem 0.5rem 0',
                                    color: 'var(--text-secondary)',
                                    fontStyle: 'italic'
                                }}
                                {...props}
                            />
                        ),
                    }}
                >
                    {processedReport}
                </ReactMarkdown>
            </div>

            {/* Export Modal */}
            {
                showExportModal && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 1000
                    }}>
                        <div style={{
                            background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '1rem',
                            width: '400px', maxWidth: '90%', border: '1px solid var(--border-color)'
                        }}>
                            <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Export Report</h3>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <p style={{ marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Select sections to include:</p>
                                {Object.keys(selectedSections).map(section => (
                                    <label key={section} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', cursor: 'pointer', color: 'var(--text-primary)' }}>
                                        <input
                                            type="checkbox"
                                            checked={selectedSections[section]}
                                            onChange={(e) => setSelectedSections(prev => ({ ...prev, [section]: e.target.checked }))}
                                            style={{ accentColor: 'var(--accent-primary)' }}
                                        />
                                        {section}
                                    </label>
                                ))}
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <button
                                    onClick={() => setShowExportModal(false)}
                                    style={{
                                        background: 'transparent', border: '1px solid var(--border-color)',
                                        color: 'var(--text-secondary)', padding: '0.5rem 1rem', borderRadius: '0.5rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleExport}
                                    disabled={exportLoading}
                                    style={{
                                        background: 'var(--accent-primary)', border: 'none',
                                        color: 'white', padding: '0.5rem 1rem', borderRadius: '0.5rem',
                                        cursor: 'pointer', opacity: exportLoading ? 0.7 : 1,
                                        display: 'flex', alignItems: 'center', gap: '0.5rem'
                                    }}
                                >
                                    {exportLoading ? 'Generating...' : 'Export PDF'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    )
}
