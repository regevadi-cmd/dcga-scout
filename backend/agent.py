import os
import json
from tavily import TavilyClient
import google.generativeai as genai
from dotenv import load_dotenv
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
import markdown
from gtts import gTTS

load_dotenv()

# Initialize Clients
tavily_api_key = os.getenv("TAVILY_API_KEY")
gemini_api_key = os.getenv("GEMINI_API_KEY")

tavily = TavilyClient(api_key=tavily_api_key) if tavily_api_key else None

if gemini_api_key:
    genai.configure(api_key=gemini_api_key)
    model = genai.GenerativeModel('gemini-2.5-flash')
else:
    model = None

# --- Discovery Engine (Simulated) ---
def discover_targets():
    """
    Simulates the discovery of new partners and competitors.
    In a real production agent, this would crawl thetalake.com/partners.
    """
    # Seed List (Hardcoded for reliability as per plan)
    partners = ["Zoom", "Microsoft", "Cisco", "RingCentral", "Slack", "Box", "Salesforce", "Mural", "Miro", "Asana"]
    # Added Microsoft Purview as a direct competitor per user feedback
    competitors = ["Microsoft Purview", "Smarsh", "Global Relay", "Proofpoint", "Veritas", "Mimecast", "ZL Tech", "SteelEye", "Shield", "LeapXpert"]
    
    # Simulated "New Discovery" (Randomly add one to show dynamic behavior)
    # In real life, we'd use Tavily to find "Theta Lake integration partners"
    return partners, competitors

def generate_pdf(markdown_content, filename="report.pdf"):
    """
    Converts Markdown content to a PDF file using ReportLab with better styling.
    """
    doc = SimpleDocTemplate(filename, pagesize=letter)
    styles = getSampleStyleSheet()
    
    # Custom Styles
    title_style = styles['Title']
    title_style.fontSize = 24
    title_style.spaceAfter = 20
    title_style.textColor = "#0f172a"

    h2_style = styles['Heading2']
    h2_style.fontSize = 16
    h2_style.spaceBefore = 15
    h2_style.spaceAfter = 10
    h2_style.textColor = "#2563eb" # Blue
    
    body_style = styles['BodyText']
    body_style.fontSize = 11
    body_style.leading = 14
    
    story = []

    lines = markdown_content.split('\n')
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # Basic Markdown Parsing
        # Bold: **text** -> <b>text</b>
        line = line.replace("**", "<b>", 1).replace("**", "</b>", 1)
        # Links: [text](url) -> <link href="url" color="blue">text</link>
        # (Simple regex-free replacement for common cases, or just leave as text for now to avoid breakage)
        
        if line.startswith('# '):
            story.append(Paragraph(line[2:], title_style))
            story.append(Spacer(1, 12))
        elif line.startswith('## '):
            story.append(Paragraph(line[3:], h2_style))
            story.append(Spacer(1, 8))
        elif line.startswith('* '):
            # Handle bullet points
            story.append(Paragraph(f"• {line[2:]}", body_style))
            story.append(Spacer(1, 4))
        else:
            story.append(Paragraph(line, body_style))
            story.append(Spacer(1, 6))

    doc.build(story)
    return filename

