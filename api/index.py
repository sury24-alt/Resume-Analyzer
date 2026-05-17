import os
import io
import json
import asyncio
import uuid
from typing import List

import PyPDF2
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# ── Groq Client Setup ────────────────────────────────────────────────────────

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

class VaultSearchRequest(BaseModel):
    query: str

# ── Helper Functions ─────────────────────────────────────────────────────────

def ask_groq(prompt: str, max_retries: int = 2, parse_json: bool = False):
    """Send a prompt to Groq and return the response text (or parsed JSON)."""
    for attempt in range(max_retries):
        try:
            if client is None:
                return "Error: GROQ_API_KEY environment variable is not set."
            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
            )
            text = response.choices[0].message.content
            if parse_json:
                return json.loads(text)
            return text
        except Exception as e:
            if attempt < max_retries - 1:
                import time
                time.sleep(1)
            else:
                if parse_json:
                    return None
                return f"Error: {str(e)}"


async def ask_groq_async(prompt: str):
    """Run ask_groq in a thread so multiple calls can run concurrently."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, ask_groq, prompt)


# ── Prompt Templates ─────────────────────────────────────────────────────────

def resume_grader_prompt(resume_text: str, job_role: str) -> str:
    return f"""You are an expert ATS Grader. Grade this resume for a {job_role} position.

Resume: {resume_text}

Return:
1. Overall ATS Score (0-100)
2. Detailed breakdown (Formatting, Quantifiable Impact, Skill Match)
3. Top 3 immediate improvements needed.

Format in Markdown."""

def keyword_optimizer_prompt(resume_text: str, job_role: str) -> str:
    return f"""You are a Keyword Optimization Expert. Analyze this resume for a {job_role} role and identify keyword gaps.

Resume: {resume_text}

Return:
1. Critical missing keywords vs {job_role} expectations.
2. Skills you have but aren't highlighted enough.
3. Actionable advice on where to insert these keywords.

Format in Markdown."""

def job_matcher_prompt(resume_text: str) -> str:
    return f"""Based on this resume analysis, suggest 3 highly specific job roles that the candidate is already 80% qualified for.

Resume: {resume_text}

For each role, provide:
1. Role Title
2. Match Strength (%)
3. One 'Killer Bullet' to add to the resume for this specific role.

Format in Markdown."""

def generate_questions_prompt(resume_text: str, job_role: str) -> str:
    return f"""You are an expert technical interviewer. Based on the candidate's resume and the target job role, generate exactly 3 challenging technical interview questions. 
The questions should test the specific skills and experience claimed in the resume relevant to the role.

Resume: {resume_text}
Job Role: {job_role}

Respond ONLY with a valid JSON array of 3 strings. Example: ["question 1", "question 2", "question 3"]"""

def evaluate_answers_prompt(resume_text: str, job_role: str, q_and_a: str) -> str:
    return f"""You are an expert technical interviewer. Review the candidate's answers to the interview questions based on their resume and target role.

Resume: {resume_text}
Job Role: {job_role}

Questions and Candidate's Answers:
{q_and_a}

Provide constructive feedback for each answer. Highlight strengths, identify weaknesses, and suggest improvements or what a 'perfect' answer would look like. 
Use markdown syntax for formatting."""


# ── API Routes ───────────────────────────────────────────────────────────────


@app.post("/api/extract_pdf")
async def extract_pdf(file: UploadFile = File(...)):
    if not file.filename or not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Invalid file format, please upload a PDF")

    try:
        contents = await file.read()
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(contents))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text()
        return {"text": text}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading PDF: {str(e)}")


@app.post("/api/analyze")
async def analyze_route(data: AnalyzeRequest):
    if client is None:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not configured")

    try:
        # Orchestration: Run 3 steps concurrently
        grading_task = ask_groq_async(resume_grader_prompt(data.resume_text, data.job_role))
        keyword_task = ask_groq_async(keyword_optimizer_prompt(data.resume_text, data.job_role))
        job_task = ask_groq_async(job_matcher_prompt(data.resume_text))

        grade, keywords, jobs = await asyncio.gather(grading_task, keyword_task, job_task)

        # Combine results
        final_report = f"""
