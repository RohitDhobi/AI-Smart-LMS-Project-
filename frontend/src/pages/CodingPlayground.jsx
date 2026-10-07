import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import confetti from "canvas-confetti";
import {
  Code2,
  Terminal,
  Play,
  Send,
  Sparkles,
  Bot,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  Copy,
  Check,
  Lightbulb,
  Maximize2,
  Minimize2,
  HelpCircle,
  FileCode,
  Zap,
  ChevronRight,
  Layers,
  Award,
  ChevronDown,
  BookOpen
} from "lucide-react";
import { api } from "../api";
import { Page } from "../ui";
import { useToast } from "../components/Toast";
import { addXP, awardActivity } from "../gamification";

export default function CodingPlayground() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [problem, setProblem] = useState(null);
  const [allProblems, setAllProblems] = useState([]);
  
  // Editor state
  const [language, setLanguage] = useState("javascript");
  const [theme, setTheme] = useState("cyber"); // 'cyber' | 'dark' | 'monokai'
  const [fontSize, setFontSize] = useState(14);
  const [code, setCode] = useState("");
  const [fullscreen, setFullscreen] = useState(false);

  // Left Pane Tabs: 'description' | 'ai' | 'hints' | 'submissions' | 'solution'
  const [activeLeftTab, setActiveLeftTab] = useState("description");

  // Bottom Console Tabs: 'testcases' | 'results'
  const [activeConsoleTab, setActiveConsoleTab] = useState("testcases");
  const [selectedCaseIdx, setSelectedCaseIdx] = useState(0);
  const [customInput, setCustomInput] = useState("");
  const [isCustomCase, setIsCustomCase] = useState(false);

  // Execution & Submission state
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [runResults, setRunResults] = useState(null);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [submissionsList, setSubmissionsList] = useState([]);

  // AI Assistant state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiChatHistory, setAiChatHistory] = useState([
    {
      sender: "ai",
      text: "👋 Hi there! I'm your AI Coding Copilot. Ask me for progressive hints, Big-O complexity analysis, or debugging assistance without giving away the full code!"
    }
  ]);
  const [aiCustomPrompt, setAiCustomPrompt] = useState("");
  const [revealedHints, setRevealedHints] = useState({});
  const [copiedId, setCopiedId] = useState(null);

  const textareaRef = useRef(null);

  useEffect(() => {
    loadProblemData();
  }, [id]);

  async function loadProblemData() {
    setLoading(true);
    try {
      const data = await api.codingProblem(id);
      setProblem(data);

      // Load all problems for prev/next switcher
      const listRes = await api.codingProblems();
      if (listRes?.problems) setAllProblems(listRes.problems);

      // Set starter code
      const templates = data.starterCode || {};
      if (templates[language]) {
        setCode(templates[language]);
      } else if (templates["javascript"]) {
        setCode(templates["javascript"]);
        setLanguage("javascript");
      }

      // Load submissions
      loadSubmissions(data.id);
    } catch (err) {
      toast.error("Failed to load problem: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadSubmissions(problemId) {
    try {
      const subs = await api.codingSubmissions(problemId);
      setSubmissionsList(subs || []);
    } catch {
      // Ignore
    }
  }

  function handleLanguageChange(newLang) {
    setLanguage(newLang);
    const templates = problem?.starterCode || {};
    if (templates[newLang]) {
      setCode(templates[newLang]);
    }
  }

  function handleResetCode() {
    const templates = problem?.starterCode || {};
    if (templates[language]) {
      setCode(templates[language]);
      toast.info("Code reset to template.");
    }
  }

  // Handle Tab indentation in code editor
  function handleKeyDown(e) {
    if (e.key === "Tab") {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const newCode = code.substring(0, start) + "    " + code.substring(end);
      setCode(newCode);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 4;
        }
      }, 0);
    } else if (e.ctrlKey && e.shiftKey && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    } else if (e.ctrlKey && e.key === "Enter") {
      e.preventDefault();
      handleRun();
    }
  }

  // RUN CODE
  async function handleRun() {
    if (isRunning || isSubmitting) return;
    setIsRunning(true);
    setActiveConsoleTab("results");
    setSubmissionResult(null);

    try {
      const res = await api.runCodingTest({
        problemId: problem.id,
        language,
        code,
        customInput: isCustomCase ? customInput : undefined
      });
      setRunResults(res);
      if (res.allPassed) {
        toast.success("Sample test cases passed!");
      } else {
        toast.warning("Some test cases failed.");
      }
    } catch (err) {
      toast.error("Execution error: " + err.message);
    } finally {
      setIsRunning(false);
    }
  }

  // SUBMIT SOLUTION
  async function handleSubmit() {
    if (isRunning || isSubmitting) return;
    setIsSubmitting(true);
    setActiveConsoleTab("results");
    setRunResults(null);

    try {
      const res = await api.submitCodingSolution({
        problemId: problem.id,
        language,
        code
      });
      setSubmissionResult(res);

      if (res.status === "ACCEPTED") {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 }
        });
        toast.success(`🎉 Accepted! All ${res.passedCount} test cases passed! +${res.xpEarned || 50} XP`);
        awardActivity({ type: "code-solve", xp: res.xpEarned || 50 });
        if (res.passedCount === res.totalCount) {
          awardActivity({ type: "code-perfect", xp: 25 });
        }
        window.dispatchEvent(new Event("lms-gamification-update"));
      } else {
        toast.error(`Solution ${res.status}: ${res.errorMessage || "Failed test cases"}`);
      }

      // Refresh submissions
      loadSubmissions(problem.id);
    } catch (err) {
      toast.error("Submission failed: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  // AI ASSISTANT ACTIONS
  async function handleAiAction(action, userText = "") {
    if (aiLoading) return;
    setAiLoading(true);
    setActiveLeftTab("ai");

    const userMsg = userText || (
      action === "explain" ? "Can you explain this problem statement and its constraints?" :
      action === "hint" ? "Give me a progressive hint on how to approach this." :
      action === "complexity" ? "Analyze the Time and Space Complexity of my current code." :
      action === "debug" ? "Please inspect my code for potential bugs or edge cases." :
      "What is the optimal algorithmic approach for this problem?"
    );

    setAiChatHistory((prev) => [...prev, { sender: "user", text: userMsg }]);

    try {
      const res = await api.codingAiAssist({
        problemId: problem.id,
        language,
        code,
        action,
        userPrompt: userText
      });
      if (res?.response) {
        setAiChatHistory((prev) => [...prev, { sender: "ai", text: res.response }]);
      }
    } catch (err) {
      setAiChatHistory((prev) => [...prev, { sender: "ai", text: "❌ AI service temporarily unavailable: " + err.message }]);
    } finally {
      setAiLoading(false);
      setAiCustomPrompt("");
    }
  }

  function copyToClipboard(text, idKey) {
    navigator.clipboard.writeText(text);
    setCopiedId(idKey);
    setTimeout(() => setCopiedId(null), 1500);
  }

  const sampleCases = problem?.sampleTestCases || [];
  const currentCase = isCustomCase
    ? { input: customInput, expectedOutput: "(Custom Run)" }
    : sampleCases[selectedCaseIdx] || { input: "", expectedOutput: "" };

  // Prev / Next Problem Navigation
  const currentIdx = allProblems.findIndex((p) => String(p.id) === String(id));
  const prevProblem = currentIdx > 0 ? allProblems[currentIdx - 1] : null;
  const nextProblem = currentIdx < allProblems.length - 1 ? allProblems[currentIdx + 1] : null;

  if (loading) {
    return (
      <Page title="Coding Playground" subtitle="Loading challenge environment...">
        <div style={{ padding: "80px", textAlign: "center", color: "#94a3b8" }}>
          <Code2 className="animate-spin" size={40} style={{ margin: "0 auto 16px auto", color: "#6366f1" }} />
          Loading interactive IDE workspace...
        </div>
      </Page>
    );
  }

  if (!problem) {
    return (
      <Page title="Problem Not Found" subtitle="">
        <div style={{ padding: "40px", textAlign: "center" }}>
          <h2>Challenge Not Found</h2>
          <Link to="/coding" className="primary button-link">← Return to Coding Arena</Link>
        </div>
      </Page>
    );
  }

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: fullscreen ? "100vh" : "calc(100vh - 80px)",
      background: "#0b0f19",
      color: "#f8fafc",
      margin: "-16px",
      overflow: "hidden"
    }}>
      
      {/* TOP HEADER BAR */}
      <header style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 20px",
        background: "#0f172a",
        borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        flexShrink: 0
      }}>
        {/* Left: Back & Problem Nav */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={() => navigate("/coding")}
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              color: "#94a3b8",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              padding: "6px 12px",
              borderRadius: "8px",
              fontSize: "13px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <ArrowLeft size={15} /> Arena
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <h1 style={{ fontSize: "16px", fontWeight: "700", margin: 0, color: "#f8fafc" }}>
              {problem.id}. {problem.title}
            </h1>
            <span style={{
              fontSize: "11px",
              fontWeight: "700",
              padding: "2px 8px",
              borderRadius: "6px",
              background:
                problem.difficulty === "EASY" ? "rgba(34, 197, 94, 0.15)" :
                problem.difficulty === "MEDIUM" ? "rgba(245, 158, 11, 0.15)" :
                "rgba(239, 68, 68, 0.15)",
              color:
                problem.difficulty === "EASY" ? "#4ade80" :
                problem.difficulty === "MEDIUM" ? "#fbbf24" :
                "#f87171"
            }}>
              {problem.difficulty}
            </span>
          </div>

          {/* Prev/Next buttons */}
          <div style={{ display: "flex", gap: "4px", marginLeft: "8px" }}>
            {prevProblem && (
              <button
                onClick={() => navigate(`/coding/${prevProblem.id}`)}
                style={{ background: "transparent", border: "none", color: "#64748b", cursor: "pointer", padding: "4px" }}
                title={`Prev: ${prevProblem.title}`}
              >
                &lt;
              </button>
            )}
            {nextProblem && (
              <button
                onClick={() => navigate(`/coding/${nextProblem.id}`)}
                style={{ background: "transparent", border: "none", color: "#64748b", cursor: "pointer", padding: "4px" }}
                title={`Next: ${nextProblem.title}`}
              >
                &gt;
              </button>
            )}
          </div>
        </div>

        {/* Right: Run & Submit Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={handleRun}
            disabled={isRunning || isSubmitting}
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              color: "#f8fafc",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              padding: "7px 16px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: (isRunning || isSubmitting) ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
            title="Ctrl + Enter"
          >
            <Play size={14} style={{ fill: isRunning ? "none" : "#38bdf8", color: "#38bdf8" }} />
            {isRunning ? "Running..." : "Run"}
          </button>

          <button
            onClick={handleSubmit}
            disabled={isRunning || isSubmitting}
            style={{
              background: "linear-gradient(135deg, #10b981, #059669)",
              color: "#fff",
              border: "none",
              padding: "7px 18px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: (isRunning || isSubmitting) ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 2px 10px rgba(16, 185, 129, 0.3)"
            }}
            title="Ctrl + Shift + Enter"
          >
            <Send size={14} />
            {isSubmitting ? "Submitting..." : "Submit"}
          </button>

          <button
            onClick={() => setFullscreen(!fullscreen)}
            style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", padding: "6px" }}
            title={fullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {fullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </header>

      {/* SPLIT PANE MAIN AREA */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        flex: 1,
        overflow: "hidden",
        gap: "2px",
        background: "rgba(255, 255, 255, 0.05)"
      }}>
        
        {/* =================================================== */}
        {/* LEFT PANE: PROBLEM STATEMENT / AI / HINTS / EDITORIAL */}
        {/* =================================================== */}
        <div style={{
          background: "#0f172a",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          borderRight: "1px solid rgba(255, 255, 255, 0.08)"
        }}>
          {/* Left Tabs Header */}
          <div style={{
            display: "flex",
            background: "#0b0f19",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            padding: "0 8px"
          }}>
            {[
              { id: "description", label: "Description", icon: FileCode },
              { id: "ai", label: "AI Copilot", icon: Bot, badge: "AI" },
              { id: "hints", label: "Hints", icon: Lightbulb },
              { id: "submissions", label: `Submissions (${submissionsList.length})`, icon: Clock },
              { id: "solution", label: "Editorial", icon: BookOpen }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeLeftTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveLeftTab(tab.id)}
                  style={{
                    background: "transparent",
                    color: isActive ? "#818cf8" : "#94a3b8",
                    border: "none",
                    borderBottom: isActive ? "2px solid #818cf8" : "2px solid transparent",
                    padding: "10px 14px",
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    transition: "all 0.15s"
                  }}
                >
                  <Icon size={14} />
                  {tab.label}
                  {tab.badge && (
                    <span style={{ fontSize: "9px", background: "rgba(99, 102, 241, 0.3)", color: "#c7d2fe", padding: "1px 5px", borderRadius: "4px" }}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Left Tab Content Body */}
          <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
            
            {/* TAB 1: DESCRIPTION */}
            {activeLeftTab === "description" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div>
                  <h2 style={{ fontSize: "20px", fontWeight: "700", margin: "0 0 12px 0", color: "#f8fafc" }}>
                    {problem.title}
                  </h2>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
                    <span style={{
                      fontSize: "11px",
                      fontWeight: "700",
                      padding: "2px 8px",
                      borderRadius: "6px",
                      background:
                        problem.difficulty === "EASY" ? "rgba(34, 197, 94, 0.15)" :
                        problem.difficulty === "MEDIUM" ? "rgba(245, 158, 11, 0.15)" :
                        "rgba(239, 68, 68, 0.15)",
                      color:
                        problem.difficulty === "EASY" ? "#4ade80" :
                        problem.difficulty === "MEDIUM" ? "#fbbf24" :
                        "#f87171"
                    }}>
                      {problem.difficulty}
                    </span>
                    <span style={{ fontSize: "11px", color: "#94a3b8", background: "rgba(255, 255, 255, 0.05)", padding: "2px 8px", borderRadius: "6px" }}>
                      {problem.category}
                    </span>
                    <span style={{ fontSize: "11px", color: "#eab308", background: "rgba(234, 179, 8, 0.1)", padding: "2px 8px", borderRadius: "6px", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                      <Sparkles size={11} /> +{problem.xpReward || 50} XP
                    </span>
                  </div>

                  <div style={{ color: "#cbd5e1", fontSize: "14px", lineHeight: "1.7", whiteSpace: "pre-line" }}>
                    {problem.description}
                  </div>
                </div>

                {/* SAMPLE TEST CASES / EXAMPLES */}
                {sampleCases.length > 0 && (
                  <div>
                    <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#f8fafc", margin: "0 0 12px 0" }}>
                      Examples
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {sampleCases.map((tc, idx) => (
                        <div key={idx} style={{
                          background: "rgba(15, 23, 42, 0.8)",
                          border: "1px solid rgba(255, 255, 255, 0.08)",
                          borderRadius: "10px",
                          padding: "12px 16px"
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                            <strong style={{ fontSize: "12px", color: "#818cf8" }}>Example {idx + 1}</strong>
                            <button
                              onClick={() => copyToClipboard(tc.input, `ex-${idx}`)}
                              style={{ background: "transparent", border: "none", color: "#64748b", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "11px" }}
                            >
                              {copiedId === `ex-${idx}` ? <Check size={12} style={{ color: "#22c55e" }} /> : <Copy size={12} />}
                              {copiedId === `ex-${idx}` ? "Copied" : "Copy"}
                            </button>
                          </div>
                          <div style={{ fontSize: "13px", fontFamily: "monospace", color: "#e2e8f0" }}>
                            <span style={{ color: "#94a3b8" }}>Input: </span>{tc.input}<br />
                            <span style={{ color: "#94a3b8" }}>Output: </span>{tc.expectedOutput}
                            {tc.explanation && (
                              <div style={{ marginTop: "6px", color: "#94a3b8", fontSize: "12px", fontFamily: "sans-serif" }}>
                                <em>Explanation: </em>{tc.explanation}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* CONSTRAINTS */}
                {problem.constraints && (
                  <div>
                    <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#f8fafc", margin: "0 0 8px 0" }}>
                      Constraints
                    </h3>
                    <div style={{
                      background: "rgba(15, 23, 42, 0.6)",
                      border: "1px solid rgba(255, 255, 255, 0.05)",
                      borderRadius: "10px",
                      padding: "12px 16px",
                      fontSize: "13px",
                      fontFamily: "monospace",
                      color: "#94a3b8",
                      lineHeight: "1.6",
                      whiteSpace: "pre-line"
                    }}>
                      {problem.constraints}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: AI COPILOT */}
            {activeLeftTab === "ai" && (
              <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: "16px" }}>
                {/* AI Action Buttons */}
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button
                    onClick={() => handleAiAction("explain")}
                    disabled={aiLoading}
                    style={{
                      background: "rgba(99, 102, 241, 0.15)",
                      color: "#a5b4fc",
                      border: "1px solid rgba(99, 102, 241, 0.3)",
                      padding: "6px 12px",
                      borderRadius: "8px",
                      fontSize: "12px",
                      fontWeight: "600",
                      cursor: "pointer"
                    }}
                  >
                    💡 Explain Problem
                  </button>
                  <button
                    onClick={() => handleAiAction("complexity")}
                    disabled={aiLoading}
                    style={{
                      background: "rgba(16, 185, 129, 0.15)",
                      color: "#6ee7b7",
                      border: "1px solid rgba(16, 185, 129, 0.3)",
                      padding: "6px 12px",
                      borderRadius: "8px",
                      fontSize: "12px",
                      fontWeight: "600",
                      cursor: "pointer"
                    }}
                  >
                    ⚡ Analyze Complexity
                  </button>
                  <button
                    onClick={() => handleAiAction("debug")}
                    disabled={aiLoading}
                    style={{
                      background: "rgba(245, 158, 11, 0.15)",
                      color: "#fde047",
                      border: "1px solid rgba(245, 158, 11, 0.3)",
                      padding: "6px 12px",
                      borderRadius: "8px",
                      fontSize: "12px",
                      fontWeight: "600",
                      cursor: "pointer"
                    }}
                  >
                    🔍 Debug My Code
                  </button>
                  <button
                    onClick={() => handleAiAction("hint")}
                    disabled={aiLoading}
                    style={{
                      background: "rgba(236, 72, 153, 0.15)",
                      color: "#f472b6",
                      border: "1px solid rgba(236, 72, 153, 0.3)",
                      padding: "6px 12px",
                      borderRadius: "8px",
                      fontSize: "12px",
                      fontWeight: "600",
                      cursor: "pointer"
                    }}
                  >
                    🎯 Give Next Hint
                  </button>
                </div>

                {/* AI Chat History */}
                <div style={{
                  flex: 1,
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  background: "rgba(15, 23, 42, 0.6)",
                  padding: "14px",
                  borderRadius: "12px",
                  border: "1px solid rgba(255, 255, 255, 0.08)"
                }}>
                  {aiChatHistory.map((msg, idx) => (
                    <div
                      key={idx}
                      style={{
                        alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
                        maxWidth: "90%",
                        background: msg.sender === "user" ? "rgba(99, 102, 241, 0.3)" : "rgba(30, 41, 59, 0.8)",
                        border: msg.sender === "user" ? "1px solid rgba(99, 102, 241, 0.4)" : "1px solid rgba(255, 255, 255, 0.08)",
                        padding: "10px 14px",
                        borderRadius: "10px",
                        fontSize: "13px",
                        lineHeight: "1.6",
                        color: "#f8fafc",
                        whiteSpace: "pre-line"
                      }}
                    >
                      {msg.text}
                    </div>
                  ))}
                  {aiLoading && (
                    <div style={{ color: "#818cf8", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px" }}>
                      <Bot className="animate-spin" size={16} /> AI Copilot is thinking...
                    </div>
                  )}
                </div>

                {/* Custom Question Input */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (aiCustomPrompt.trim()) handleAiAction("chat", aiCustomPrompt.trim());
                  }}
                  style={{ display: "flex", gap: "8px" }}
                >
                  <input
                    type="text"
                    placeholder="Ask AI anything about this challenge..."
                    value={aiCustomPrompt}
                    onChange={(e) => setAiCustomPrompt(e.target.value)}
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      borderRadius: "8px",
                      background: "rgba(15, 23, 42, 0.8)",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      color: "#f8fafc",
                      fontSize: "13px",
                      outline: "none"
                    }}
                  />
                  <button
                    type="submit"
                    disabled={aiLoading || !aiCustomPrompt.trim()}
                    style={{
                      background: "#6366f1",
                      color: "#fff",
                      border: "none",
                      padding: "8px 16px",
                      borderRadius: "8px",
                      fontSize: "13px",
                      fontWeight: "600",
                      cursor: (aiLoading || !aiCustomPrompt.trim()) ? "not-allowed" : "pointer"
                    }}
                  >
                    Ask
                  </button>
                </form>
              </div>
            )}

            {/* TAB 3: HINTS */}
            {activeLeftTab === "hints" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#f8fafc", margin: "0 0 4px 0" }}>
                  Progressive Hints
                </h3>
                <p style={{ color: "#94a3b8", fontSize: "13px", margin: "0 0 12px 0" }}>
                  Try revealing hints one at a time before looking at the solution.
                </p>

                {problem.hints && problem.hints.length > 0 ? (
                  problem.hints.map((hintText, idx) => {
                    const isRevealed = !!revealedHints[idx];
                    return (
                      <div
                        key={idx}
                        style={{
                          background: "rgba(15, 23, 42, 0.7)",
                          border: "1px solid rgba(255, 255, 255, 0.08)",
                          borderRadius: "10px",
                          overflow: "hidden"
                        }}
                      >
                        <div
                          onClick={() => setRevealedHints((prev) => ({ ...prev, [idx]: !prev[idx] }))}
                          style={{
                            padding: "12px 16px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            cursor: "pointer",
                            fontWeight: "600",
                            fontSize: "13px",
                            color: isRevealed ? "#818cf8" : "#f8fafc"
                          }}
                        >
                          <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <Lightbulb size={16} style={{ color: isRevealed ? "#fbbf24" : "#64748b" }} />
                            Hint {idx + 1}
                          </span>
                          <span style={{ fontSize: "12px", color: "#64748b" }}>
                            {isRevealed ? "Hide" : "Click to Reveal"}
                          </span>
                        </div>
                        {isRevealed && (
                          <div style={{ padding: "0 16px 14px 16px", color: "#cbd5e1", fontSize: "13px", lineHeight: "1.6" }}>
                            {hintText}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div style={{ color: "#94a3b8", fontSize: "13px" }}>No hints available for this problem.</div>
                )}
              </div>
            )}

            {/* TAB 4: SUBMISSIONS */}
            {activeLeftTab === "submissions" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#f8fafc", margin: "0 0 8px 0" }}>
                  Submission History
                </h3>
                {submissionsList.length === 0 ? (
                  <div style={{ color: "#94a3b8", fontSize: "13px" }}>No submissions yet for this challenge. Click 'Submit' to submit your solution!</div>
                ) : (
                  submissionsList.map((sub) => (
                    <div
                      key={sub.id}
                      style={{
                        background: "rgba(15, 23, 42, 0.7)",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                        borderRadius: "10px",
                        padding: "12px 16px"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                        <span style={{
                          fontSize: "12px",
                          fontWeight: "700",
                          color: sub.status === "ACCEPTED" ? "#4ade80" : "#f87171"
                        }}>
                          {sub.status}
                        </span>
                        <span style={{ fontSize: "11px", color: "#64748b" }}>
                          {new Date(sub.submittedAt).toLocaleDateString()} {new Date(sub.submittedAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: "16px", fontSize: "12px", color: "#94a3b8", marginBottom: "8px" }}>
                        <span>Language: <strong style={{ color: "#f8fafc" }}>{sub.language}</strong></span>
                        <span>Runtime: <strong style={{ color: "#f8fafc" }}>{sub.executionTimeMs} ms</strong></span>
                        <span>Testcases: <strong style={{ color: "#f8fafc" }}>{sub.passedTestCases}/{sub.totalTestCases}</strong></span>
                      </div>
                      <button
                        onClick={() => {
                          setCode(sub.code);
                          setLanguage(sub.language);
                          toast.info("Loaded submitted code into editor.");
                        }}
                        style={{
                          background: "rgba(99, 102, 241, 0.15)",
                          color: "#818cf8",
                          border: "1px solid rgba(99, 102, 241, 0.3)",
                          padding: "4px 10px",
                          borderRadius: "6px",
                          fontSize: "11px",
                          cursor: "pointer"
                        }}
                      >
                        Load Code into Editor
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 5: SOLUTION / EDITORIAL */}
            {activeLeftTab === "solution" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#f8fafc", margin: "0" }}>
                  Solution & Editorial
                </h3>
                <div style={{
                  background: "rgba(15, 23, 42, 0.7)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "10px",
                  padding: "16px",
                  color: "#cbd5e1",
                  fontSize: "13px",
                  lineHeight: "1.7",
                  whiteSpace: "pre-line"
                }}>
                  {problem.solutionExplanation || "This problem can be efficiently solved using optimal hashing and boundary checking in linear O(N) time."}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* =================================================== */}
        {/* RIGHT PANE: CODE EDITOR & TEST RUNNER CONSOLE */}
        {/* =================================================== */}
        <div style={{
          background: "#0b0f19",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden"
        }}>
          
          {/* Editor Header Toolbar */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 16px",
            background: "#0f172a",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            flexShrink: 0
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {/* Language Switcher */}
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                style={{
                  background: "rgba(15, 23, 42, 0.8)",
                  color: "#38bdf8",
                  fontWeight: "600",
                  border: "1px solid rgba(56, 189, 248, 0.3)",
                  padding: "5px 10px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  cursor: "pointer"
                }}
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python 3</option>
                <option value="java">Java 21</option>
                <option value="cpp">C++ 20</option>
                <option value="sql">SQL</option>
              </select>

              {/* Font size */}
              <select
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                style={{
                  background: "rgba(15, 23, 42, 0.8)",
                  color: "#94a3b8",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  padding: "5px 8px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  cursor: "pointer"
                }}
              >
                <option value={12}>12px</option>
                <option value={14}>14px</option>
                <option value={16}>16px</option>
                <option value={18}>18px</option>
              </select>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button
                onClick={handleResetCode}
                style={{
                  background: "transparent",
                  color: "#94a3b8",
                  border: "none",
                  padding: "5px 8px",
                  fontSize: "12px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px"
                }}
                title="Reset to starter code"
              >
                <RotateCcw size={13} /> Reset
              </button>
            </div>
          </div>

          {/* CODE EDITOR TEXTAREA WITH LINE NUMBERS */}
          <div style={{
            flex: 1,
            display: "flex",
            position: "relative",
            background: "#080c14",
            overflow: "hidden"
          }}>
            {/* Line numbers column */}
            <div style={{
              width: "45px",
              padding: "16px 0",
              textAlign: "right",
              paddingRight: "12px",
              color: "#475569",
              fontSize: `${fontSize}px`,
              lineHeight: "1.6",
              fontFamily: "monospace",
              userSelect: "none",
              background: "#080c14",
              borderRight: "1px solid rgba(255, 255, 255, 0.05)"
            }}>
              {code.split("\n").map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>

            {/* Code Input */}
            <textarea
              ref={textareaRef}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              style={{
                flex: 1,
                height: "100%",
                background: "transparent",
                color: "#e2e8f0",
                fontSize: `${fontSize}px`,
                lineHeight: "1.6",
                fontFamily: "Consolas, 'Fira Code', Menlo, Monaco, monospace",
                border: "none",
                padding: "16px",
                resize: "none",
                outline: "none",
                tabSize: 4,
                whiteSpace: "pre"
              }}
            />
          </div>

          {/* BOTTOM TEST RUNNER CONSOLE */}
          <div style={{
            height: "260px",
            background: "#0f172a",
            borderTop: "1px solid rgba(255, 255, 255, 0.1)",
            display: "flex",
            flexDirection: "column",
            flexShrink: 0
          }}>
            {/* Console Header Tabs */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "#0b0f19",
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
              padding: "0 12px"
            }}>
              <div style={{ display: "flex", gap: "6px" }}>
                <button
                  onClick={() => setActiveConsoleTab("testcases")}
                  style={{
                    background: "transparent",
                    color: activeConsoleTab === "testcases" ? "#38bdf8" : "#94a3b8",
                    border: "none",
                    borderBottom: activeConsoleTab === "testcases" ? "2px solid #38bdf8" : "2px solid transparent",
                    padding: "8px 12px",
                    fontSize: "12px",
                    fontWeight: "600",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  <Terminal size={13} /> Testcases
                </button>

                <button
                  onClick={() => setActiveConsoleTab("results")}
                  style={{
                    background: "transparent",
                    color: activeConsoleTab === "results" ? "#38bdf8" : "#94a3b8",
                    border: "none",
                    borderBottom: activeConsoleTab === "results" ? "2px solid #38bdf8" : "2px solid transparent",
                    padding: "8px 12px",
                    fontSize: "12px",
                    fontWeight: "600",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  <Play size={13} /> Test Result
                  {(runResults || submissionResult) && (
                    <span style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: (submissionResult?.status === "ACCEPTED" || runResults?.allPassed) ? "#22c55e" : "#ef4444"
                    }} />
                  )}
                </button>
              </div>

              <div style={{ fontSize: "11px", color: "#64748b" }}>
                Shortcut: <code style={{ color: "#94a3b8" }}>Ctrl+Enter</code> to Run
              </div>
            </div>

            {/* Console Body */}
            <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px" }}>
              
              {/* TAB 1: TESTCASES */}
              {activeConsoleTab === "testcases" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {/* Case Pill Switchers */}
                  <div style={{ display: "flex", gap: "6px" }}>
                    {sampleCases.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setSelectedCaseIdx(idx);
                          setIsCustomCase(false);
                        }}
                        style={{
                          background: (!isCustomCase && selectedCaseIdx === idx) ? "rgba(56, 189, 248, 0.2)" : "rgba(255, 255, 255, 0.05)",
                          color: (!isCustomCase && selectedCaseIdx === idx) ? "#38bdf8" : "#94a3b8",
                          border: (!isCustomCase && selectedCaseIdx === idx) ? "1px solid rgba(56, 189, 248, 0.4)" : "1px solid rgba(255, 255, 255, 0.08)",
                          padding: "4px 10px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: "600",
                          cursor: "pointer"
                        }}
                      >
                        Case {idx + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => setIsCustomCase(true)}
                      style={{
                        background: isCustomCase ? "rgba(99, 102, 241, 0.2)" : "rgba(255, 255, 255, 0.05)",
                        color: isCustomCase ? "#818cf8" : "#94a3b8",
                        border: isCustomCase ? "1px solid rgba(99, 102, 241, 0.4)" : "1px solid rgba(255, 255, 255, 0.08)",
                        padding: "4px 10px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: "600",
                        cursor: "pointer"
                      }}
                    >
                      + Custom Input
                    </button>
                  </div>

                  {/* Case Input / Expected Output */}
                  {isCustomCase ? (
                    <div>
                      <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "4px" }}>Custom Input:</div>
                      <textarea
                        value={customInput}
                        onChange={(e) => setCustomInput(e.target.value)}
                        placeholder="e.g. [2,7,11,15], 9"
                        style={{
                          width: "100%",
                          height: "70px",
                          background: "rgba(15, 23, 42, 0.8)",
                          border: "1px solid rgba(255, 255, 255, 0.12)",
                          color: "#f8fafc",
                          fontFamily: "monospace",
                          fontSize: "12px",
                          borderRadius: "6px",
                          padding: "8px",
                          outline: "none"
                        }}
                      />
                    </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                      <div>
                        <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "4px" }}>Input:</div>
                        <div style={{
                          background: "rgba(15, 23, 42, 0.8)",
                          border: "1px solid rgba(255, 255, 255, 0.08)",
                          padding: "8px 12px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontFamily: "monospace",
                          color: "#f8fafc"
                        }}>
                          {currentCase.input}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "4px" }}>Expected Output:</div>
                        <div style={{
                          background: "rgba(15, 23, 42, 0.8)",
                          border: "1px solid rgba(255, 255, 255, 0.08)",
                          padding: "8px 12px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontFamily: "monospace",
                          color: "#f8fafc"
                        }}>
                          {currentCase.expectedOutput}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: RESULTS */}
              {activeConsoleTab === "results" && (
                <div>
                  {isRunning || isSubmitting ? (
                    <div style={{ padding: "20px", textAlign: "center", color: "#94a3b8" }}>
                      <Code2 className="animate-spin" size={24} style={{ margin: "0 auto 8px auto", color: "#38bdf8" }} />
                      {isRunning ? "Executing code against test cases..." : "Evaluating full submission..."}
                    </div>
                  ) : submissionResult ? (
                    /* SUBMISSION VERDICT */
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{
                          fontSize: "18px",
                          fontWeight: "800",
                          color: submissionResult.status === "ACCEPTED" ? "#4ade80" : "#f87171"
                        }}>
                          {submissionResult.status === "ACCEPTED" ? "🎉 Accepted" : `❌ ${submissionResult.status}`}
                        </span>
                        <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                          Passed {submissionResult.passedCount} / {submissionResult.totalCount} Testcases
                        </span>
                        <span style={{ fontSize: "12px", color: "#64748b" }}>
                          Runtime: {submissionResult.executionTimeMs} ms
                        </span>
                      </div>

                      {submissionResult.errorMessage && (
                        <div style={{ background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)", padding: "8px 12px", borderRadius: "6px", color: "#fca5a5", fontSize: "12px", fontFamily: "monospace" }}>
                          {submissionResult.errorMessage}
                        </div>
                      )}

                      {submissionResult.isFirstAccepted && (
                        <div style={{ background: "rgba(234, 179, 8, 0.15)", border: "1px solid rgba(234, 179, 8, 0.3)", padding: "10px 14px", borderRadius: "8px", color: "#fde047", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px" }}>
                          <Sparkles size={16} /> First time solved! You earned +{submissionResult.xpEarned} Coding XP!
                        </div>
                      )}
                    </div>
                  ) : runResults ? (
                    /* RUN SAMPLE RESULTS */
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{
                          fontSize: "15px",
                          fontWeight: "700",
                          color: runResults.allPassed ? "#4ade80" : "#f87171"
                        }}>
                          {runResults.allPassed ? "✅ All Sample Cases Passed" : "❌ Some Sample Cases Failed"}
                        </span>
                        <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                          Runtime: {runResults.totalTimeMs} ms
                        </span>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {runResults.testResults?.map((tr, idx) => (
                          <div key={idx} style={{
                            background: "rgba(15, 23, 42, 0.8)",
                            border: tr.passed ? "1px solid rgba(34, 197, 94, 0.2)" : "1px solid rgba(239, 68, 68, 0.3)",
                            borderRadius: "6px",
                            padding: "8px 12px",
                            fontSize: "12px",
                            fontFamily: "monospace"
                          }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                              <strong style={{ color: tr.passed ? "#4ade80" : "#f87171" }}>
                                {tr.passed ? "✓ Passed" : "✗ Failed"} — Testcase {tr.caseNumber}
                              </strong>
                              <span style={{ color: "#64748b" }}>{tr.executionTimeMs} ms</span>
                            </div>
                            <div style={{ color: "#cbd5e1" }}>
                              <span style={{ color: "#64748b" }}>Expected: </span>{tr.expectedOutput}<br />
                              <span style={{ color: "#64748b" }}>Actual: </span>
                              <span style={{ color: tr.passed ? "#4ade80" : "#f87171" }}>{tr.actualOutput}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div style={{ color: "#64748b", fontSize: "12px", textAlign: "center", padding: "20px" }}>
                      Run your code or submit a solution to see output and execution logs.
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
