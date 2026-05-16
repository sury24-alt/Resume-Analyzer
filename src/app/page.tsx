"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, BrainCircuit, Target, Briefcase, Download, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

type Tab = "dashboard" | "upload" | "results" | "jobs" | "builder" | "interview";

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [resumeText, setResumeText] = useState("");
  const [jobRole, setJobRole] = useState("");
  const [analysisResult, setAnalysisResult] = useState("");
  const [jobsResult, setJobsResult] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingJobs, setIsGeneratingJobs] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");

  // Interview Whisperer State
  const [interviewQuestions, setInterviewQuestions] = useState<string[]>([]);
  const [userAnswers, setUserAnswers] = useState<string[]>(["", "", ""]);
  const [interviewFeedback, setInterviewFeedback] = useState("");
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [isEvaluatingAnswers, setIsEvaluatingAnswers] = useState(false);

  // Builder State
  const [builderColor, setBuilderColor] = useState("#a78bfa");
  const [builderFont, setBuilderFont] = useState("'Inter', sans-serif");
  const [builderName, setBuilderName] = useState("Jane Doe");
  const [builderTitle, setBuilderTitle] = useState("Senior Product Designer");
  const [builderEmail, setBuilderEmail] = useState("jane.doe@example.com");
  const [builderSummary, setBuilderSummary] = useState(
    "Creative and detail-oriented product designer with 6+ years of experience in crafting user-centric digital experiences. Proven track record of improving user engagement and translating complex requirements into beautiful interfaces."
  );

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleFileUpload = async (file: File) => {
    if (!file.name.endsWith(".pdf")) {
      showToast("Please upload a PDF file only.", "error");
      return;
    }

    setUploadStatus("⏳ Extracting text from PDF...");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/extract_pdf", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (data.error || !response.ok) {
        setUploadStatus(data.error || data.detail || "Error extracting PDF.");
        showToast(data.error || data.detail || "Error extracting PDF.", "error");
      } else {
        setResumeText(data.text);
        setUploadStatus(`✅ Loaded: ${file.name}`);
        showToast(`Resume "${file.name}" uploaded successfully!`, "success");
      }
    } catch {
      setUploadStatus("Error uploading file. Make sure the server is running.");
      showToast("Error uploading file. Is the server running?", "error");
    }
  };

  const handleAnalyze = async () => {
    if (!resumeText) {
      showToast("Please upload a resume first.", "error");
      return;
    }
    if (!jobRole.trim()) {
      showToast("Please enter a target job role.", "error");
      return;
    }

    setActiveTab("results");
    setIsAnalyzing(true);
    setAnalysisResult("");

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume_text: resumeText, job_role: jobRole }),
      });
      const data = await response.json();
      if (data.error || !response.ok) {
        showToast(data.error || "Analysis failed", "error");
        setActiveTab("upload");
      } else {
        setAnalysisResult(data.result);
        showToast("Analysis complete!", "success");
      }
    } catch {
      showToast("Error analyzing resume. Please try again.", "error");
      setActiveTab("upload");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSuggestJobs = async () => {
    if (!resumeText) {
      showToast("Please upload a resume first.", "error");
      setActiveTab("upload");
      return;
    }

    setActiveTab("jobs");
    setIsGeneratingJobs(true);
    setJobsResult("");

    try {
      const response = await fetch("/api/suggest_jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume_text: resumeText }),
      });
      const data = await response.json();
      if (data.error || !response.ok) {
        showToast(data.error || "Job suggestion failed", "error");
      } else {
        setJobsResult(data.result);
        showToast("Job recommendations generated!", "success");
      }
    } catch {
      showToast("Error suggesting jobs. Please try again.", "error");
    } finally {
      setIsGeneratingJobs(false);
    }
  };

  const handleGenerateQuestions = async () => {
    if (!resumeText) {
      showToast("Please upload a resume first.", "error");
      setActiveTab("upload");
      return;
    }
    if (!jobRole.trim()) {
      showToast("Please enter a target job role in the Upload tab.", "error");
      setActiveTab("upload");
      return;
    }

    setIsGeneratingQuestions(true);
    setInterviewQuestions([]);
    setInterviewFeedback("");
    setUserAnswers(["", "", ""]);

    try {
      const response = await fetch("/api/interview/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume_text: resumeText, job_role: jobRole }),
      });
      const data = await response.json();
      if (data.error || !response.ok) {
        showToast(data.error || "Failed to generate questions", "error");
      } else {
        setInterviewQuestions(data.questions);
        showToast("Technical questions generated!", "success");
      }
    } catch {
      showToast("Error generating questions.", "error");
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const handleEvaluateAnswers = async () => {
    if (userAnswers.some((a) => !a.trim())) {
      showToast("Please answer all 3 questions before submitting.", "error");
      return;
    }

    setIsEvaluatingAnswers(true);
    setInterviewFeedback("");

    try {
      const response = await fetch("/api/interview/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume_text: resumeText,
          job_role: jobRole,
          questions: interviewQuestions,
          answers: userAnswers,
        }),
      });
      const data = await response.json();
      if (data.error || !response.ok) {
        showToast(data.error || "Failed to evaluate answers", "error");
      } else {
        setInterviewFeedback(data.feedback);
        showToast("Feedback generated!", "success");
      }
    } catch {
      showToast("Error evaluating answers.", "error");
    } finally {
      setIsEvaluatingAnswers(false);
    }
  };

  return (
    <>
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className={`fixed top-24 right-6 z-50 px-6 py-4 rounded-xl backdrop-blur-xl border font-medium shadow-2xl max-w-sm ${
              toast.type === "success"
                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                : toast.type === "error"
                ? "bg-red-500/15 border-red-500/30 text-red-400"
                : "bg-indigo-500/15 border-indigo-500/30 text-indigo-400"
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <nav className="sticky top-0 z-40 flex flex-wrap justify-center gap-8 px-6 py-5 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/10 shadow-lg print:hidden">
        {[
          { id: "dashboard", label: "Dashboard" },
          { id: "upload", label: "Upload Resume" },
          { id: "results", label: "Analysis Results" },
          { id: "jobs", label: "Job Matches" },
          { id: "interview", label: "Interview Whisperer" },
          { id: "builder", label: "Resume Builder" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={`pb-1 font-medium text-lg transition-colors border-b-2 ${
              activeTab === tab.id
                ? "text-[var(--color-primary)] border-[var(--color-primary)]"
                : "text-[var(--color-muted)] border-transparent hover:text-[var(--color-primary)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="container max-w-6xl mx-auto px-6 py-16 flex-1">
        <AnimatePresence mode="wait">
          {/* Dashboard */}
          {activeTab === "dashboard" && (
            <motion.main
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center text-center min-h-[50vh]"
            >
              <h1 className="text-6xl font-extrabold mb-6 font-outfit tracking-tight leading-tight">
                AI-Powered <br />
                <span className="text-[var(--color-primary)]">Career Command Center</span>
              </h1>
              <p className="text-xl text-[var(--color-muted)] mb-10 max-w-2xl">
                Elevate your professional trajectory with intelligent resume analysis, automated job matching, and our native resume builder.
              </p>
              <div className="flex flex-wrap justify-center gap-5">
                <button
                  onClick={() => setActiveTab("upload")}
                  className="bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] text-[#0a0a0f] px-10 py-4 rounded-full font-semibold text-lg hover:shadow-[0_6px_20px_rgba(167,139,250,0.35)] transition-all hover:-translate-y-1"
                >
                  🚀 Analyze Resume
                </button>
                <button
                  onClick={() => setActiveTab("builder")}
                  className="border-2 border-[var(--color-primary)] text-[var(--color-primary)] px-10 py-4 rounded-full font-semibold text-lg hover:bg-[var(--color-primary)]/10 transition-all hover:-translate-y-1"
                >
                  ✏️ Build New Resume
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 w-full">
                <div className="glass p-8 rounded-2xl flex flex-col items-center">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 bg-[var(--color-primary)]/15 border border-[var(--color-primary)]/20 text-2xl">
                    📄
                  </div>
                  <div className="text-4xl font-extrabold text-[var(--color-primary)] mb-2">1</div>
                  <div className="text-lg font-semibold text-[var(--color-foreground)]">Upload your Resume</div>
                  <p className="text-[var(--color-muted)] mt-2 text-sm">Provide your current resume in PDF format for AI analysis.</p>
                </div>
                <div className="glass p-8 rounded-2xl flex flex-col items-center">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 bg-[var(--color-primary)]/15 border border-[var(--color-primary)]/20 text-2xl">
                    🧠
                  </div>
                  <div className="text-4xl font-extrabold text-[var(--color-primary)] mb-2">2</div>
                  <div className="text-lg font-semibold text-[var(--color-foreground)]">AI Deep Analysis</div>
                  <p className="text-[var(--color-muted)] mt-2 text-sm">Our AI scores your resume, detects gaps, and suggests improvements.</p>
                </div>
                <div className="glass p-8 rounded-2xl flex flex-col items-center">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 bg-[var(--color-primary)]/15 border border-[var(--color-primary)]/20 text-2xl">
                    🎯
                  </div>
                  <div className="text-4xl font-extrabold text-[var(--color-primary)] mb-2">3</div>
                  <div className="text-lg font-semibold text-[var(--color-foreground)]">Smart Job Match</div>
                  <p className="text-[var(--color-muted)] mt-2 text-sm">Get curated job recommendations tailored to your profile.</p>
                </div>
              </div>
            </motion.main>
          )}

          {/* Upload */}
          {activeTab === "upload" && (
            <motion.main
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center text-center min-h-[60vh]"
            >
              <h1 className="text-5xl font-extrabold mb-4 font-outfit">
                Analyze your resume.<br />
                <span className="text-[var(--color-primary)]">Stand out.</span>
              </h1>
              <p className="text-xl text-[var(--color-muted)] mb-10 h-8">ATS optimization. Skill detection. Job matching.</p>

              <label className="w-full max-w-xl h-72 border-2 border-dashed border-[var(--color-primary)]/30 rounded-2xl bg-[var(--color-surface)] backdrop-blur-xl flex flex-col items-center justify-center cursor-pointer transition-all hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 hover:shadow-[0_0_30px_rgba(167,139,250,0.15)] mb-8 group">
                <input
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])}
                />
                <UploadCloud className="w-16 h-16 text-[var(--color-primary)] mb-5 group-hover:-translate-y-1 transition-transform" />
                <p className="text-lg font-medium mb-2 text-[var(--color-foreground)]">Drag & Drop or Click to Upload</p>
                <p className="text-[var(--color-muted)] text-sm mb-4">PDF file up to 5MB</p>
                {uploadStatus && <div className="text-[var(--color-success)] font-semibold">{uploadStatus}</div>}
              </label>

              <div className="w-full max-w-xl text-left mb-8">
                <label className="block font-semibold mb-2 text-[var(--color-foreground)]">Target Job Role (Required for Analysis)</label>
                <input
                  type="text"
                  value={jobRole}
                  onChange={(e) => setJobRole(e.target.value)}
                  placeholder="e.g. Senior Frontend Developer, Data Scientist"
                  className="w-full p-4 border border-[var(--color-border)] rounded-xl bg-white/5 text-[var(--color-foreground)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all"
                />
              </div>

              <button
                onClick={handleAnalyze}
                className="bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] text-[#0a0a0f] px-10 py-4 rounded-xl font-semibold text-lg hover:shadow-[0_6px_20px_rgba(167,139,250,0.35)] transition-all hover:-translate-y-1 flex items-center gap-2"
              >
                Start Analysis <BrainCircuit className="w-5 h-5" />
              </button>
            </motion.main>
          )}

          {/* Results */}
          {activeTab === "results" && (
            <motion.main
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="text-center mb-12">
                <h2 className="text-5xl font-extrabold font-outfit mb-3">
                  Analysis <span className="text-[var(--color-primary)]">Results</span>
                </h2>
                <p className="text-xl text-[var(--color-muted)]">Detailed AI Feedback</p>
              </div>

              {isAnalyzing ? (
                <div className="flex flex-col items-center py-20">
                  <Loader2 className="w-12 h-12 text-[var(--color-primary)] animate-spin mb-4" />
                  <p className="text-lg font-semibold">AI is analyzing your resume...</p>
                </div>
              ) : analysisResult ? (
                <>
                  <div className="glass p-10 min-h-[400px] markdown-content">
                    <ReactMarkdown>{analysisResult}</ReactMarkdown>
                  </div>
                  <div className="mt-12 text-center">
                    <button
                      onClick={handleSuggestJobs}
                      className="bg-[var(--color-success)] text-[#0a0a0f] px-10 py-4 rounded-xl font-semibold text-lg hover:shadow-[0_6px_20px_rgba(52,211,153,0.35)] transition-all hover:-translate-y-1 inline-flex items-center gap-2"
                    >
                      Generate Job Recommendations <Briefcase className="w-5 h-5" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="glass p-10 min-h-[400px] flex items-center justify-center">
                  <p className="text-xl text-[var(--color-muted)]">Upload a resume and start analysis to see results here.</p>
                </div>
              )}
            </motion.main>
          )}

          {/* Jobs */}
          {activeTab === "jobs" && (
            <motion.main
              key="jobs"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="text-center mb-12">
                <h2 className="text-5xl font-extrabold font-outfit mb-3">
                  Recommended <span className="text-[var(--color-success)]">Roles</span>
                </h2>
                <p className="text-xl text-[var(--color-muted)]">AI-Matched opportunities for your profile</p>
              </div>

              {isGeneratingJobs ? (
                <div className="flex flex-col items-center py-20">
                  <Loader2 className="w-12 h-12 text-[var(--color-success)] animate-spin mb-4" />
                  <p className="text-lg font-semibold">Finding the best roles for you...</p>
                </div>
              ) : jobsResult ? (
                <div className="glass p-10 min-h-[400px] markdown-content">
                  <ReactMarkdown>{jobsResult}</ReactMarkdown>
                </div>
              ) : (
                <div className="glass p-10 min-h-[400px] flex items-center justify-center">
                  <p className="text-xl text-[var(--color-muted)]">Generate job recommendations from the Results tab to see them here.</p>
                </div>
              )}
            </motion.main>
          )}

          {/* Builder */}
          {activeTab === "builder" && (
            <motion.main
              key="builder"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="mb-10 text-center md:text-left print:hidden">
                <h2 className="text-5xl font-extrabold font-outfit mb-3">
                  Resume <span className="text-[var(--color-primary)]">Builder</span>
                </h2>
                <p className="text-xl text-[var(--color-muted)]">Customize your professional identity directly in the browser.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-10">
                {/* Editor Panel */}
                <div className="glass p-8 self-start print:hidden">
                  <h3 className="text-2xl font-bold mb-6 font-outfit">Theme Settings</h3>
                  
                  <div className="mb-5">
                    <label className="block font-semibold mb-2">Accent Color</label>
                    <input
                      type="color"
                      value={builderColor}
                      onChange={(e) => setBuilderColor(e.target.value)}
                      className="w-full h-12 rounded-lg cursor-pointer border-none p-0"
                    />
                  </div>

                  <div className="mb-8">
                    <label className="block font-semibold mb-2">Typography Style</label>
                    <select
                      value={builderFont}
                      onChange={(e) => setBuilderFont(e.target.value)}
                      className="w-full p-3 border border-[var(--color-border)] rounded-lg bg-white/5 focus:ring-2 focus:ring-[var(--color-primary)]/20"
                    >
                      <option value="var(--font-poppins)">Modern Sans (Poppins)</option>
                      <option value="Arial, sans-serif">Clean Sans (Arial)</option>
                      <option value="Georgia, serif">Classic Serif (Georgia)</option>
                    </select>
                  </div>

                  <h3 className="text-2xl font-bold mb-6 font-outfit">Personal Details</h3>

                  <div className="space-y-5">
                    <div>
                      <label className="block font-semibold mb-2">Full Name</label>
                      <input
                        type="text"
                        value={builderName}
                        onChange={(e) => setBuilderName(e.target.value)}
                        className="w-full p-3 border border-[var(--color-border)] rounded-lg bg-white/5 focus:ring-2 focus:ring-[var(--color-primary)]/20"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-2">Professional Title</label>
                      <input
                        type="text"
                        value={builderTitle}
                        onChange={(e) => setBuilderTitle(e.target.value)}
                        className="w-full p-3 border border-[var(--color-border)] rounded-lg bg-white/5 focus:ring-2 focus:ring-[var(--color-primary)]/20"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-2">Email Address</label>
                      <input
                        type="text"
                        value={builderEmail}
                        onChange={(e) => setBuilderEmail(e.target.value)}
                        className="w-full p-3 border border-[var(--color-border)] rounded-lg bg-white/5 focus:ring-2 focus:ring-[var(--color-primary)]/20"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-2">Professional Summary</label>
                      <textarea
                        rows={5}
                        value={builderSummary}
                        onChange={(e) => setBuilderSummary(e.target.value)}
                        className="w-full p-3 border border-[var(--color-border)] rounded-lg bg-white/5 focus:ring-2 focus:ring-[var(--color-primary)]/20"
                      ></textarea>
                    </div>
                  </div>

                  <button
                    onClick={() => window.print()}
                    className="w-full mt-8 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] text-[#0a0a0f] py-4 rounded-xl font-bold text-lg hover:shadow-[0_4px_15px_rgba(167,139,250,0.4)] transition-all flex items-center justify-center gap-2"
                  >
                    <Download className="w-5 h-5" /> Download as PDF
                  </button>
                  <p className="text-center text-[var(--color-muted)] text-sm mt-3">
                    (Opens print dialog — select &quot;Save as PDF&quot;)
                  </p>
                </div>

                {/* Live Preview */}
                <div
                  id="resume-preview-container"
                  className="bg-white p-12 rounded-2xl shadow-2xl min-h-[900px] border border-[var(--color-border)] text-slate-900"
                  style={{ fontFamily: builderFont }}
                >
                  <div
                    className="flex gap-8 items-center pb-8 mb-8 border-b-4"
                    style={{ borderColor: builderColor }}
                  >
                    <div>
                      <h1
                        className="text-5xl font-bold mb-2 font-outfit"
                        style={{ color: builderColor }}
                      >
                        {builderName || "Your Name"}
                      </h1>
                      <h3 className="text-2xl text-slate-600 font-medium mb-2">
                        {builderTitle || "Professional Title"}
                      </h3>
                      <p className="text-slate-500">{builderEmail || "Email Address"}</p>
                    </div>
                  </div>

                  <div className="mb-8">
                    <h3
                      className="text-xl font-bold uppercase tracking-widest mb-4"
                      style={{ color: builderColor }}
                    >
                      Professional Profile
                    </h3>
                    <p className="text-slate-700 leading-relaxed text-lg">
                      {builderSummary || "Your professional summary will appear here."}
                    </p>
                  </div>

                  <div className="mb-8">
                    <h3
                      className="text-xl font-bold uppercase tracking-widest mb-4"
                      style={{ color: builderColor }}
                    >
                      Experience
                    </h3>
                    <div className="mb-5">
                      <div className="flex justify-between items-baseline mb-1">
                        <strong className="text-xl text-slate-900">Lead UI/UX Designer</strong>
                        <span className="text-slate-500 font-medium">2021 - Present</span>
                      </div>
                      <p className="text-slate-600 font-medium mb-3">TechCorp Inc. • San Francisco, CA</p>
                      <ul className="list-disc ml-5 text-slate-700 leading-relaxed space-y-1">
                        <li>Spearheaded the redesign of the core SaaS platform, increasing user retention by 35%.</li>
                        <li>Collaborated with a cross-functional team of 12 engineers and product managers.</li>
                        <li>Developed and maintained a comprehensive design system utilized across 4 flagship products.</li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h3
                      className="text-xl font-bold uppercase tracking-widest mb-4"
                      style={{ color: builderColor }}
                    >
                      Education & Skills
                    </h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <strong className="text-lg text-slate-900 block mb-1">B.S. Interaction Design</strong>
                        <span className="text-slate-500 block">University of Technology, 2018</span>
                      </div>
                      <div>
                        <div className="flex flex-wrap gap-2">
                          <span className="bg-slate-100 px-3 py-1 rounded text-sm text-slate-700">Figma</span>
                          <span className="bg-slate-100 px-3 py-1 rounded text-sm text-slate-700">Prototyping</span>
                          <span className="bg-slate-100 px-3 py-1 rounded text-sm text-slate-700">HTML/CSS</span>
                          <span className="bg-slate-100 px-3 py-1 rounded text-sm text-slate-700">User Research</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.main>
          )}

          {/* Interview Whisperer */}
          {activeTab === "interview" && (
            <motion.main
              key="interview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="min-h-[60vh]"
            >
              <div className="text-center mb-12">
                <h2 className="text-5xl font-extrabold font-outfit mb-3">
                  Interview <span className="text-[var(--color-primary)]">Whisperer</span>
                </h2>
                <p className="text-xl text-[var(--color-muted)]">AI-powered mock interview tailored to your resume.</p>
              </div>

              {!interviewQuestions.length && !isGeneratingQuestions && (
                <div className="text-center mt-16">
                  <button
                    onClick={handleGenerateQuestions}
                    className="bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] text-[#0a0a0f] px-10 py-4 rounded-xl font-semibold text-lg hover:shadow-[0_6px_20px_rgba(167,139,250,0.35)] transition-all hover:-translate-y-1 inline-flex items-center gap-2"
                  >
                    Generate Technical Questions <BrainCircuit className="w-5 h-5" />
                  </button>
                </div>
              )}

              {isGeneratingQuestions && (
                <div className="flex flex-col items-center py-20">
                  <Loader2 className="w-12 h-12 text-[var(--color-primary)] animate-spin mb-4" />
                  <p className="text-lg font-semibold">Crafting the perfect interview questions...</p>
                </div>
              )}

              {interviewQuestions.length > 0 && !interviewFeedback && !isEvaluatingAnswers && (
                <div className="max-w-4xl mx-auto space-y-8">
                  {interviewQuestions.map((q, idx) => (
                    <div key={idx} className="glass p-8 rounded-2xl">
                      <h3 className="text-xl font-bold mb-4 font-outfit text-[var(--color-primary)]">
                        Question {idx + 1}
                      </h3>
                      <p className="text-lg text-[var(--color-foreground)] mb-4">{q}</p>
                      <textarea
                        rows={4}
                        placeholder="Type your answer here..."
                        value={userAnswers[idx]}
                        onChange={(e) => {
                          const newAnswers = [...userAnswers];
                          newAnswers[idx] = e.target.value;
                          setUserAnswers(newAnswers);
                        }}
                        className="w-full p-4 border border-[var(--color-border)] rounded-xl bg-white/5 text-[var(--color-foreground)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all"
                      ></textarea>
                    </div>
                  ))}
                  <div className="text-center mt-8">
                    <button
                      onClick={handleEvaluateAnswers}
                      className="bg-[var(--color-success)] text-[#0a0a0f] px-10 py-4 rounded-xl font-semibold text-lg hover:shadow-[0_6px_20px_rgba(52,211,153,0.35)] transition-all hover:-translate-y-1 inline-flex items-center gap-2"
                    >
                      Submit Answers for Evaluation <Target className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}

              {isEvaluatingAnswers && (
                <div className="flex flex-col items-center py-20">
                  <Loader2 className="w-12 h-12 text-[var(--color-success)] animate-spin mb-4" />
                  <p className="text-lg font-semibold">Evaluating your answers...</p>
                </div>
              )}

              {interviewFeedback && (
                <div className="max-w-4xl mx-auto space-y-8">
                  <div className="glass p-10 min-h-[400px] markdown-content">
                    <h3 className="text-3xl font-extrabold font-outfit text-[var(--color-success)] mb-6 text-center border-b border-white/10 pb-4">
                      Feedback Report
                    </h3>
                    <ReactMarkdown>{interviewFeedback}</ReactMarkdown>
                  </div>
                  <div className="text-center">
                    <button
                      onClick={handleGenerateQuestions}
                      className="border-2 border-[var(--color-primary)] text-[var(--color-primary)] px-8 py-3 rounded-full font-semibold hover:bg-[var(--color-primary)]/10 transition-all"
                    >
                      Try Another Session
                    </button>
                  </div>
                </div>
              )}
            </motion.main>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