# 🚀 Orchestrated Resume Intelligence

## 📊 Step 1: Strategic Grading
{grade}

---

## 🔑 Step 2: Keyword Optimization
{keywords}

---

## 🎯 Step 3: Ideal Job Matches
{jobs}
        """
        return {"result": final_report}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/interview/generate")
async def generate_questions(data: InterviewGenerateRequest):
    if client is None:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not configured")

    try:
        prompt = generate_questions_prompt(data.resume_text, data.job_role)
        result = ask_groq(prompt, parse_json=True)
        if result is None:
            raise HTTPException(status_code=500, detail="Failed to parse questions from AI response")
        return {"questions": result}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/interview/evaluate")
async def evaluate_answers(data: InterviewEvaluateRequest):
    if client is None:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not configured")

    q_and_a = ""
    for i, (q, a) in enumerate(zip(data.questions, data.answers)):
        q_and_a += f"Q{i+1}: {q}\nAnswer: {a}\n\n"

    try:
        prompt = evaluate_answers_prompt(data.resume_text, data.job_role, q_and_a)
        feedback = ask_groq(prompt)
        return {"feedback": feedback}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/research")
async def research_company(data: ResearchRequest):
    if client is None:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not configured")

    try:
        # Try using DuckDuckGo search for live data
        from smolagents import DuckDuckGoSearchTool
        search_tool = DuckDuckGoSearchTool()
        search_query = f"{data.company_name} recent news core values interview questions for {data.job_role}"
        search_results = search_tool(search_query)

        prompt = f"""
        You are a Strategic Career Intelligence Agent. 
        Research has been performed for '{data.company_name}' and the role '{data.job_role}'.
        
        RAW SEARCH DATA:
        {search_results}
        
        Using the search data above (and your internal knowledge), provide a 'Strategic Intelligence Report' in Markdown:
        1. **Recent News**: 2-3 major achievements or news items from the last year.
        2. **Culture & Values**: Core mission and workplace culture.
        3. **Interview Intel**: Common themes, technical stack, or expectations for {data.job_role}.
        4. **Power Questions**: 3 high-level questions for the candidate to ask.
        
        Be professional, concise, and insightful.
        """
        result = ask_groq(prompt)
        return {"result": result}
    except Exception as e:
        print(f"Research Error: {str(e)}")
        # Fallback if search fails - still provide some AI insight
        prompt = f"Provide strategic interview intelligence for {data.company_name} and the role {data.job_role} based on your general knowledge. Include news, culture, and 3 power questions. Use Markdown."
        result = ask_groq(prompt)
        return {"result": result}


@app.post("/api/vault/search")
async def search_vault(data: VaultSearchRequest):
    """Vault search requires Pinecone + HuggingFace — returns a friendly error if not configured."""
    try:
        from pinecone import Pinecone
        api_key = os.getenv("PINECONE_API_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="Pinecone not configured. Set PINECONE_API_KEY.")
        
        pc = Pinecone(api_key=api_key)
        index_name = os.getenv("PINECONE_INDEX", "resumes")
        pinecone_index = pc.Index(index_name)

        # Use Groq to create a simple text-based search since HuggingFace embeddings
        # may not be available. For full vector search, configure HUGGINGFACE_API_KEY.
        hf_key = os.getenv("HUGGINGFACE_API_KEY", "")
        if not hf_key:
            raise HTTPException(status_code=500, detail="HUGGINGFACE_API_KEY not configured for vector search.")
        
        from langchain_community.embeddings import HuggingFaceInferenceAPIEmbeddings
        embeddings = HuggingFaceInferenceAPIEmbeddings(
            api_key=hf_key,
            model_name="sentence-transformers/all-MiniLM-L6-v2"
        )
        query_vector = embeddings.embed_query(data.query)

        results = pinecone_index.query(
            vector=query_vector,
            top_k=5,
            include_metadata=True
        )

        formatted_results = []
        for res in results["matches"]:
            formatted_results.append({
                "id": res["id"],
                "score": res["score"],
                "metadata": res["metadata"]
            })

        return {"results": formatted_results}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8506)
