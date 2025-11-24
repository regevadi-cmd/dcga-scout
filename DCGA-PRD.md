# Product Requirements Document (PRD): DCGA Scout (Comprehensive Edition)

**Project Name:** DCGA Scout "Omni-Channel"
**Version:** 4.1 (Updated with "Grounding Sources" & UI Modernization)
**Target Organization:** Theta Lake
**Status:** Live / In Production

---

## 1. Executive Summary
**The Goal:** Build an autonomous Market Intelligence Agent that tracks the *entire* Digital Communications Governance (DCGA) landscape. It must monitor every competitor, every partner, and every regulatory body, then synthesize that data into a "Theta Lake Strategic Report" that highlights opportunities and threats.

**The Output:** A professional PDF report (and Markdown email) that starts with a high-level TL;DR and drills down into specific vendor updates, all interpreted through the "Theta Lake Lens."

---

## 2. Dynamic "Discovery" Engine & Search Strategy
*The agent uses a multi-layered search approach to ensure comprehensive coverage beyond just "News".*

### A. Target Discovery
*   **Partners:** Zoom, Microsoft, Cisco, RingCentral, Slack, Box, Salesforce, Mural, Miro, Asana.
*   **Competitors:** **Microsoft Purview** (Explicitly treated as a competitor), Smarsh, Global Relay, Proofpoint, Veritas, Mimecast, ZL Tech, SteelEye, Shield, LeapXpert.

### B. Search Pillars (Expanded)
1.  **Official News:** Standard news search for M&A, product launches, and partnerships.
2.  **Regulatory Strategy:** Targeted search for "Press Releases", "Priorities", and "Guidance" on official .gov sites (SEC, FINRA, etc.) to catch strategic documents like the **"SEC 2026 Examination Priorities"**.
3.  **Social Signals (LinkedIn):** `site:linkedin.com` search for "Pulse" articles and professional discussions to capture industry sentiment.
4.  **Industry Analysis:** General web search for blogs, whitepapers, and opinion pieces (distinct from news).

---

## 3. Intelligence Processing & Prioritization

The Agent processes raw data using **Gemini 1.5 Pro** with strict curation rules:

### A. Prioritization Logic
*   **Regulatory Radar:**
    *   **HIGH PRIORITY:** Communication Compliance (WhatsApp, Recordkeeping), AI Governance, DCGA.
    *   **LOW PRIORITY:** General security vulnerabilities (e.g., patches, ransomware) *unless* they have a direct compliance angle.
    *   **MANDATORY:** Specific strategic documents (e.g., "SEC 2026 Priorities") must be included if found.
*   **Competitive Intelligence:**
    *   Focus on "Unified Capture" messaging and AI-driven features.
    *   **Microsoft Purview** updates are treated as competitive threats.

### B. The "Theta Lake Perspective"
Every finding must include a strategic "Take":
*   **[Opportunity]:** Events that create demand for Theta Lake (e.g., Partner adds GenAI).
*   **[Risk]:** Events that threaten our position (e.g., API pricing changes).
*   **[Threat]:** Competitor advancements (e.g., Microsoft Purview adding native compliance).
*   **[Validation]:** Market moves that prove our thesis (e.g., Competitor adopting "Unified Capture" messaging).
*   **[Sales Validation]:** Regulatory fines or rulings that directly support the sales pitch.

---

## 4. User Interface (Modernized)

The UI has been overhauled for a premium, modern experience:

*   **Layout:** Sleek **Top Bar** navigation with a horizontal toolbar for configuration.
*   **Visuals:**
    *   Gradient accents (Blue/Violet) for branding.
    *   Centered, document-style report viewer for readability.
    *   "Empty State" with clear iconography.
*   **Badge Rendering:**
    *   Tags like `[Opportunity]` and `[Sales Validation]` are automatically rendered as **color-coded badges** (Green, Red, Violet).
    *   Robust handling of tags within text, bolding, and blockquotes.

---

## 5. Technical Specifications

*   **Backend:** Python (FastAPI)
    *   **Search:** Tavily API (Multi-topic: "News" and "General").
    *   **LLM:** Gemini 1.5 Pro (via `google-generativeai`).
    *   **PDF Engine:** `reportlab` for professional export.
*   **Frontend:** React (Vite)
    *   **Styling:** Vanilla CSS with CSS Variables for theming.
    *   **Markdown:** `react-markdown` with custom components for Badge rendering.
    *   **Icons:** `lucide-react`.

*   **User Inputs:**
    *   **Time Period:** [Last 7 Days | Last 2 Weeks | Last Month].
    *   **Action:** "Run Scout" button with loading state.
    *   **Export:** "Export PDF" button.

---

## 6. Success Metrics
1.  **Strategic Accuracy:** Captures key strategic documents (e.g., SEC Priorities) that are often missed by simple news scrapers.
2.  **Noise Reduction:** Successfully filters out generic security noise to focus on DCGA/AI Compliance.
3.  **Visual Quality:** The report looks professional, with clear badging and a clean layout.