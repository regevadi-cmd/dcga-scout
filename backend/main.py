from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
import time

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

class ScoutConfig(BaseModel):
    timeRange: str
    searchProvider: str = "tavily"
    useMockData: bool = False
    searchMode: str = "deep" # "fast" or "deep"

class ChatRequest(BaseModel):
    report_context: str
    user_message: str

class EmailRequest(BaseModel):
    insight_text: str
    recipient_name: str = "Client"

class DeepDiveRequest(BaseModel):
    topic: str
    searchProvider: str = "tavily"

class AudioRequest(BaseModel):
    report_text: str

class BattlecardRequest(BaseModel):
    competitors: list[str]

from fastapi.responses import FileResponse
from agent import run_agent, chat_with_report, generate_sales_email, deep_dive_search, generate_audio_summary, generate_swot
import os

@app.post("/api/run")
async def run_scout(config: ScoutConfig):
    report_text = run_agent(config.timeRange, config.searchProvider, config.useMockData, config.searchMode)
    return {"report": report_text, "pdf_url": "/api/report/pdf"}

@app.post("/api/chat")
async def chat(request: ChatRequest):
    response = chat_with_report(request.report_context, request.user_message)
    return {"response": response}

@app.post("/api/draft_email")
async def draft_email(request: EmailRequest):
    email = generate_sales_email(request.insight_text, request.recipient_name)
    return {"email": email}

@app.post("/api/deep_dive")
async def deep_dive(request: DeepDiveRequest):
    summary = deep_dive_search(request.topic, request.searchProvider)
    return {"summary": summary}

@app.post("/api/audio")
async def generate_audio(request: AudioRequest):
    audio_path = generate_audio_summary(request.report_text)
    return FileResponse(audio_path, media_type="audio/mpeg", filename="briefing.mp3")

@app.post("/api/battlecards")
async def battlecards(request: BattlecardRequest):
    cards = generate_swot(request.competitors)
    return {"cards": cards}

@app.get("/api/report/pdf")
async def get_report_pdf():
    file_path = "dcga_report_v2.pdf"
    if os.path.exists(file_path):
        return FileResponse(file_path, media_type="application/pdf", filename="dcga_report_v2.pdf")
    return {"error": "Report not found"}

@app.get("/health")
async def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
