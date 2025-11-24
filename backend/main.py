from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
import time

app = FastAPI()

class ScoutConfig(BaseModel):
    timeRange: str

from fastapi.responses import FileResponse
from agent import run_agent
import os

@app.post("/api/run")
async def run_scout(config: ScoutConfig):
    # Call the real agent logic
    report = run_agent(config.timeRange)
    
    return {"status": "success", "report": report}

@app.get("/api/download_pdf")
async def download_pdf():
    file_path = "dcga_report.pdf"
    if os.path.exists(file_path):
        return FileResponse(file_path, media_type='application/pdf', filename="DCGA_Intelligence_Report.pdf")
    return {"error": "Report not found"}

@app.get("/health")
async def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
