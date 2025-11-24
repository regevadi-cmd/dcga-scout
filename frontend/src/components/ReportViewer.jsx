import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Download, Compass, Check } from 'lucide-react'

export default function ReportViewer({ report, onDeepDive, deepDiveCache = {} }) {
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
                    onClick={() => window.open('/api/download_pdf', '_blank')}
                >
                    <Download size={16} />
                    Export PDF
                </button>
            </div>

            <div className="markdown-content" style={{ padding: '0 1rem' }}>
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                        h1: ({ node, ...props }) => <h1 style={{ fontSize: '1.8rem', borderBottom: '1px solid #334155', paddingBottom: '0.5rem', marginTop: '1.5rem' }} {...props} />,
                        h2: ({ node, ...props }) => <h2 style={{ fontSize: '1.4rem', color: '#60a5fa', marginTop: '1.5rem', marginBottom: '0.75rem' }} {...props} />,
                        ul: ({ node, ...props }) => <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }} {...props} />,
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
                                <li style={{ marginBottom: '0.5rem', lineHeight: '1.6', display: 'flex', alignItems: 'flex-start', gap: '8px', position: 'relative' }} {...props}>
                                    <span style={{ flex: 1 }}>{children}</span>
                                    {onDeepDive && textContent && (
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
                                                flexShrink: 0,
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
                                    )}
                                </li>
                            )
                        },
                        p: ({ node, ...props }) => <p style={{ lineHeight: '1.6', marginBottom: '1rem' }} {...props} />,
                        strong: ({ node, ...props }) => <strong style={{ color: '#f8fafc', fontWeight: 600 }} {...props} />,

                        // Custom Link Renderer for Badges
                        a: ({ node, href, children, ...props }) => {
                            if (href && href.startsWith('badge:')) {
                                const tagName = decodeURIComponent(href.replace('badge:', ''))
                                let bg = '#3b82f6' // Default Blue
                                if (tagName.match(/Risk|Threat/i)) bg = '#ef4444' // Red
                                if (tagName.match(/Opportunity/i)) bg = '#10b981' // Green
                                if (tagName.match(/Validation/i)) bg = '#8b5cf6' // Violet

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
                            return <a href={href} style={{ color: '#3b82f6', textDecoration: 'none' }} {...props}>{children}</a>
                        },

                        blockquote: ({ node, ...props }) => (
                            <blockquote
                                style={{
                                    borderLeft: '4px solid #8b5cf6', // Violet border
                                    background: 'rgba(139, 92, 246, 0.1)', // Violet tint
                                    margin: '1rem 0 1.5rem 1rem',
                                    padding: '1rem',
                                    borderRadius: '0 0.5rem 0.5rem 0',
                                    color: '#e2e8f0'
                                }}
                                {...props}
                            />
                        ),
                    }}
                >
                    {processedReport}
                </ReactMarkdown>
            </div>
        </div>
    )
}
