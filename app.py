import os
import PyPDF2
from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel, Field
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Mount static files and templates
try:
    app.mount("/static", StaticFiles(directory=os.path.join(BASE_DIR, "static")), name="static")
except RuntimeError:
    pass
templates = Jinja2Templates(directory=os.path.join(BASE_DIR, "templates"))

def get_groq_client():
    api_key = os.getenv("GROQ_API_KEY", "")
    if not api_key:
        return None
    return Groq(api_key=api_key)

client = get_groq_client()


# ── Pydantic Models ──────────────────────────────────────────────────────────

class AnalyzeRequest(BaseModel):
    resume_text: str = Field(..., min_length=1, description="The full text of the resume")
    job_role: str = Field(..., min_length=1, description="Target job role to analyze against")


class SuggestJobsRequest(BaseModel):
    resume_text: str = Field(..., min_length=1, description="The full text of the resume")


# ── Helper Functions ─────────────────────────────────────────────────────────

def ask_groq(prompt, max_retries=2):
    for attempt in range(max_retries):
        try:
            if client is None:
                return "Error: GROQ_API_KEY environment variable is not set."
            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
            )
            return response.choices[0].message.content
        except Exception as e:
            if attempt < max_retries - 1:
                import time
                time.sleep(1)
            else:
                return f"Error: {str(e)}"


def analyze_resume(resume_text, job_role):
    prompt = f"""
    You are an expert AI Resume & CV Analyzer with deep knowledge of hiring practices, ATS systems, recruiter psychology, and career positioning. You analyze documents with the precision of a senior recruiter and the strategic insight of a career coach.

    Analyze this resume for a {job_role} position.
    
    Resume:
    {resume_text}
    
    When a resume or CV is provided, always return:
    
    1. ATS Score -> 0-100 with breakdown by category
    2. Keyword Gaps -> missing skills vs job description
    3. Impact Metrics -> weak bullets -> quantified rewrites
    4. Section Audit -> Summary, Skills, XP, Education, Projects
    
    Be specific and actionable! Use markdown syntax for the response.
    """
    return ask_groq(prompt)


def suggest_jobs(resume_text):
    prompt = f"""
    Based on the following resume, suggest 5 suitable job roles.
    For each role, provide:
    1. Job Title
    2. Why it matches the resume
    3. Estimated Salary Range
    4. Key Skills Required
    
    Resume:
    {resume_text}
    Use markdown syntax for the response.
    """
    return ask_groq(prompt)


# ── Routes ───────────────────────────────────────────────────────────────────

@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    return templates.TemplateResponse(request=request, name="index.html")


@app.post("/api/analyze")
async def analyze(data: AnalyzeRequest):
    result = analyze_resume(data.resume_text, data.job_role)
    return {"result": result}


@app.post("/api/suggest_jobs")
async def suggest_jobs_route(data: SuggestJobsRequest):
    result = suggest_jobs(data.resume_text)
    return {"result": result}


@app.post("/api/extract_pdf")
async def extract_pdf(file: UploadFile = File(...)):
    if not file.filename or not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Invalid file format, please upload a PDF")

    try:
        contents = await file.read()
        import io
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(contents))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text()
        return {"text": text}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading PDF: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8506)
