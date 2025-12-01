import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Download, Compass, Check, Mail } from 'lucide-react'

export default function ReportViewer({ report, onDeepDive, deepDiveCache = {} }) {
    const [showExportModal, setShowExportModal] = React.useState(false)
    const [exportLoading, setExportLoading] = React.useState(false)
    const [isSelectionMode, setIsSelectionMode] = React.useState(false)
    const [reportStructure, setReportStructure] = React.useState([])

    // Parse report into structured blocks on load
    React.useEffect(() => {
        if (!report) return

        const lines = report.split('\n')
        const structure = []
        let currentSection = null
        let currentItem = null

        lines.forEach((line, index) => {
            // 1. Headers (Sections)
            if (line.startsWith('#')) {
                // Push previous item if exists
                if (currentItem) {
                    if (currentSection) currentSection.children.push(currentItem)
                    else structure.push(currentItem)
                    currentItem = null
                }

                const section = {
                    id: `section-${index}`,
                    type: 'header',
                    content: line,
                    level: line.startsWith('##') ? 2 : 1,
                    children: [],
                    checked: true
                }
                structure.push(section)
                currentSection = section
            }
            // 2. List Items (News Items)
            else if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
                // Push previous item if exists
                if (currentItem) {
                    if (currentSection) currentSection.children.push(currentItem)
                    else structure.push(currentItem)
                }

                currentItem = {
                    id: `item-${index}`,
                    type: 'item',
                    content: line,
                    children: [], // For blockquotes or nested lines
                    checked: true
                }
            }
            // 3. Blockquotes (Theta Lake Take) - Attach to current item
            else if (line.trim().startsWith('>')) {
                if (currentItem) {
                    currentItem.children.push(line)
                } else if (currentSection) {
                    // Orphaned blockquote (rare), attach to section as raw text
                    currentSection.children.push({
                        id: `text-${index}`,
                        type: 'text',
                        content: line,
                        checked: true
                    })
                }
            }
            // 4. Empty lines or other text
            else {
                if (currentItem) {
                    // If it's an empty line after an item, it might separate items. 
                    // But usually we just keep it with the item if it's part of the block.
                    // For simplicity, if it's empty, we might ignore or attach.
                    // Let's attach non-empty lines to current item, or close item if double newline?
                    // Simple approach: Attach everything else to current item if exists, else section.
                    currentItem.children.push(line)
                } else if (currentSection) {
                    currentSection.children.push({
                        id: `text-${index}`,
                        type: 'text',
                        content: line,
                        checked: true
                    })
                } else {
                    // Top level text (e.g. intro before first header)
                    structure.push({
                        id: `text-${index}`,
                        type: 'text',
                        content: line,
                        checked: true
                    })
                }
            }
        })

        // Push final item
        if (currentItem) {
            if (currentSection) currentSection.children.push(currentItem)
            else structure.push(currentItem)
        }

        setReportStructure(structure)
    }, [report])

    const handleExport = async () => {
        setExportLoading(true)
        try {
            // Reconstruct markdown from checked items
            let filteredReport = ""

            const processBlock = (block) => {
                if (!block.checked) return

                filteredReport += block.content + "\n"

                if (block.children) {
                    block.children.forEach(child => {
                        if (typeof child === 'string') {
                            filteredReport += child + "\n"
                        } else {
                            processBlock(child)
                        }
                    })
                }
            }

            reportStructure.forEach(processBlock)

            const timestamp = new Date().toLocaleString('en-US', {
                month: 'long', day: 'numeric', year: 'numeric',
                hour: 'numeric', minute: 'numeric', hour12: true
            })

            const BACKEND_URL = import.meta.env.VITE_API_URL || ''
            const API_BASE = `${BACKEND_URL}/api`

            // Pass empty sections list because we already filtered the text manually
            const response = await fetch(`${API_BASE}/generate_pdf`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    report_text: filteredReport,
                    sections: [],
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
            setIsSelectionMode(false)
        } catch (error) {
            console.error("Export failed:", error)
            alert("Failed to export PDF")
        } finally {
            setExportLoading(false)
        }
    }

    const toggleItemCheck = (id, checked) => {
        const updateBlocks = (blocks) => {
            return blocks.map(block => {
                if (block.id === id) {
                    return { ...block, checked }
                }
                if (block.children && block.children.length > 0 && typeof block.children[0] !== 'string') {
                    return { ...block, children: updateBlocks(block.children) }
                }
                return block
            })
        }
        setReportStructure(prev => updateBlocks(prev))
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
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {isSelectionMode ? (
                        <>
                            <button
                                style={{
                                    background: 'transparent',
                                    border: '1px solid var(--border-color)',
                                    color: 'var(--text-secondary)',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '0.5rem',
                                    fontSize: '0.9rem',
                                    cursor: 'pointer'
                                }}
                                onClick={() => setIsSelectionMode(false)}
                            >
                                Cancel
                            </button>
                            <button
                                style={{
                                    background: 'var(--accent-primary)',
                                    border: 'none',
                                    color: 'white',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '0.5rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    fontSize: '0.9rem',
                                    cursor: 'pointer',
                                    opacity: exportLoading ? 0.7 : 1
                                }}
                                onClick={handleExport}
                                disabled={exportLoading}
                            >
                                <Download size={16} />
                                {exportLoading ? 'Generating...' : 'Export Selected'}
                            </button>
                        </>
                    ) : (
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
                            onClick={() => setIsSelectionMode(true)}
                        >
                            <Check size={16} />
                            Select for Export
                        </button>
                    )}
                </div>
            </div>

            <div className="markdown-content" style={{ padding: '0 1rem' }}>
                {reportStructure.map(block => (
                    <div key={block.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        {isSelectionMode && (
                            <input
                                type="checkbox"
                                checked={block.checked}
                                onChange={(e) => toggleItemCheck(block.id, e.target.checked)}
                                style={{ marginTop: '0.5rem', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                            />
                        )}
                        <div style={{ flex: 1 }}>
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    // Pass existing components...
                                    h1: ({ node, ...props }) => <h1 style={{ fontSize: '1.8rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginTop: '1.5rem', color: 'var(--text-primary)' }} {...props} />,
                                    h2: ({ node, ...props }) => <h2 style={{ fontSize: '1.4rem', color: 'var(--accent-primary)', marginTop: '1.5rem', marginBottom: '0.75rem' }} {...props} />,
                                    ul: ({ node, ...props }) => <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem', color: 'var(--text-primary)' }} {...props} />,
                                    li: ({ node, children, ...props }) => {
                                        // Deep dive logic needs to be preserved
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
                                {block.content + (block.children ? '\n' + block.children.map(c => typeof c === 'string' ? c : c.content).join('\n') : '')}
                            </ReactMarkdown>

                            {/* Render children blocks if they are structured (e.g. items inside sections) */}
                            {block.children && block.children.length > 0 && typeof block.children[0] !== 'string' && (
                                <div style={{ marginLeft: '1rem' }}>
                                    {block.children.map(child => (
                                        <div key={child.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                            {isSelectionMode && (
                                                <input
                                                    type="checkbox"
                                                    checked={child.checked}
                                                    onChange={(e) => toggleItemCheck(child.id, e.target.checked)}
                                                    style={{ marginTop: '0.5rem', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                                                />
                                            )}
                                            <div style={{ flex: 1 }}>
                                                <ReactMarkdown
                                                    remarkPlugins={[remarkGfm]}
                                                    components={{
                                                        // Reuse same components... simplified for children
                                                        li: ({ node, children, ...props }) => {
                                                            // Same deep dive logic...
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
                                                            if (textContent.length > 300) textContent = textContent.substring(0, 300).trim() + '...'
                                                            const isDone = deepDiveCache[textContent] !== undefined
                                                            return (
                                                                <li style={{ marginBottom: '0.5rem', lineHeight: '1.6', display: 'flex', alignItems: 'flex-start', gap: '8px', position: 'relative', color: 'var(--text-primary)' }} {...props}>
                                                                    <span style={{ flex: 1 }}>{children}</span>
                                                                    {onDeepDive && textContent && (
                                                                        <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                                                                            <button onClick={() => onDeepDive(textContent)} className="deep-dive-btn" style={{ background: isDone ? '#10b981' : '#3b82f6', border: 'none', color: 'white', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}>
                                                                                {isDone ? <Check size={12} /> : <Compass size={12} />}
                                                                                <span style={{ fontSize: '0.7rem' }}>{isDone ? 'Done' : 'Dive'}</span>
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </li>
                                                            )
                                                        },
                                                        // ... other components
                                                        p: ({ node, ...props }) => <p style={{ lineHeight: '1.6', marginBottom: '1rem', color: 'var(--text-primary)' }} {...props} />,
                                                        strong: ({ node, ...props }) => <strong style={{ color: 'var(--text-primary)', fontWeight: 700 }} {...props} />,
                                                        blockquote: ({ node, ...props }) => <blockquote style={{ borderLeft: '4px solid #8b5cf6', background: 'rgba(139, 92, 246, 0.1)', margin: '1rem 0 1.5rem 1rem', padding: '1rem', borderRadius: '0 0.5rem 0.5rem 0', color: 'var(--text-secondary)', fontStyle: 'italic' }} {...props} />,
                                                        a: ({ node, href, children, ...props }) => {
                                                            if (href && href.startsWith('badge:')) {
                                                                const type = decodeURIComponent(href.replace('badge:', ''))
                                                                let bg = '#64748b'
                                                                if (type.includes('Sales')) bg = '#8b5cf6'
                                                                if (type.includes('Opportunity')) bg = '#10b981'
                                                                if (type.includes('Risk')) bg = '#f59e0b'
                                                                if (type.includes('Threat')) bg = '#ef4444'
                                                                return <span style={{ background: bg, color: 'white', padding: '0.15rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: 700, marginRight: '0.25rem', textTransform: 'uppercase', display: 'inline-block', textDecoration: 'none' }}>{children}</span>
                                                            }
                                                            return <a href={href} style={{ color: 'var(--accent-primary)', textDecoration: 'none' }} {...props}>{children}</a>
                                                        }
                                                    }}
                                                >
                                                    {child.content + (child.children ? '\n' + child.children.map(c => typeof c === 'string' ? c : c.content).join('\n') : '')}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div >
    )
}
