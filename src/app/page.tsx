"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, BrainCircuit, Target, Briefcase, Download, Loader2, Sparkles, Search, History } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast, Toaster } from "sonner";

const Floating = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
  <motion.div
    animate={{ y: [0, -12, 0] }}
    transition={{
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut",
      delay
    }}
  >
    {children}
  </motion.div>
);

type Tab = "dashboard" | "upload" | "results" | "interview" | "intel" | "vault";

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

  // Vault State
  const [vaultQuery, setVaultQuery] = useState("");
  const [vaultResults, setVaultResults] = useState<any[]>([]);
  const [isSearchingVault, setIsSearchingVault] = useState(false);

  const [toastState, setToastState] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    if (type === "success") toast.success(message);
    else if (type === "error") toast.error(message);
    else toast(message);
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

  const handleVaultSearch = async () => {
    if (!vaultQuery.trim()) {
      showToast("Please enter a search query.", "error");
      return;
    }

    setIsSearchingVault(true);
    setVaultResults([]);

    try {
      const response = await fetch("/api/vault/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: vaultQuery }),
      });
      const data = await response.json();
      if (data.error || !response.ok) {
        showToast(data.error || "Vault search failed. Check your API keys.", "error");
      } else {
        setVaultResults(data.results);
        if (data.results.length === 0) {
          showToast("No matching resumes found.", "info");
        } else {
          showToast(`Found ${data.results.length} matching resumes!`, "success");
        }
      }
    } catch {
      showToast("Error searching vault.", "error");
    } finally {
      setIsSearchingVault(false);
    }
  };

  return (
    <>
      <Toaster position="top-right" richColors />
      <div className="container mx-auto px-4 py-10 max-w-7xl min-h-screen relative">
        <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-[10%] left-[5%] w-64 h-64 bg-primary/10 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[20%] right-[10%] w-96 h-96 bg-accent/5 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <nav className="flex justify-center mb-16">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Tab)} className="glass p-1 rounded-full">
            <TabsList className="bg-transparent border-none">
              <TabsTrigger value="dashboard" className="rounded-full px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Dashboard</TabsTrigger>
              <TabsTrigger value="upload" className="rounded-full px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Analyze</TabsTrigger>
              <TabsTrigger value="results" className="rounded-full px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Results</TabsTrigger>
              <TabsTrigger value="intel" className="rounded-full px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Deep Intel</TabsTrigger>
              <TabsTrigger value="vault" className="rounded-full px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Vault</TabsTrigger>
            </TabsList>
          </Tabs>
        </nav>

        <AnimatePresence mode="wait">
          {/* Dashboard */}
          {activeTab === "dashboard" && (
            <motion.main
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center text-center"
            >
              <Floating>
                <div className="mb-12">
                  <div className="inline-block px-4 py-1.5 mb-6 rounded-full glass border-primary/20 text-primary text-sm font-bold tracking-wider uppercase">
                    <Sparkles className="w-4 h-4 inline mr-2 mb-0.5" /> Next-Gen Career Command
                  </div>
                  <h1 className="text-7xl font-extrabold mb-6 font-outfit tracking-tight leading-tight">
                    Your Autonomous<br />
                    <span className="bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] animate-gradient-x bg-clip-text text-transparent">Career Command Center</span>
                  </h1>
                  <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
                    Elevate your trajectory with orchestrated intelligence, semantic search, and technical whisperers.
                  </p>
                  <div className="flex flex-wrap justify-center gap-5">
                    <Button
                      size="lg"
                      onClick={() => setActiveTab("upload")}
                      className="px-10 py-7 rounded-full text-lg font-bold shadow-[0_0_20px_rgba(167,139,250,0.3)] hover:scale-105 transition-all"
                    >
                      🚀 Analyze Resume
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => setActiveTab("intel")}
                      className="px-10 py-7 rounded-full text-lg font-bold glass hover:bg-primary/10 transition-all"
                    >
                      🔍 Deep Research
                    </Button>
                  </div>
                </div>
              </Floating>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl mt-12">
                {[
                  { icon: "📄", title: "Smart Extraction", desc: "Instantly parse PDFs into structured knowledge.", delay: 0 },
                  { icon: "🧠", title: "Orchestrated AI", desc: "3-step strategic grading and gap detection.", delay: 0.2 },
                  { icon: "🎯", title: "Semantic Matching", desc: "Find roles based on meaning, not just keywords.", delay: 0.4 },
                ].map((feature, i) => (
                  <Floating key={i} delay={feature.delay}>
                    <Card className="glass border-none h-full hover:scale-105 transition-all">
                      <CardHeader>
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 bg-primary/15 border border-primary/20 text-2xl">
                          {feature.icon}
                        </div>
                        <CardTitle className="text-2xl font-bold font-outfit">{feature.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">{feature.desc}</p>
                      </CardContent>
                    </Card>
                  </Floating>
                ))}
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
              <h1 className="text-6xl font-extrabold mb-4 font-outfit tracking-tight">
                Analyze your resume.<br />
                <span className="text-primary">Stand out.</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-10 h-8 uppercase tracking-widest text-sm font-bold">ATS optimization • Skill detection • Job matching</p>

              <label className="w-full max-w-xl h-80 border-2 border-dashed border-primary/30 rounded-3xl bg-surface/5 backdrop-blur-xl flex flex-col items-center justify-center cursor-pointer transition-all hover:border-primary hover:bg-primary/5 hover:shadow-[0_0_50px_rgba(167,139,250,0.1)] mb-8 group">
                <input
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])}
                />
                <Floating>
                  <UploadCloud className="w-20 h-20 text-primary mb-5" />
                </Floating>
                <p className="text-xl font-bold mb-2 text-foreground">Drag & Drop or Click to Upload</p>
                <p className="text-muted-foreground text-sm mb-4">High-fidelity PDF processing</p>
                {uploadStatus && <div className="text-success font-bold flex items-center gap-2"><Sparkles className="w-4 h-4" /> {uploadStatus}</div>}
              </label>

              <div className="w-full max-w-xl text-left mb-10">
                <label className="block font-bold mb-3 text-foreground ml-1">Target Job Role</label>
                <Input
                  type="text"
                  value={jobRole}
                  onChange={(e) => setJobRole(e.target.value)}
                  placeholder="e.g. Senior Product Architect"
                  className="h-14 glass border-none rounded-xl px-6 focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <Button
                size="lg"
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="px-12 py-8 rounded-full text-xl font-bold bg-gradient-to-br from-primary to-accent text-black shadow-xl hover:scale-105 transition-all"
              >
                {isAnalyzing ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : "Start Analysis"} <BrainCircuit className="w-6 h-6 ml-2" />
              </Button>
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

          {/* Resume Vault */}
          {activeTab === "vault" && (
            <motion.main
              key="vault"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="min-h-[60vh]"
            >
              <div className="text-center mb-12">
                <h2 className="text-6xl font-extrabold font-outfit mb-3">
                  Resume <span className="text-primary">Vault</span>
                </h2>
                <p className="text-xl text-muted-foreground">Vector-optimized semantic retrieval.</p>
              </div>

              <div className="max-w-3xl mx-auto mb-12">
                <Card className="glass border-none overflow-hidden p-2">
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={vaultQuery}
                      onChange={(e) => setVaultQuery(e.target.value)}
                      placeholder="Search semantic history... (e.g. 'Senior engineers with Kubernetes')"
                      className="flex-1 h-16 border-none bg-transparent px-6 text-lg focus-visible:ring-0"
                      onKeyDown={(e) => e.key === "Enter" && handleVaultSearch()}
                    />
                    <Button
                      size="lg"
                      onClick={handleVaultSearch}
                      disabled={isSearchingVault}
                      className="h-16 px-10 rounded-xl font-bold bg-primary text-black"
                    >
                      {isSearchingVault ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                    </Button>
                  </div>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                {vaultResults.map((res, i) => (
                  <Floating key={res.id} delay={i * 0.1}>
                    <Card className="glass border-none h-full hover:border-primary/30 transition-all cursor-default group">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start mb-2">
                          <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter">
                            {res.metadata.job_role}
                          </span>
                          <span className="text-muted-foreground text-[10px] font-mono">
                            {(res.score * 100).toFixed(1)}% MATCH
                          </span>
                        </div>
                        <CardTitle className="text-lg font-bold font-outfit line-clamp-1">Result Profile</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground text-sm mb-6 line-clamp-3 leading-relaxed italic border-l-2 border-primary/20 pl-4">
                          &quot;{res.metadata.text}...&quot;
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full border border-primary/20 hover:bg-primary/10 text-primary font-bold"
                          onClick={() => {
                            setResumeText(res.metadata.text);
                            setJobRole(res.metadata.job_role);
                            setActiveTab("upload");
                            showToast("Resume loaded from vault!", "info");
                          }}
                        >
                          Restore & Analyze <History className="w-4 h-4 ml-2" />
                        </Button>
                      </CardContent>
                    </Card>
                  </Floating>
                ))}
              </div>

              {vaultResults.length === 0 && !isSearchingVault && (
                <div className="text-center text-muted-foreground mt-24 opacity-50">
                  <Floating>
                    <Search className="w-12 h-12 mx-auto mb-4" />
                  </Floating>
                  <p className="text-lg font-outfit tracking-widest uppercase text-xs">Awaiting Semantic Query</p>
                </div>
              )}
            </motion.main>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
