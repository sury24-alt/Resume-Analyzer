import os
import PyPDF2
from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from groq import Groq
from dotenv import load_dotenv
import json
from typing import List
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser, StrOutputParser
from smolagents import CodeAgent, DuckDuckGoSearchTool, LiteLLMModel

load_dotenv()

app = FastAPI()

# Groq Client Setup

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


class InterviewGenerateRequest(BaseModel):
    resume_text: str = Field(..., min_length=1)
    job_role: str = Field(..., min_length=1)

class InterviewEvaluateRequest(BaseModel):
    resume_text: str = Field(..., min_length=1)
    job_role: str = Field(..., min_length=1)
    questions: List[str]
    answers: List[str]

class ResearchRequest(BaseModel):
    company_name: str
    job_role: str

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

# ── LangChain Setup ──────────────────────────────────────────────────────────

def get_chat_model():
    api_key = os.getenv("GROQ_API_KEY", "")
    if not api_key:
        return None
    return ChatGroq(api_key=api_key, model_name="llama-3.3-70b-versatile", temperature=0.7)

GENERATE_QUESTIONS_PROMPT = PromptTemplate(
    template="""You are an expert technical interviewer. Based on the candidate's resume and the target job role, generate exactly 3 challenging technical interview questions. 
    The questions should test the specific skills and experience claimed in the resume relevant to the role.
    
    Resume: {resume_text}
    Job Role: {job_role}
    
    Respond ONLY with a valid JSON array of 3 strings. Example: ["question 1", "question 2", "question 3"]""",
    input_variables=["resume_text", "job_role"]
)

EVALUATE_ANSWERS_PROMPT = PromptTemplate(
    template="""You are an expert technical interviewer. Review the candidate's answers to the interview questions based on their resume and target role.
    
    Resume: {resume_text}
    Job Role: {job_role}
    
    Questions and Candidate's Answers:
    {q_and_a}
    
    Provide constructive feedback for each answer. Highlight strengths, identify weaknesses, and suggest improvements or what a 'perfect' answer would look like. 
    Use markdown syntax for formatting.""",
    input_variables=["resume_text", "job_role", "q_and_a"]
)

# ── Routes ───────────────────────────────────────────────────────────────────

# ── API Routes ───────────────────────────────────────────────────────────


@app.post("/api/analyze")
async def analyze(data: AnalyzeRequest):
    result = analyze_resume(data.resume_text, data.job_role)
    return {"result": result}


@app.post("/api/suggest_jobs")
async def suggest_jobs_route(data: SuggestJobsRequest):
    result = suggest_jobs(data.resume_text)
    return {"result": result}


@app.post("/api/interview/generate")
async def generate_questions(data: InterviewGenerateRequest):
    chat = get_chat_model()
    if not chat:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not configured")
    
    chain = GENERATE_QUESTIONS_PROMPT | chat | JsonOutputParser()
    try:
        questions = chain.invoke({"resume_text": data.resume_text, "job_role": data.job_role})
        return {"questions": questions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/interview/evaluate")
async def evaluate_answers(data: InterviewEvaluateRequest):
    chat = get_chat_model()
    if not chat:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not configured")
    
    q_and_a = ""
    for i, (q, a) in enumerate(zip(data.questions, data.answers)):
        q_and_a += f"Q{i+1}: {q}\nAnswer: {a}\n\n"
        
    chain = EVALUATE_ANSWERS_PROMPT | chat | StrOutputParser()
    try:
        feedback = chain.invoke({
            "resume_text": data.resume_text, 
            "job_role": data.job_role,
            "q_and_a": q_and_a
        })
        return {"feedback": feedback}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/research")
async def research_company(data: ResearchRequest):
    api_key = os.getenv("GROQ_API_KEY", "")
    if not api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not configured")
    
    try:
        # Use LiteLLMModel to connect smolagents to Groq
        # Note: LiteLLM uses 'groq/' prefix for groq models
        model = LiteLLMModel(
            model_id="groq/llama-3.3-70b-versatile",
            api_key=api_key
        )
        
        search_tool = DuckDuckGoSearchTool()
        # CodeAgent is the autonomous agent that can write code to solve tasks
        agent = CodeAgent(tools=[search_tool], model=model, add_base_tools=True)
        
        prompt = f"""
        Research the company '{data.company_name}' for a candidate applying for the '{data.job_role}' position.
        
        Your goal is to provide 'Strategic Intelligence' that helps the candidate stand out in interviews.
        1. Find 2-3 recent news items or major achievements of the company from the last year.
        2. Identify their core values, mission, or corporate culture based on their official statements.
        3. Search for common interview themes or the technical stack used at {data.company_name} for {data.job_role} roles.
        4. Provide 3 specific, insightful 'Power Questions' the candidate should ask the interviewer to show they've done their homework.
        
        Format your final answer in clean, professional Markdown.
        """
        
        result = agent.run(prompt)
        return {"result": str(result)}
    except Exception as e:
        print(f"Agent Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


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