def run_agent(time_range: str):
    if not tavily:
        return "Error: TAVILY_API_KEY not found in .env"

    # 1. Discovery Phase
    partners, competitors = discover_targets()
    
    # Map time_range
    tavily_time = "week"
    if time_range == "7d":
        tavily_time = "week"
    elif time_range == "14d":
        tavily_time = "month"
    elif time_range == "30d":
        tavily_time = "month"

    # 2. Data Gathering (Expanded Pillars)
    raw_data = []
    
    # Pillar A: Partner Ecosystem (Deep Dive)
    # Instead of one big query, we search for key partners individually to ensure depth
    key_partners = ["Zoom", "Microsoft Teams", "Cisco Webex", "Salesforce", "Slack"]
    for partner in key_partners:
        try:
            query = f"{partner} API developer changelog new features compliance export"
            results = tavily.search(query=query, topic="news", days=7 if tavily_time == 'week' else 30, max_results=5)
            raw_data.append(f"--- {partner} Updates ---\n{results}")
        except Exception as e:
            print(f"Error searching {partner}: {e}")

    # Pillar B: Competitive Landscape (Broad Sweep)
    # Search for the group to find major headlines
    # Note: We explicitly added Microsoft Purview to the competitors list above
    comp_query = f"{' OR '.join(competitors[:5])} acquisition product launch funding compliance"
    try:
        # INCREASED: Fetch 20 items to allow for filtering
        comp_results = tavily.search(query=comp_query, topic="news", days=30, max_results=20)
        raw_data.append(f"--- Competitor Activity ---\n{comp_results}")
    except Exception as e:
        raw_data.append(f"Error fetching Competitor activity: {e}")

    # Pillar C1: Regulatory Enforcement (Existing - Focused on Fines & AI)
    try:
        # Added "AI" and "Generative" to catch new tech regulations
        reg_query = "SEC FINRA FCA CFTC fines recordkeeping off-channel communications whatsapp enforcement AI artificial intelligence generative"
        # Fetch 15 items for enforcement
        reg_results = tavily.search(query=reg_query, topic="news", days=30, max_results=15)
        raw_data.append(f"--- Regulatory Enforcement ---\n{reg_results}")
    except Exception as e:
        raw_data.append(f"Error fetching Regulatory Enforcement: {e}")

    # [NEW] Pillar C2: Regulatory Strategy & Priorities (The "Missing Link")
    try:
        # Hyper-targeted query for the specific missing item + general strategy
        strat_query = "SEC Division of Examinations 2026 Priorities press release AI regulation guidance"
        # Use topic="general" to hit sec.gov, finra.org directly
        strat_results = tavily.search(query=strat_query, topic="general", days=30, max_results=10)
        raw_data.append(f"--- Regulatory Strategic Announcements ---\n{strat_results}")
    except Exception as e:
        raw_data.append(f"Error fetching Regulatory Strategy: {e}")

    # [NEW] Pillar D: Social & Professional Signals (LinkedIn)
    try:
        # Search for "Pulse" articles and posts to get professional "grounding"
        social_query = f"site:linkedin.com/pulse OR site:linkedin.com/posts ({' OR '.join(competitors[:3])} OR Theta Lake) compliance AI"
        # Use topic="general" because LinkedIn content isn't always indexed as "news"
        social_results = tavily.search(query=social_query, topic="general", days=30, max_results=10)
        raw_data.append(f"--- LinkedIn/Social Discussions ---\n{social_results}")
    except Exception as e:
        raw_data.append(f"Error fetching Social signals: {e}")

    # [NEW] Pillar E: Industry Analysis & Blogs
    try:
        # Broad search for analysis, opinions, and blogs (excluding LinkedIn to avoid dupes)
        blog_query = f"{' OR '.join(competitors[:3])} compliance AI analysis opinion -site:linkedin.com"
        blog_results = tavily.search(query=blog_query, topic="general", days=30, max_results=10)
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
        8. **REGULATORY PRIORITIZATION:**
           - **HIGH PRIORITY:** Communication Compliance (recordkeeping, off-channel comms), AI Governance/Regulation, and Digital Communications Governance (DCGA).
           - **LOW PRIORITY:** General security news (e.g., vulnerabilities, patches, ransomware) UNLESS it has a direct compliance/governance angle.
           - **MANDATORY:** "SEC Division of Examinations 2026 Priorities" must be included.
        
        Time Period: {time_range}
        
        Raw Data:
        {str(raw_data)[:40000]}
        
        Format the output EXACTLY as follows (Markdown):
        
        # 🚨 TL;DR: The Weekly Pulse
        (A narrative summary of the top 3-5 most critical events. Be punchy and executive.)
        
        ## Cooperative & Partner Updates
        (Select TOP 5 most impactful updates:)
        * **News:** [Summary] ([Source](URL))
        > **💡 Theta Lake Take:** **[Opportunity/Risk/Threat]** [Strategic Perspective]
        
        ## Competitive Intelligence
        (Select TOP 5 most threatening or notable competitor moves:)
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
    pdf_filename = "dcga_report.pdf"
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

def deep_dive_search(topic: str):
    """
    Feature 3: Deep Dive Agent
    Performs a targeted search on a specific topic to get more details.
    """
    if not tavily:
        return "Error: Tavily API key not configured."
        
    try:
        # Search for detailed analysis and news
        query = f"{topic} analysis details implications compliance"
        results = tavily.search(query=query, topic="general", days=30, max_results=5)
        
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
