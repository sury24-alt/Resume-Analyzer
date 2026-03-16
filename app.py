import os
import PyPDF2
from flask import Flask, request, jsonify, render_template
from groq import Groq
from dotenv import load_dotenv

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

app = Flask(__name__)

def ask_groq(prompt, max_retries=2):
    for attempt in range(max_retries):
        try:
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

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/analyze", methods=["POST"])
def analyze():
    data = request.json
    resume_text = data.get("resume_text", "")
    job_role = data.get("job_role", "")
    if not resume_text:
        return jsonify({"error": "No resume text provided"}), 400
    if not job_role:
        return jsonify({"error": "No job role provided"}), 400
    
    result = analyze_resume(resume_text, job_role)
    return jsonify({"result": result})

@app.route("/api/suggest_jobs", methods=["POST"])
def suggest_jobs_route():
    data = request.json
    resume_text = data.get("resume_text", "")
    if not resume_text:
        return jsonify({"error": "No resume text provided"}), 400
    
    result = suggest_jobs(resume_text)
    return jsonify({"result": result})

@app.route("/api/extract_pdf", methods=["POST"])
def extract_pdf():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    if file and file.filename.endswith(".pdf"):
        pdf_reader = PyPDF2.PdfReader(file)
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text()
        return jsonify({"text": text})
    
    return jsonify({"error": "Invalid file format, please upload a PDF"}), 400

if __name__ == "__main__":
    app.run(debug=True, port=8506)
