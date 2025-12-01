import os
import json
from tavily import TavilyClient
import google.generativeai as genai
from dotenv import load_dotenv
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, ListFlowable, ListItem
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import inch
from datetime import datetime
import markdown
from gtts import gTTS
import re
from xml.sax.saxutils import escape

load_dotenv()

import requests

# Initialize Clients
# Initialize Clients
tavily_api_key = os.getenv("TAVILY_API_KEY")
gemini_api_key = os.getenv("GEMINI_API_KEY")
perplexity_api_key = os.getenv("PERPLEXITY_API_KEY")
websearch_api_key = os.getenv("WEBSEARCH_API_KEY")
exa_api_key = os.getenv("EXA_API_KEY")
you_api_key = os.getenv("YOU_API_KEY")

tavily = TavilyClient(api_key=tavily_api_key) if tavily_api_key else None

if gemini_api_key:
    genai.configure(api_key=gemini_api_key)
    model = genai.GenerativeModel('gemini-2.5-flash')
else:
    model = None

def search_perplexity(query: str, days_back: int = 7, model: str = "sonar-pro"):
    """
    Uses Perplexity API (Sonar) to perform a search.
    """
    if not perplexity_api_key:
        return "Error: PERPLEXITY_API_KEY not found."

    url = "https://api.perplexity.ai/chat/completions"
    
    # Construct a prompt that asks for recent news
    time_desc = "last 24 hours" if days_back == 1 else f"last {days_back} days"
    
    payload = {
        "model": model,
        "messages": [
            {
                "role": "system",
                "content": "You are a helpful research assistant. Find recent news and details."
            },
            {
                "role": "user",
                "content": f"Search for recent news and updates regarding: {query}. Focus on the {time_desc}. Provide a detailed summary with citations if possible."
            }
        ]
    }
    
    headers = {
        "Authorization": f"Bearer {perplexity_api_key}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        data = response.json()
        return data['choices'][0]['message']['content']
    except Exception as e:
        return f"Error querying Perplexity: {e}"

def search_websearch_api(query: str, days_back: int = 7, max_results: int = 5):
    """
    Uses WebSearchAPI.ai to perform a search.
    """
    if not websearch_api_key:
        return "Error: WEBSEARCH_API_KEY not found."

    url = "https://api.websearchapi.ai/ai-search"
    
    headers = {
        "Authorization": f"Bearer {websearch_api_key}",
        "Content-Type": "application/json"
    }
    
    # Append time context to query for better relevance in AI Search
    time_context = "last 24 hours" if days_back == 1 else f"last {days_back} days"
    refined_query = f"{query} {time_context}"
    
    payload = {
        "query": refined_query,
        "maxResults": max_results,
        "includeContent": False # Set to True if we want full content, but False is faster/cheaper
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        data = response.json()
        
        # Debug logging to understand response structure
        print(f"DEBUG WebSearchAPI Raw Response: {str(data)[:500]}...")
        
        # Format results
        formatted_results = ""
        if 'results' in data:
            for item in data['results']:
                title = item.get('title', 'No Title')
                link = item.get('url', '#')
                snippet = item.get('description', '')
                formatted_results += f"- **{title}** ({link}): {snippet}\n"
        
        return formatted_results if formatted_results else "No results found."
        
    except Exception as e:
        return f"Error querying WebSearchAPI: {e}"

def search_exa(query: str, days_back: int = 7, max_results: int = 5):
    """
    Uses Exa.ai to perform a search.
    """
    if not exa_api_key:
        return "Error: EXA_API_KEY not found."

    url = "https://api.exa.ai/search"
    
    headers = {
        "x-api-key": exa_api_key,
        "Content-Type": "application/json"
    }
    
    # Calculate start date for filtering
    from datetime import datetime, timedelta
    start_date = (datetime.now() - timedelta(days=days_back)).isoformat()

    payload = {
        "query": query,
        "numResults": max_results,
        "useAutoprompt": True,
        "startPublishedDate": start_date,
        "contents": {"text": True} 
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        data = response.json()

        formatted_results = ""
        if 'results' in data:
            for item in data['results']:
                title = item.get('title', 'No Title')
                link = item.get('url', '#')
                text = item.get('text', '')[:300] # Truncate text for snippet
                formatted_results += f"- **{title}** ({link}): {text}...\n"

        return formatted_results if formatted_results else "No results found."

    except Exception as e:
        return f"Error querying Exa: {e}"

def search_you(query: str, days_back: int = 7, max_results: int = 5):
    """
    Uses You.com API (YDC) to perform a search.
    """
    if not you_api_key:
        return "Error: YOU_API_KEY not found."

    url = "https://api.ydc-index.io/search"
    
    headers = {
        "X-API-Key": you_api_key
    }
    
    # You.com doesn't have a direct 'days_back' param in basic search, 
    # so we append it to the query like we did for WebSearchAPI.
    # However, for 'news' endpoint it might support 'freshness'.
    # Let's try appending to query first.
    
    time_context = "last 24 hours" if days_back == 1 else f"last {days_back} days"
    refined_query = f"{query} {time_context}"
    
    params = {
        "query": refined_query,
        "num_web_results": max_results
    }
    
    try:
        response = requests.get(url, params=params, headers=headers)
        response.raise_for_status()
        data = response.json()
        
        # Debug logging to understand response structure
        print(f"DEBUG You.com Raw Response: {str(data)[:500]}...")
        
        formatted_results = ""
        # You.com response structure: {'hits': [{'title': ..., 'url': ..., 'snippets': [...]}]}
        if 'hits' in data:
            for item in data['hits']:
                title = item.get('title', 'No Title')
                link = item.get('url', '#')
                snippet = " ".join(item.get('snippets', []))[:300]
                formatted_results += f"- **{title}** ({link}): {snippet}\n"
        
        return formatted_results if formatted_results else "No results found."

    except Exception as e:
        return f"Error querying You.com: {e}"

MOCK_DATA = """
- **Zoom Updates:** Zoom introduced new AI Companion features for meeting summaries and real-time translation. (https://zoom.us/news)
- **Microsoft Teams:** Teams added new "Copilot" integration for chat and channels, enhancing productivity. (https://news.microsoft.com)
- **Cisco Webex:** Webex released a new version with improved noise cancellation and 4K video support. (https://webex.com/blog)
- **Salesforce:** Salesforce announced "Einstein GPT" for CRM, automating customer interactions. (https://salesforce.com/news)
- **Slack:** Slack launched a new design for better organization and focus. (https://slack.com/blog)
"""

def perform_search(query: str, topic: str, days: int, max_results: int, provider: str = "tavily", use_mock_data: bool = False, search_mode: str = "deep"):
    """
    Wrapper to switch between Tavily, Perplexity, WebSearchAPI, Exa, and You.com.
    Also handles Mock Data and Search Mode (Fast vs Deep).
    """
    if use_mock_data:
        print("DEBUG: Using MOCK DATA")
        return MOCK_DATA

    # Adjust parameters based on search_mode
    if search_mode == "fast":
        max_results = 3 # Reduce results for speed/cost
        # For Tavily, we can use 'basic' depth if supported, but here we just limit results.
        # Perplexity 'sonar-small-online' is faster/cheaper than 'sonar-pro'.
    
    if provider == "perplexity":
        # Adjust model based on mode
        model = "sonar-small-online" if search_mode == "fast" else "sonar-pro"
        return search_perplexity(query, days_back=days, model=model)
    elif provider == "websearch":
        return search_websearch_api(query, days_back=days, max_results=max_results)
    elif provider == "exa":
        return search_exa(query, days_back=days, max_results=max_results)
    elif provider == "you":
        return search_you(query, days_back=days, max_results=max_results)
    else:
        # Default to Tavily
        if not tavily:
            return "Error: Tavily API key not configured."
        
        # Tavily supports 'search_depth'
        depth = "basic" if search_mode == "fast" else "advanced"
        return tavily.search(query=query, topic=topic, days=days, max_results=max_results, search_depth=depth)

# --- Discovery Engine (Simulated) ---
def discover_targets():
    """
    Simulates the discovery of new partners and competitors.
    In a real production agent, this would crawl thetalake.com/partners.
    """
    # Seed List (Hardcoded for reliability as per plan)
    partners = [
        "Zoom", "Microsoft Teams", "Cisco Webex", "RingCentral", "Slack",
        "Asana", "Monday.com", "Miro", "Mural", "Slido", 
        "Dialpad", "Verizon", "Vidyard", "Movius", "CellTrust", 
        "Box", "NICE CXone", "LinkedIn", "1GLOBAL", "Salesforce Chatter", 
        "ICE Chat", "Kaltura", "Verint", "Symphony", "Facebook", 
        "Wistia", "Vbrick", "Red Box", "Fuze", "Cloud9", 
        "LogMeIn", "Blue Jeans", "AT&T Office@Hand", "Avaya", "Reuters", 
        "Bloomberg", "YouTube", "Vimeo", "BombBomb", "Workvivo", "Relativity"
    ]
    
    # Specific Competitors/Vendors from User Request
    competitors = [
        "Shield Platform",
        "Smarsh",
        "Arctera",
        "Archive360",
        "Global Relay",
        "NICE",
        "Behavox",
        "Mimecast",
        "Proofpoint",
        "SteelEye",
        "Microsoft Purview",
        "Bloomberg Vault",
        "LeapXpert"
    ]
    
    return partners, competitors

def add_header_footer(canvas, doc):
    """
    Adds a professional header and footer to each page.
    """
    canvas.saveState()
    
    # Header
    canvas.setFont('Helvetica-Bold', 10)
    canvas.setFillColor(colors.HexColor("#0f172a")) # Slate 900
    canvas.drawString(inch, letter[1] - 0.5 * inch, "DCGA Scout Intelligence Report")
    
    canvas.setFont('Helvetica', 9)
    canvas.setFillColor(colors.HexColor("#64748b")) # Slate 500
    date_str = datetime.now().strftime("%B %d, %Y")
    canvas.drawRightString(letter[0] - inch, letter[1] - 0.5 * inch, date_str)
    
    # Line under header
    canvas.setStrokeColor(colors.HexColor("#e2e8f0")) # Slate 200
    canvas.line(inch, letter[1] - 0.6 * inch, letter[0] - inch, letter[1] - 0.6 * inch)
    
    # Footer
    canvas.setFont('Helvetica', 8)
    canvas.setFillColor(colors.HexColor("#94a3b8")) # Slate 400
    canvas.drawString(inch, 0.5 * inch, "Generated by DCGA Scout | Confidential & Proprietary")
    
    # Page Number
    page_num = canvas.getPageNumber()
    canvas.drawRightString(letter[0] - inch, 0.5 * inch, f"Page {page_num}")
    
    canvas.restoreState()
def filter_markdown_sections(markdown_text, selected_sections):
    if not selected_sections:
        return markdown_text
        
    filtered_text = ""
    
    # Map selection keys to markdown headers
    # Note: The keys must match what the frontend sends
    section_map = {
        "Executive Summary": "# 🚨 TL;DR: The Weekly Pulse",
        "Partner Updates": "## Cooperative & Partner Updates",
        "Competitive Intelligence": "## Competitive Intelligence",
        "Regulatory Radar": "## Regulatory Radar",
        "Industry Analysis": "## Industry Analysis & Blogs"
    }
    
    # Always try to include the title if it exists (usually implicit in PDF generation)
    
    # We will extract sections based on headers.
    # The headers in the markdown are exactly as defined in the prompt.
    
    # 1. Executive Summary (TL;DR)
    if "Executive Summary" in selected_sections:
        header = section_map["Executive Summary"]
        start = markdown_text.find(header)
        if start != -1:
            # Find end: next ## or end of string
            # We look for "\n## " because TLDR is #, next sections are ##
            end = -1
            match = re.search(r'\n## ', markdown_text[start + len(header):])
            if match:
                end = start + len(header) + match.start()
            
            if end != -1:
                filtered_text += markdown_text[start:end] + "\n\n"
            else:
                filtered_text += markdown_text[start:] + "\n\n"

    # 2. Other Sections (## Header)
    for section in ["Partner Updates", "Competitive Intelligence", "Regulatory Radar", "Industry Analysis"]:
        if section in selected_sections:
            header = section_map.get(section)
            if not header: continue
            
            start = markdown_text.find(header)
            if start != -1:
                # Find end: next ## or end of string
                end = -1
                # Search for next header starting with ## 
                # (Note: Industry Analysis might be last)
                match = re.search(r'\n## ', markdown_text[start + len(header):])
                if match:
                    end = start + len(header) + match.start()
                
                if end != -1:
                    filtered_text += markdown_text[start:end] + "\n\n"
                else:
                    filtered_text += markdown_text[start:] + "\n\n"
                    
    return filtered_text

def generate_pdf(markdown_content, filename="dcga_report.pdf", sections=None, timestamp=None):
    """
    Converts Markdown content to a PDF file using ReportLab with professional styling.
    """
    # Filter content if sections provided
    if sections:
        markdown_content = filter_markdown_sections(markdown_content, sections)

    doc = SimpleDocTemplate(
        filename, 
        pagesize=letter,
        rightMargin=inch,
        leftMargin=inch,
        topMargin=inch,
        bottomMargin=inch
    )
    
    styles = getSampleStyleSheet()
    
    # Custom Styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Title'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=30,
        spaceAfter=20,
        textColor=colors.HexColor("#0f172a") # Slate 900
    )

    h1_style = ParagraphStyle(
        'CustomH1',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        spaceBefore=20,
        spaceAfter=10,
        textColor=colors.HexColor("#1e293b"), # Slate 800
        borderPadding=5,
        borderWidth=0,
        borderColor=colors.HexColor("#e2e8f0"),
        borderRadius=5
    )

    h2_style = ParagraphStyle(
        'CustomH2',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        spaceBefore=15,
        spaceAfter=8,
        textColor=colors.HexColor("#2563eb") # Blue 600
    )
    
    body_style = ParagraphStyle(
        'CustomBody',
        parent=styles['BodyText'],
        fontName='Helvetica',
        fontSize=10,
        leading=15,
        spaceAfter=8,
        textColor=colors.HexColor("#334155") # Slate 700
    )

    bullet_style = ParagraphStyle(
        'CustomBullet',
        parent=body_style,
        leftIndent=20,
        firstLineIndent=0,
        spaceAfter=8
    )

    blockquote_style = ParagraphStyle(
        'CustomBlockquote',
        parent=body_style,
        leftIndent=20,
        rightIndent=20,
        spaceBefore=10,
        spaceAfter=10,
        textColor=colors.HexColor("#475569"), # Slate 600
        fontName='Helvetica-Oblique',
        backColor=colors.HexColor("#f3f4f6"), # Light Gray/Violet tint
        borderPadding=10,
        borderWidth=1,
        borderColor=colors.HexColor("#e2e8f0"),
        borderRadius=5
    )
    
    story = []

    # Title Page
    story.append(Spacer(1, 2 * inch))
    story.append(Paragraph("DCGA Scout", title_style))
    story.append(Paragraph("Market Intelligence Report", h2_style))
    story.append(Spacer(1, 0.5 * inch))
    
    display_date = timestamp if timestamp else datetime.now().strftime('%B %d, %Y at %I:%M %p')
    story.append(Paragraph(f"Generated on: {display_date}", body_style))
    story.append(PageBreak())

    def process_text_styling(text):
        # 0. Escape XML characters first
        text = escape(text)

        # 1. Bold: **text** -> <b>text</b>
        text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', text)
        
        # 2. Links: [text](url) -> <a href="url" color="blue">text</a>
        # Use strict matching [^\]]* to avoid backtracking across multiple brackets
        text = re.sub(r'\[([^\]]*)\]\((.*?)\)', r'<a href="\2"><font color="#2563eb">\1</font></a>', text)
        
        # 3. Badges: [BadgeName] -> Colored text
        def badge_replacer(match):
            badge = match.group(1)
            color = "#64748b" # Default
            if "Sales" in badge: color = "#7c3aed" # Violet
            if "Opportunity" in badge: color = "#059669" # Emerald
            if "Risk" in badge: color = "#d97706" # Amber
            if "Threat" in badge: color = "#dc2626" # Red
            return f'<b><font color="{color}">[{badge}]</font></b>'
            
        text = re.sub(r'\[(Sales Validation|Opportunity|Risk|Threat|Validation)\]', badge_replacer, text)
        
        return text

    # Custom Styles
    # ... (styles remain the same, but we can remove ListFlowable imports if unused, 
    # but keeping them doesn't hurt. We will use Paragraph for bullets now)
    
    # Update bullet style to have indentation
    bullet_style = ParagraphStyle(
        'CustomBullet',
        parent=body_style,
        leftIndent=20,
        firstLineIndent=-10, # Hanging indent for bullet
        spaceAfter=8
    )

    lines = markdown_content.split('\n')
    print("DEBUG: Generating PDF with NEW logic (Paragraph bullets)")
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # Handle Blockquotes first to avoid escaping issues with '>'
        if line.startswith('> '):
             content = line[2:].strip()
             styled_content = process_text_styling(content)
             story.append(Paragraph(styled_content, blockquote_style))
             continue

        # Apply styling for other lines
        styled_line = process_text_styling(line)
        
        if line.startswith('* ') or line.startswith('- '):
            # Use Paragraph with bulletText for reliable rendering
            clean_line = styled_line[2:].strip()
            story.append(Paragraph(f"• {clean_line}", bullet_style))
        elif line.startswith('# '):
            story.append(Paragraph(styled_line[2:], h1_style))
        elif line.startswith('## '):
            story.append(Paragraph(styled_line[3:], h2_style))
        elif line.startswith('### '):
             story.append(Paragraph(styled_line[4:], h2_style))
        else:
            story.append(Paragraph(styled_line, body_style))

    doc.build(story, onFirstPage=add_header_footer, onLaterPages=add_header_footer)
    return filename

def run_agent(time_range: str, search_provider: str = "tavily", use_mock_data: bool = False, search_mode: str = "deep"):
    if search_provider == "tavily" and not tavily:
        return "Error: TAVILY_API_KEY not found in .env"
    if search_provider == "perplexity" and not perplexity_api_key:
        return "Error: PERPLEXITY_API_KEY not found in .env"
    if search_provider == "websearch" and not websearch_api_key:
        return "Error: WEBSEARCH_API_KEY not found in .env"
    if search_provider == "exa" and not exa_api_key:
        return "Error: EXA_API_KEY not found in .env"
    if search_provider == "you" and not you_api_key:
        return "Error: YOU_API_KEY not found in .env"

    # 1. Discovery Phase
    partners, competitors = discover_targets()
    
    # Map time_range
    tavily_time = "week"
    days_back = 7
    
    if time_range == "24h":
        tavily_time = "day"
        days_back = 1
    elif time_range == "7d":
        tavily_time = "week"
        days_back = 7
    elif time_range == "14d":
        tavily_time = "month"
        days_back = 14
    elif time_range == "30d":
        tavily_time = "month"
        days_back = 30

    # 2. Data Gathering (Expanded Pillars)
    raw_data = []
    
    # Pillar A: Partner Ecosystem (Deep Dive)
    # Instead of one big query, we search for key partners individually to ensure depth
    # key_partners = ["Zoom", "Microsoft Teams", "Cisco Webex", "Salesforce", "Slack"]
    # Use the partners list from discover_targets()
    for partner in partners:
        try:
            query = f"{partner} API developer changelog new features compliance export"
            results = perform_search(query=query, topic="news", days=days_back, max_results=5, provider=search_provider, use_mock_data=use_mock_data, search_mode=search_mode)
            raw_data.append(f"--- {partner} Updates ---\n{results}")
        except Exception as e:
            print(f"Error searching {partner}: {e}")

    # Pillar B: Competitive Landscape (Broad Sweep)
    # Search for competitors individually to ensure no news is buried
    for comp in competitors:
        try:
            # 1. General News Search
            # We add specific terms like "ISO", "Certification", "AI" to catch the Behavox news
            # [UPDATED] Broadened to include announcements and partnerships, EXCLUDING fines/enforcement
            comp_query = f"{comp} product launch new feature partnership announcement AI governance -fine -penalty -settlement"
            
            # Use topic="general" for broader coverage (BusinessWire often appears in general search)
            # Increase max_results to ensure we catch it
            comp_results = perform_search(query=comp_query, topic="general", days=days_back, max_results=3, provider=search_provider)
            
            if comp_results: # Check if results exist (Perplexity returns string, Tavily returns dict)
                # For Tavily, check 'results' list. For Perplexity, string is truthy.
                if isinstance(comp_results, dict) and 'results' in comp_results and len(comp_results['results']) == 0:
                    pass # Empty Tavily results
                else:
                    raw_data.append(f"--- {comp} Activity ---\n{comp_results}")
                
        except Exception as e:
            print(f"Error fetching Competitor {comp}: {e}")

    # Pillar C1: Regulatory Enforcement (Existing - Focused on Fines & AI)
    try:
        # Added "AI" and "Generative" to catch new tech regulations
        # [UPDATED] Focus on Financial Institutions (Banks, Broker-Dealers) not Vendors
        reg_query = "SEC FINRA FCA CFTC fine penalty settlement broker-dealer investment adviser recordkeeping off-channel communications AI regulation"
        # Fetch 15 items for enforcement
        reg_results = perform_search(query=reg_query, topic="news", days=days_back, max_results=15, provider=search_provider)
        raw_data.append(f"--- Regulatory Enforcement ---\n{reg_results}")
    except Exception as e:
        raw_data.append(f"Error fetching Regulatory Enforcement: {e}")

    # [NEW] Pillar C2: Regulatory Strategy & Priorities (The "Missing Link")
    try:
        # Hyper-targeted query for the specific missing item + general strategy
        strat_query = "SEC Division of Examinations 2026 Priorities press release AI regulation guidance"
        # Use topic="general" to hit sec.gov, finra.org directly
        strat_results = perform_search(query=strat_query, topic="general", days=30, max_results=10, provider=search_provider)
        raw_data.append(f"--- Regulatory Strategic Announcements ---\n{strat_results}")
    except Exception as e:
        raw_data.append(f"Error fetching Regulatory Strategy: {e}")

    # [NEW] Pillar D: Social & Professional Signals (LinkedIn)
    try:
        # Search for "Pulse" articles and posts to get professional "grounding"
        social_query = f"site:linkedin.com/pulse OR site:linkedin.com/posts ({' OR '.join(competitors[:3])} OR Theta Lake) compliance AI"
        # Use topic="general" because LinkedIn content isn't always indexed as "news"
        social_results = perform_search(query=social_query, topic="general", days=30, max_results=10, provider=search_provider)
        raw_data.append(f"--- LinkedIn/Social Discussions ---\n{social_results}")
    except Exception as e:
        raw_data.append(f"Error fetching Social signals: {e}")

    # [NEW] Pillar E: Industry Analysis & Blogs
    try:
        # Broad search for analysis, opinions, and blogs (excluding LinkedIn to avoid dupes)
        blog_query = f"{' OR '.join(competitors[:3])} compliance AI analysis opinion -site:linkedin.com"
        blog_results = perform_search(query=blog_query, topic="general", days=30, max_results=10, provider=search_provider)
        raw_data.append(f"--- Industry Analysis & Blogs ---\n{blog_results}")
    except Exception as e:
        raw_data.append(f"Error fetching Blogs: {e}")

    # 3. Intelligence Processing (Theta Lake Perspective)
    if model:
        prompt = f"""
        You are the Chief Strategy Officer for Theta Lake.
        We believe in enabling collaboration, not blocking it.
        We believe 'Unified Capture' is superior to legacy email archiving.
        We believe AI requires 'Human in the loop' supervision.
        
        Analyze the following raw data and generate a "DCGA Scout 4.0 Strategic Report".
        
        **CRITICAL INSTRUCTION: CURATION & SCORING**
        1. You have been provided with a large set of raw news items (approx 10-20 per section), PLUS new "Grounding Sources" (LinkedIn, Blogs).
        2. You must **analyze and score** each item based on its strategic relevance to Theta Lake.
        3. **SELECT ONLY THE TOP 5** highest-scoring items for each section.
        4. **PRIORITIZE DIVERSITY:** Try to include at least one insight from a non-traditional source (LinkedIn, Blog, Analyst Report) if it is high quality.
        5. **NO DUPLICATES:** Do not list the same news item in multiple sections. Choose the *single best* section for it.
        6. **COMPETITOR ALERT:** Treat "Microsoft Purview" as a COMPETITOR, not a partner, for the purpose of this report.
        7. **SELF-EXCLUSION:** Do NOT include "Theta Lake" press releases or news in the "Competitive Intelligence" section. Place them in "Cooperative & Partner Updates" if relevant, or omit if minor.
        
        **STRICT INCLUSION CRITERIA (MUST MATCH ONE):**
        - **Compliance & Governance:** News about recordkeeping, archiving, eDiscovery, or supervision.
        - **AI Safety & Regulation:** News about AI bias, hallucinations, "human in the loop", or AI governance rules.
        - **New Communication Modalities:** News about *new* features in Zoom/Teams/Webex that create *new* compliance risks (e.g., Whiteboards, Huddles, AI Summaries).
        - **Major Corporate Moves:** Significant M&A, Funding (> $50M), or C-level executive changes at Competitors/Partners.

        **STRICT NEGATIVE CONSTRAINTS (DO NOT INCLUDE):**
        - **Generic Security News:** Exclude general vulnerabilities (CVEs), patches, ransomware, or "zero-day" exploits UNLESS they specifically mention "compliance failure" or "recordkeeping".
        - **Stock Market Noise:** Exclude daily stock price fluctuations or quarterly earnings reports (unless they mention specific product strategy shifts).
        - **Marketing Fluff:** Exclude generic "we are excited to announce" awards or minor partnership fluff without substance.
        - **Irrelevant Features:** Exclude minor UI updates (e.g., "Dark Mode", "New Emojis") unless they impact data capture.

        **REGULATORY PRIORITIZATION:**
           - **HIGH PRIORITY:** Communication Compliance (recordkeeping, off-channel comms), AI Governance/Regulation, and Digital Communications Governance (DCGA).
           - **EXAMPLES:** "SEC Division of Examinations 2026 Priorities" (if relevant), new AI rules, or major fines.
        
        **MUTUALLY EXCLUSIVE CATEGORIZATION (CRITICAL):**
           - **Regulatory Radar:** STRICTLY for news driven by **Agencies** (SEC, FINRA, FCA, etc.) targeting **Financial Institutions** (Banks, Broker-Dealers). This includes fines, penalties, settlements, and new rules.
           - **Competitive Intelligence:** STRICTLY for news driven by **Vendors** (Competitors). This includes product launches, features, partnerships, and funding.
           - **OVERLAP RULE:** If a Competitor is fined, place this **ONLY in Regulatory Radar**.
           - **NO DUPLICATES:** A story must appear in ONE section only.
           - **NOTE:** It is rare for a Vendor to be fined. Focus Regulatory Radar on the *customers* (Banks) getting fined.
        
        **COMPETITOR WEIGHTING:**
           - **CRITICAL:** Prioritize **ANY significant news** from direct competitors (e.g., Product Launches, Major Partnerships, Certifications, Funding, Acquisitions).
           - **Certifications** (ISO, SOC2, FedRAMP) and **AI Governance** features are particularly high-threat and MUST be included.
           - Ensure the "Behavox ISO/IEC 42001 Certification" is included if present in the raw data.
        
        Time Period: {time_range}
        
        Raw Data:
        {str(raw_data)[:40000]}
        
        **LOGIC FOR MICROSOFT:**
        - **Microsoft Purview** is a direct competitor. Updates to Purview are generally a **[Threat]** or **[Risk]**.
        - **Microsoft AI / Copilot / Teams** features are **[Opportunity]**. New modalities create a need for Theta Lake's specialized governance.

        **FORMATTING RULES:**
        - Use Markdown.
        - Start with a "TL;DR: The Weekly Pulse" (Executive Summary).
        - Group by: "Cooperative & Partner Updates", "Competitive Landscape", "Regulatory Radar".
        - **MANDATORY:** END EVERY BULLET POINT WITH THE DATE/TIME: ... `[Nov 25, 2025 10:00 AM EST]`
        - **MANDATORY:** EVERY NEWS ITEM (OR GROUP) MUST HAVE A "THETA LAKE TAKE". NO EXCEPTIONS.
        - **INTELLIGENT GROUPING:** You MAY group similar items together (e.g., multiple new features for Microsoft Teams).
        - **CRITICAL FORMATTING RULE FOR GROUPS:** If you group items, you MUST combine them into a SINGLE bullet point paragraph. Do NOT list them on separate lines.
        - Example of BAD grouping (Do NOT do this):
          * News A
          * News B
          > Take
        - Example of GOOD grouping (DO THIS):
          * **News:** Microsoft Teams introduced Feature A AND Feature B. ([Source](url))
          > **Theta Lake Take:** ...
        - If grouped, provide a SINGLE "Theta Lake Take" that covers the entire group.
        - **NO SUMMARY LISTS:** Do NOT provide a list of news items at the start of a section. Combine the news and the analysis into a single block for each item immediately.
        - For each item (or group), provide the news/update first.
        - Then, IMMEDIATELY follow with a "Theta Lake Take" blockquote: `> **Theta Lake Take:** [Badge] Analysis...`
        - Badges must be one of: [Sales Validation], [Opportunity], [Risk], [Threat], [Validation].
        - Cite sources with links: `([Source Name](url))`.
        
        **ONE-SHOT EXAMPLE (SINGLE ITEM):**
        
        ## Cooperative & Partner Updates
        * **News:** Zoom launched "AI Companion 2.0" with new federation capabilities for external meetings. ([Zoom Blog](https://blog.zoom.us)) [Nov 28, 2025 09:00 AM EST]
        > **💡 Theta Lake Take:** **[Opportunity]** This expansion of AI into external federation creates a massive compliance gap. Legacy archivers cannot see into these ephemeral, cross-tenant AI interactions. This is a prime upsell trigger for our "Unified Capture" to ensure full visibility.
        
        **ONE-SHOT EXAMPLE (GROUPED ITEMS):**

        * **News:** Microsoft Teams introduced "Mesh" for immersive 3D meetings ([The Verge](https://theverge.com)) AND announced new "Copilot" integration for Whiteboard ([Microsoft News](https://news.microsoft.com)). [Nov 27, 2025 02:00 PM EST]
        > **💡 Theta Lake Take:** **[Risk]** Both 3D avatars and AI-generated whiteboard content present a nightmare for traditional supervision. Whether a trader nods "yes" in a 3D space or Copilot summarizes a brainstorm, legacy tools miss this context. Theta Lake's ability to capture and replay the full visual context is the ONLY viable solution here.

        Format the output EXACTLY as follows (Markdown):
        
        # 🚨 TL;DR: The Weekly Pulse
        (A narrative summary of the top 3-5 most critical events. Be punchy and executive.)
        
        ## Cooperative & Partner Updates
        (Select TOP 5 most impactful updates:)
        * **News:** [Summary] ([Source](URL))
        > **💡 Theta Lake Take:** **[Opportunity/Risk/Threat]** [Strategic Perspective]
        
        ## Competitive Intelligence
        (Select TOP 5-10 most threatening or notable competitor moves. **DO NOT INCLUDE THETA LAKE NEWS HERE.**)
        * **News:** [Summary] ([Source](URL))
        > **💡 Theta Lake Take:** **[Threat/Validation]** [Strategic Perspective]
        
        ## Regulatory Radar
        (Select TOP 5 most relevant fines or rule changes:)
        * **Event:** [Description] ([Source](URL))
        > **💡 Theta Lake Take:** **[Sales Validation]** [Sales enablement angle]
        
        Keep it professional, insightful, and perfectly formatted. Ensure every news item has a source link. Use the blockquote (>) for the Theta Lake Take to indent it.
        """
        
        try:
            report_markdown = model.generate_content(prompt).text
        except Exception as e:
            report_markdown = f"Error generating report with Gemini: {e}\n\nFallback Raw Data:\n{str(raw_data)}"
    else:
        report_markdown = "Error: GEMINI_API_KEY not found. Returning raw data...\n" + str(raw_data)

    # 4. PDF Generation
    pdf_filename = "dcga_report_v2.pdf"
    try:
        generate_pdf(report_markdown, pdf_filename)
    except Exception as e:
        print(f"PDF Generation failed: {e}")

    return report_markdown

# --- v2.0 Features ---

def chat_with_report(report_context: str, user_message: str):
    """
    Feature 1: Scout Chat (RAG)
    Uses Gemini to answer questions based on the report context.
    """
    if not model:
        return "Error: Gemini API key not configured."
    
    prompt = f"""
    You are an intelligent assistant for the DCGA Scout.
    Your goal is to answer user questions based ONLY on the provided report context.
    
    Report Context:
    {report_context}
    
    User Question: {user_message}
    
    Answer concisely and professionally.
    """
    try:
        response = model.generate_content(prompt).text
        return response
    except Exception as e:
        return f"Error generating chat response: {e}"

def generate_sales_email(insight_text: str, recipient_name: str):
    """
    Feature 2: Sales Co-Pilot
    Generates a sales outreach email based on a specific insight.
    """
    if not model:
        return "Error: Gemini API key not configured."
        
    prompt = f"""
    You are a top-tier enterprise sales representative for Theta Lake.
    Write a short, punchy, and professional outreach email to a prospect named {recipient_name}.
    
    The email should be based on this specific market insight:
    "{insight_text}"
    
    Value Proposition to weave in:
    - Theta Lake provides "Unified Capture" and "Proactive Compliance".
    - We help firms enable modern collaboration (Zoom, Teams) without compliance risks.
    
    Structure:
    1. Subject Line (Catchy but professional)
    2. Hook (The insight)
    3. The "So What?" (Why they should care)
    4. Call to Action (Meeting request)
    """
    try:
        email = model.generate_content(prompt).text
        return email
    except Exception as e:
        return f"Error generating email: {e}"

def deep_dive_search(topic: str, search_provider: str = "tavily"):
    """
    Feature 3: Deep Dive Agent
    Performs a targeted search on a specific topic to get more details.
    """
    # Check keys based on provider (perform_search handles this, but good to fail fast if needed)
    # Actually perform_search handles the checks.
        
    try:
        # Search for detailed analysis and news
        query = f"{topic} analysis details implications compliance"
        results = perform_search(query=query, topic="general", days=30, max_results=5, provider=search_provider)
        
        # Summarize with Gemini
        if model:
            prompt = f"""
            Summarize the following search results into a detailed "Deep Dive" briefing on the topic: "{topic}".
            Focus on strategic implications for compliance and risk teams.
            
            Search Results:
            {results}
            """
            summary = model.generate_content(prompt).text
            return summary
        else:
            return f"Search Results:\n{results}"
            
    except Exception as e:
        return f"Error performing deep dive: {e}"

def generate_audio_summary(report_text: str):
    """
    Feature 4: Audio Briefing
    Generates an MP3 summary of the report using gTTS.
    """
    try:
        # 1. Summarize the report first (Audio needs to be shorter than the full text)
        if model:
            prompt = f"""
            Convert the following report into a 2-minute "Podcast Script" for an audio briefing.
            
            CRITICAL INSTRUCTIONS:
            - Use PLAIN TEXT ONLY - no markdown, no asterisks, no special characters
            - Write it exactly as a narrator would speak it
            - Keep it conversational and engaging
            - Focus on the top 3 most important takeaways
            - Start with "Welcome to your DCGA Scout Daily Briefing."
            - Do NOT use any formatting like *, **, #, >, or bullet points
            
            Report:
            {report_text[:10000]}
            """
            script = model.generate_content(prompt).text
            
            # Safety: Strip any remaining markdown characters
            import re
            # Remove markdown headers
            script = re.sub(r'#+\s*', '', script)
            # Remove bold/italic markers
            script = re.sub(r'\*+', '', script)
            # Remove blockquotes
            script = re.sub(r'>\s*', '', script)
            # Remove bullet points
            script = re.sub(r'^\s*[-*]\s+', '', script, flags=re.MULTILINE)
            # Remove links [text](url)
            script = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', script)
        else:
            script = "Gemini not available. Reading first 500 characters of report. " + report_text[:500]
            
        # 2. Convert to Audio
        tts = gTTS(text=script, lang='en', tld='com')
        filename = "briefing.mp3"
        tts.save(filename)
        return filename
    except Exception as e:
        print(f"Error generating audio: {e}")
        return "error.mp3"

def generate_swot(competitors: list[str]):
    """
    Feature 5: Competitor Battlecards
    Generates a structured SWOT analysis for the given competitors.
    """
    if not model or not tavily:
        return {comp: {"error": "APIs not configured"} for comp in competitors}
        
    cards = {}
    for comp in competitors:
        try:
            # Quick search for recent news to make it fresh
            query = f"{comp} problems lawsuits features growth strategy"
            results = tavily.search(query=query, topic="news", days=30, max_results=5)
            
            # Extract just the content from results
            news_text = "\n".join([r.get('content', '') for r in results.get('results', [])])[:2000]
            
            prompt = f"""
            Based on general knowledge and the following recent news, generate a structured SWOT analysis for {comp}.
            
            Recent News:
            {news_text}
            
            CRITICAL: Return ONLY valid JSON in this exact format, with NO markdown formatting:
            {{
                "strengths": ["point 1", "point 2", "point 3"],
                "weaknesses": ["point 1", "point 2", "point 3"],
                "opportunities": ["point 1", "point 2", "point 3"],
                "threats": ["point 1", "point 2", "point 3"]
            }}
            
            Each category should have 3-4 specific, actionable points.
            """
            response = model.generate_content(prompt).text.strip()
            
            # Clean up potential markdown formatting
            response = response.replace("```json", "").replace("```", "").strip()
            
            # Try to extract JSON if there's extra text
            import re
            json_match = re.search(r'\{[\s\S]*\}', response)
            if json_match:
                response = json_match.group(0)
            
            cards[comp] = json.loads(response)
        except json.JSONDecodeError as e:
            print(f"JSON decode error for {comp}: {e}")
            print(f"Response was: {response[:200]}")
            cards[comp] = {"error": f"Failed to parse response: {str(e)}"}
        except Exception as e:
            print(f"Error generating SWOT for {comp}: {e}")
            cards[comp] = {"error": str(e)}
            
    return cards
