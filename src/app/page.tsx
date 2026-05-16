"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, BrainCircuit, Target, Briefcase, Download, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

type Tab = "dashboard" | "upload" | "results" | "interview" | "intel";

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [resumeText, setResumeText] = useState("");
  const [jobRole, setJobRole] = useState("");
  const [analysisResult, setAnalysisResult] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");

  // Interview Whisperer State
  const [interviewQuestions, setInterviewQuestions] = useState<string[]>([]);
  const [userAnswers, setUserAnswers] = useState<string[]>(["", "", ""]);
  const [interviewFeedback, setInterviewFeedback] = useState("");
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [isEvaluatingAnswers, setIsEvaluatingAnswers] = useState(false);
  
  // Agent State
  const [companyName, setCompanyName] = useState("");
  const [intelResult, setIntelResult] = useState("");
  const [isResearching, setIsResearching] = useState(false);

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

  const handleResearchCompany = async () => {
    if (!companyName.trim()) {
      showToast("Please enter a company name.", "error");
      return;
    }
    if (!jobRole.trim()) {
      showToast("Please specify a job role in the Upload tab first.", "error");
      setActiveTab("upload");
      return;
    }

    setIsResearching(true);
    setIntelResult("");

    try {
      const response = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company_name: companyName, job_role: jobRole }),
      });
      const data = await response.json();
      if (data.error || !response.ok) {
        showToast(data.error || "Research failed", "error");
      } else {
        setIntelResult(data.result);
        showToast("Deep Intel report ready!", "success");
      }
    } catch {
      showToast("Error performing research.", "error");
    } finally {
      setIsResearching(false);
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
          { id: "intel", label: "Deep Intel" },
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
                Elevate your professional trajectory with intelligent resume analysis, automated job matching, and technical interview prep.
              </p>
              <div className="flex flex-wrap justify-center gap-5">
                <button
                  onClick={() => setActiveTab("upload")}
                  className="bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] text-[#0a0a0f] px-10 py-4 rounded-full font-semibold text-lg hover:shadow-[0_6px_20px_rgba(167,139,250,0.35)] transition-all hover:-translate-y-1"
                >
                  🚀 Analyze Resume
                </button>
                <button
                  onClick={() => setActiveTab("intel")}
                  className="border-2 border-[var(--color-primary)] text-[var(--color-primary)] px-10 py-4 rounded-full font-semibold text-lg hover:bg-[var(--color-primary)]/10 transition-all hover:-translate-y-1"
                >
                  🔍 Deep Research
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
            </motion.main>
          )}

          {/* Interview Whisperer */}

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

          {/* Deep Intel Agent */}
          {activeTab === "intel" && (
            <motion.main
              key="intel"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="min-h-[60vh]"
            >
              <div className="text-center mb-12">
                <h2 className="text-5xl font-extrabold font-outfit mb-3">
                  Deep <span className="text-[var(--color-primary)]">Intel</span> Agent
                </h2>
                <p className="text-xl text-[var(--color-muted)]">Autonomous web research to help you dominate your interview.</p>
              </div>

              <div className="max-w-2xl mx-auto mb-12">
                <div className="glass p-8 rounded-2xl">
                  <div className="mb-6">
                    <label className="block font-semibold mb-2 text-[var(--color-foreground)]">Which company are you interviewing with?</label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Google, NVIDIA, Stripe"
                      className="w-full p-4 border border-[var(--color-border)] rounded-xl bg-white/5 text-[var(--color-foreground)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all"
                    />
                  </div>
                  <div className="mb-6">
                    <label className="block font-semibold mb-2 text-[var(--color-muted)] text-sm">Target Role (Set in Upload tab)</label>
                    <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-[var(--color-foreground)]">
                      {jobRole || "No role specified yet"}
                    </div>
                  </div>
                  <button
                    onClick={handleResearchCompany}
                    disabled={isResearching}
                    className="w-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] text-[#0a0a0f] py-4 rounded-xl font-bold text-lg hover:shadow-[0_6px_20px_rgba(167,139,250,0.35)] transition-all hover:-translate-y-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:translate-y-0"
                  >
                    {isResearching ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" /> Agent is researching...
                      </>
                    ) : (
                      <>
                        Start Autonomous Research <Target className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              </div>

              {intelResult && (
                <div className="max-w-4xl mx-auto">
                  <div className="glass p-10 min-h-[400px] markdown-content border-[var(--color-primary)]/30">
                    <h3 className="text-3xl font-extrabold font-outfit text-[var(--color-primary)] mb-6 text-center border-b border-white/10 pb-4">
                      Strategic Intelligence Report
                    </h3>
                    <ReactMarkdown>{intelResult}</ReactMarkdown>
                  </div>
                </div>
              )}

              {!intelResult && !isResearching && (
                <div className="text-center text-[var(--color-muted)] max-w-lg mx-auto">
                  <p>Our autonomous agent will browse the web to find recent news, culture insights, and technical expectations specific to this company.</p>
                </div>
              )}
            </motion.main>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
