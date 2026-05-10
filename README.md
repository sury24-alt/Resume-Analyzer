# 🚀 AI Resume Analyzer & Builder

An AI-powered career command center that analyzes your resume, provides ATS optimization insights, matches you with ideal job roles, and includes a built-in resume builder.

![Python](https://img.shields.io/badge/Python-3.10+-blue?logo=python)
![Flask](https://img.shields.io/badge/Flask-3.x-green?logo=flask)
![Groq](https://img.shields.io/badge/AI-Groq%20LLaMA-purple)

## ✨ Features

- **📄 PDF Upload** — Drag & drop or click to upload your resume (PDF)
- **🧠 AI Deep Analysis** — ATS score, keyword gaps, impact metrics, section audit powered by Groq LLaMA 3.3
- **🎯 Smart Job Matching** — AI-curated job role suggestions based on your profile
- **✏️ Resume Builder** — Build and customize your resume with live preview, theme colors, fonts, and PDF export
- **🌙 Premium Dark Theme** — Glassmorphism UI with smooth animations

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python, Flask |
| AI Model | Groq API (LLaMA 3.3 70B) |
| Frontend | HTML5, CSS3, JavaScript |
| PDF Parsing | PyPDF2 |
| Markdown | marked.js |

## 📦 Setup

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/Resume-Analyzer.git
cd Resume-Analyzer

# Create virtual environment
python -m venv .venv
.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # Mac/Linux

# Install dependencies
pip install flask groq PyPDF2 python-dotenv

# Set up environment variables
# Create a .env file with:
# GROQ_API_KEY=your_groq_api_key_here

# Run the app
python app.py
```

## 🌐 Usage

1. Open `http://127.0.0.1:8506` in your browser
2. Upload your resume PDF on the Upload page
3. Enter your target job role and hit **Start Analysis**
4. View AI-generated feedback on the Results page
5. Generate job recommendations on the Jobs page
6. Build/customize resumes on the Resume Builder page

## 📁 Project Structure

```
Resume-Analyzer/
├── app.py                 # Flask backend with Groq AI integration
├── templates/
│   └── index.html         # Main SPA template (all pages)
├── static/
│   ├── style.css          # Additional styles
│   └── script.js          # Additional scripts
├── .env                   # API keys (not committed)
├── .gitignore
├── requirements.txt
└── README.md
```

## 📝 License

MIT License — feel free to use and modify.
