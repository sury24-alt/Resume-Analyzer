# 🚀 Orchestrated AI Resume Analyzer

An advanced AI-powered career command center built with **Next.js**, **FastAPI**, and **LangChain**. It uses orchestrated AI pipelines to analyze resumes, identify keyword gaps, and provide deep strategic intelligence for job interviews.

![Python](https://img.shields.io/badge/Python-3.10+-blue?logo=python)
![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![Groq](https://img.shields.io/badge/AI-Groq%20LLaMA%203.3-purple)
![LangChain](https://img.shields.io/badge/Orchestration-LangChain-green)

## ✨ Features

- **📄 Orchestrated Analysis** — Uses a 3-step LangChain pipeline (Strategic Grading -> Keyword Optimization -> Ideal Job Matches).
- **🕵️ Deep Intel Agent** — Autonomous web researcher that finds company news, culture insights, and 'Power Questions' for your specific interview.
- **🗣️ Interview Whisperer** — AI-powered mock interviews tailored to your resume and target role.
- **🧠 Groq LLaMA 3.3 Power** — High-speed, high-intelligence processing for all career insights.
- **🌙 Modern UI** — Premium glassmorphism design with fluid animations via Framer Motion.

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 15, Tailwind CSS, Framer Motion |
| **Backend** | Python 3.10+, FastAPI |
| **Orchestration** | LangChain, smolagents |
| **AI Model** | Groq API (LLaMA 3.3 70B) |
| **Search Engine** | DuckDuckGo Search (via smolagents) |

## 📦 Setup & Deployment

### Vercel Deployment
This project is optimized for Vercel. 
1. Push to GitHub.
2. Link to Vercel.
3. Set `GROQ_API_KEY` in Environment Variables.
4. Ensure **Root Directory** is set to `./`.

### Local Development
```bash
# Install Python dependencies
pip install -r requirements.txt

# Install Frontend dependencies
npm install

# Run the app (ensure you have a .env file with GROQ_API_KEY)
npm run dev
```

## 📁 Project Structure

```
Resume-Analyzer/
├── api/                   # FastAPI backend (Vercel Functions)
│   └── index.py           # Orchestrated LangChain logic & Agents
├── src/                   # Next.js frontend
│   └── app/               # App Router pages
├── public/                # Static assets
├── vercel.json            # Deployment configuration
├── next.config.ts         # Next.js config
├── requirements.txt       # Python dependencies
└── package.json           # Node dependencies
```

## 📝 License
MIT License — feel free to use and modify.
