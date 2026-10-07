import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Code2,
  Terminal,
  Zap,
  Flame,
  CheckCircle2,
  Clock,
  Circle,
  Search,
  Filter,
  Trophy,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Tag,
  BookOpen,
  Award,
  Layers,
  Code
} from "lucide-react";
import { api } from "../api";
import { Page } from "../ui";
import { useToast } from "../components/Toast";

export default function CodingArena() {
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [problems, setProblems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState({
    totalProblems: 0,
    easyTotal: 0,
    mediumTotal: 0,
    hardTotal: 0,
    userSolved: 0,
    userSolvedEasy: 0,
    userSolvedMedium: 0,
    userSolvedHard: 0,
    userTotalXp: 0,
  });
  const [dailyProblem, setDailyProblem] = useState(null);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("ALL");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [activeTab, setActiveTab] = useState("problems"); // 'problems' | 'submissions'
  const [submissions, setSubmissions] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);

  useEffect(() => {
    loadProblems();
    loadDaily();
  }, [selectedDifficulty, selectedCategory, selectedStatus]);

  async function loadProblems() {
    setLoading(true);
    try {
      const data = await api.codingProblems({
        difficulty: selectedDifficulty !== "ALL" ? selectedDifficulty : undefined,
        category: selectedCategory !== "ALL" ? selectedCategory : undefined,
        status: selectedStatus !== "ALL" ? selectedStatus : undefined,
        search: search.trim() || undefined,
      });
      if (data) {
        setProblems(data.problems || []);
        if (data.categories) setCategories(data.categories);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      toast.error("Failed to load coding problems: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadDaily() {
    try {
      const daily = await api.codingDailyChallenge();
      setDailyProblem(daily);
    } catch {
      // Ignore if no daily challenge
    }
  }

  async function loadSubmissions() {
    setSubmissionsLoading(true);
    try {
      const list = await api.codingSubmissions();
      setSubmissions(list || []);
    } catch (err) {
      toast.error("Failed to load submission history");
    } finally {
      setSubmissionsLoading(false);
    }
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    loadProblems();
  }

  const filteredProblems = problems.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.title?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q) ||
      p.tags?.toLowerCase().includes(q)
    );
  });

  const easyPercent = stats.easyTotal > 0 ? Math.round((stats.userSolvedEasy / stats.easyTotal) * 100) : 0;
  const mediumPercent = stats.mediumTotal > 0 ? Math.round((stats.userSolvedMedium / stats.mediumTotal) * 100) : 0;
  const hardPercent = stats.hardTotal > 0 ? Math.round((stats.userSolvedHard / stats.hardTotal) * 100) : 0;
  const totalPercent = stats.totalProblems > 0 ? Math.round((stats.userSolved / stats.totalProblems) * 100) : 0;

  return (
    <Page title="Coding Practice Arena" subtitle="Solve algorithmic challenges, practice data structures, and level up with AI-assisted code tutoring.">
      <div className="coding-arena-container" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        
        {/* HERO & DAILY CHALLENGE BANNER */}
        <div style={{
          background: "linear-gradient(135deg, rgba(20, 24, 39, 0.95), rgba(15, 23, 42, 0.98))",
          borderRadius: "16px",
          padding: "24px",
          border: "1px solid rgba(99, 102, 241, 0.25)",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.35)",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "24px",
          alignItems: "center",
          position: "relative",
          overflow: "hidden"
        }}>
          {/* Subtle background glow */}
          <div style={{
            position: "absolute",
            top: "-50%",
            left: "-20%",
            width: "350px",
            height: "350px",
            background: "radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)",
            pointerEvents: "none"
          }} />

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <span style={{
                background: "linear-gradient(135deg, #f59e0b, #ef4444)",
                color: "#fff",
                fontSize: "11px",
                fontWeight: "700",
                padding: "3px 10px",
                borderRadius: "20px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px"
              }}>
                <Flame size={13} /> Daily Challenge
              </span>
              <span style={{ color: "#94a3b8", fontSize: "13px" }}>24h Refresh</span>
            </div>

            <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#f8fafc", margin: "0 0 8px 0" }}>
              {dailyProblem ? dailyProblem.title : "Two Sum"}
            </h2>
            <p style={{ color: "#94a3b8", fontSize: "14px", lineHeight: "1.5", margin: "0 0 16px 0", maxHeight: "48px", overflow: "hidden", textOverflow: "ellipsis" }}>
              {dailyProblem ? dailyProblem.description?.replace(/<[^>]*>?/gm, "").substring(0, 150) + "..." : "Master standard array hashing and pointer techniques."}
            </p>

            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <button
                onClick={() => {
                  if (dailyProblem) {
                    navigate(`/coding/${dailyProblem.id}`);
                  } else if (problems.length > 0) {
                    navigate(`/coding/${problems[0].id}`);
                  } else {
                    toast.info("No coding problems available yet. Ask an admin to add problems.");
                  }
                }}
                style={{
                  background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                  color: "#fff",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "10px",
                  fontWeight: "600",
                  fontSize: "14px",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: "0 4px 14px rgba(99, 102, 241, 0.4)",
                  transition: "all 0.2s"
                }}
              >
                <Code2 size={16} /> Solve Today's Challenge <ArrowRight size={15} />
              </button>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#eab308", fontSize: "13px", fontWeight: "600" }}>
                <Sparkles size={16} /> +{dailyProblem?.xpReward || 50} Coding XP
              </div>
            </div>
          </div>

          {/* STATS OVERVIEW CARDS */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "12px",
            background: "rgba(15, 23, 42, 0.6)",
            padding: "16px",
            borderRadius: "14px",
            border: "1px solid rgba(255, 255, 255, 0.08)"
          }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "11px", color: "#94a3b8", textTransform: "uppercase", fontWeight: "600" }}>Solved</div>
              <div style={{ fontSize: "22px", fontWeight: "700", color: "#38bdf8", margin: "4px 0" }}>
                {stats.userSolved}<span style={{ fontSize: "13px", color: "#64748b" }}>/{stats.totalProblems}</span>
              </div>
              <div style={{ fontSize: "11px", color: "#94a3b8" }}>{totalPercent}%</div>
            </div>

            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "11px", color: "#4ade80", textTransform: "uppercase", fontWeight: "600" }}>Easy</div>
              <div style={{ fontSize: "22px", fontWeight: "700", color: "#4ade80", margin: "4px 0" }}>
                {stats.userSolvedEasy}<span style={{ fontSize: "13px", color: "#64748b" }}>/{stats.easyTotal}</span>
              </div>
              <div style={{ fontSize: "11px", color: "#94a3b8" }}>{easyPercent}%</div>
            </div>

            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "11px", color: "#fbbf24", textTransform: "uppercase", fontWeight: "600" }}>Medium</div>
              <div style={{ fontSize: "22px", fontWeight: "700", color: "#fbbf24", margin: "4px 0" }}>
                {stats.userSolvedMedium}<span style={{ fontSize: "13px", color: "#64748b" }}>/{stats.mediumTotal}</span>
              </div>
              <div style={{ fontSize: "11px", color: "#94a3b8" }}>{mediumPercent}%</div>
            </div>

            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "11px", color: "#f87171", textTransform: "uppercase", fontWeight: "600" }}>Hard</div>
              <div style={{ fontSize: "22px", fontWeight: "700", color: "#f87171", margin: "4px 0" }}>
                {stats.userSolvedHard}<span style={{ fontSize: "13px", color: "#64748b" }}>/{stats.hardTotal}</span>
              </div>
              <div style={{ fontSize: "11px", color: "#94a3b8" }}>{hardPercent}%</div>
            </div>
          </div>
        </div>

        {/* TABS: PROBLEM LIST vs SUBMISSIONS */}
        <div style={{ display: "flex", gap: "10px", borderBottom: "1px solid rgba(255, 255, 255, 0.1)", paddingBottom: "8px" }}>
          <button
            onClick={() => setActiveTab("problems")}
            style={{
              background: activeTab === "problems" ? "rgba(99, 102, 241, 0.2)" : "transparent",
              color: activeTab === "problems" ? "#818cf8" : "#94a3b8",
              border: activeTab === "problems" ? "1px solid rgba(99, 102, 241, 0.4)" : "1px solid transparent",
              padding: "8px 18px",
              borderRadius: "8px",
              fontWeight: "600",
              fontSize: "14px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <BookOpen size={16} /> Problem Catalog ({problems.length})
          </button>

          <button
            onClick={() => {
              setActiveTab("submissions");
              loadSubmissions();
            }}
            style={{
              background: activeTab === "submissions" ? "rgba(99, 102, 241, 0.2)" : "transparent",
              color: activeTab === "submissions" ? "#818cf8" : "#94a3b8",
              border: activeTab === "submissions" ? "1px solid rgba(99, 102, 241, 0.4)" : "1px solid transparent",
              padding: "8px 18px",
              borderRadius: "8px",
              fontWeight: "600",
              fontSize: "14px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <Clock size={16} /> My Submissions
          </button>
        </div>

        {activeTab === "problems" && (
          <>
            {/* SEARCH & FILTERS BAR */}
            <div style={{
              background: "rgba(30, 41, 59, 0.6)",
              padding: "14px 18px",
              borderRadius: "12px",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              display: "flex",
              flexDirection: "column",
              gap: "12px"
            }}>
              {/* Row 1: Search + Difficulty buttons */}
              <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                <form onSubmit={handleSearchSubmit} style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: "200px" }}>
                  <div style={{ position: "relative", width: "100%" }}>
                    <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
                    <input
                      type="text"
                      placeholder="Search problem title, algorithm, tag..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 12px 8px 36px",
                        borderRadius: "8px",
                        background: "rgba(15, 23, 42, 0.8)",
                        border: "1px solid rgba(255, 255, 255, 0.12)",
                        color: "#f8fafc",
                        fontSize: "13px",
                        outline: "none"
                      }}
                    />
                  </div>
                </form>

                {/* Difficulty Filter */}
                <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                  {["ALL", "EASY", "MEDIUM", "HARD"].map((diff) => (
                    <button
                      key={diff}
                      onClick={() => setSelectedDifficulty(diff)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: "600",
                        cursor: "pointer",
                        border: selectedDifficulty === diff ? "1px solid rgba(99, 102, 241, 0.6)" : "1px solid rgba(255, 255, 255, 0.08)",
                        background: selectedDifficulty === diff ? "rgba(99, 102, 241, 0.25)" : "rgba(15, 23, 42, 0.6)",
                        color:
                          diff === "EASY" ? "#4ade80" :
                          diff === "MEDIUM" ? "#fbbf24" :
                          diff === "HARD" ? "#f87171" :
                          "#f8fafc"
                      }}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>

              {/* Row 2: Category + Status dropdowns side by side */}
              <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  style={{
                    padding: "7px 12px",
                    borderRadius: "8px",
                    background: "rgba(15, 23, 42, 0.8)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    color: "#f8fafc",
                    fontSize: "13px",
                    cursor: "pointer",
                    flex: 1,
                    minWidth: "180px"
                  }}
                >
                  <option value="ALL">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  style={{
                    padding: "7px 12px",
                    borderRadius: "8px",
                    background: "rgba(15, 23, 42, 0.8)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    color: "#f8fafc",
                    fontSize: "13px",
                    cursor: "pointer",
                    flex: 1,
                    minWidth: "180px"
                  }}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="SOLVED">Solved</option>
                  <option value="ATTEMPTED">Attempted</option>
                  <option value="TODO">Todo (Unsolved)</option>
                </select>
              </div>
            </div>

            {/* PROBLEMS TABLE / LIST */}
            <div className="coding-problems-table" style={{
              background: "rgba(30, 41, 59, 0.5)",
              borderRadius: "14px",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              overflow: "hidden"
            }}>
              {loading ? (
                <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
                  <Code2 className="animate-spin" size={32} style={{ margin: "0 auto 12px auto", color: "#6366f1" }} />
                  Loading coding challenges...
                </div>
              ) : filteredProblems.length === 0 ? (
                <div style={{ padding: "80px 20px", textAlign: "center", color: "#94a3b8" }}>
                  <Terminal size={48} style={{ margin: "0 auto 16px auto", opacity: 0.4, color: "#6366f1" }} />
                  <h3 style={{ fontSize: "18px", color: "#f8fafc", margin: "0 0 8px 0", fontWeight: "600" }}>No coding problems found</h3>
                  <p style={{ fontSize: "14px", margin: 0, maxWidth: "400px", marginLeft: "auto", marginRight: "auto", lineHeight: "1.5" }}>Try clearing search or filters to explore other challenges.</p>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
                    <thead>
                      <tr style={{ background: "rgba(15, 23, 42, 0.7)", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", color: "#94a3b8", fontSize: "12px", textTransform: "uppercase" }}>
                        <th style={{ padding: "14px 16px", width: "50px", textAlign: "center" }}>Status</th>
                        <th style={{ padding: "14px 16px" }}>Title</th>
                        <th style={{ padding: "14px 16px", width: "110px" }}>Difficulty</th>
                        <th style={{ padding: "14px 16px", width: "180px" }}>Category</th>
                        <th style={{ padding: "14px 16px", width: "120px" }}>Acceptance</th>
                        <th style={{ padding: "14px 16px", width: "90px" }}>XP</th>
                        <th style={{ padding: "14px 16px", width: "120px", textAlign: "right" }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProblems.map((p) => {
                        const isSolved = p.status === "SOLVED";
                        const isAttempted = p.status === "ATTEMPTED";

                        return (
                          <tr
                            key={p.id}
                            style={{
                              borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                              transition: "background 0.15s",
                              cursor: "pointer"
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)"}
                            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                            onClick={() => navigate(`/coding/${p.id}`)}
                          >
                            {/* Status Icon */}
                            <td style={{ padding: "14px 16px", textAlign: "center" }}>
                              {isSolved ? (
                                <CheckCircle2 size={18} style={{ color: "#22c55e" }} title="Solved" />
                              ) : isAttempted ? (
                                <Clock size={18} style={{ color: "#f59e0b" }} title="Attempted" />
                              ) : (
                                <Circle size={16} style={{ color: "#475569" }} title="Todo" />
                              )}
                            </td>

                            {/* Title & Tags */}
                            <td style={{ padding: "14px 16px" }}>
                              <div style={{ fontWeight: "600", color: "#f8fafc", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                                {p.title}
                                {p.isDailyChallenge && (
                                  <span style={{ fontSize: "10px", background: "rgba(239, 68, 68, 0.2)", color: "#f87171", padding: "1px 6px", borderRadius: "4px", fontWeight: "700" }}>DAILY</span>
                                )}
                              </div>
                              {p.tags && (
                                <div style={{ display: "flex", gap: "4px", marginTop: "4px", flexWrap: "wrap" }}>
                                  {p.tags.split(",").map((t) => (
                                    <span key={t} style={{ fontSize: "11px", color: "#64748b", background: "rgba(255, 255, 255, 0.04)", padding: "1px 6px", borderRadius: "4px" }}>
                                      #{t.trim()}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </td>

                            {/* Difficulty */}
                            <td style={{ padding: "14px 16px" }}>
                              <span style={{
                                fontSize: "12px",
                                fontWeight: "700",
                                padding: "3px 8px",
                                borderRadius: "6px",
                                background:
                                  p.difficulty === "EASY" ? "rgba(34, 197, 94, 0.15)" :
                                  p.difficulty === "MEDIUM" ? "rgba(245, 158, 11, 0.15)" :
                                  "rgba(239, 68, 68, 0.15)",
                                color:
                                  p.difficulty === "EASY" ? "#4ade80" :
                                  p.difficulty === "MEDIUM" ? "#fbbf24" :
                                  "#f87171"
                              }}>
                                {p.difficulty}
                              </span>
                            </td>

                            {/* Category */}
                            <td style={{ padding: "14px 16px", color: "#cbd5e1" }}>
                              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
                                <Layers size={14} style={{ color: "#818cf8" }} />
                                {p.category}
                              </span>
                            </td>

                            {/* Acceptance Rate */}
                            <td style={{ padding: "14px 16px", color: "#94a3b8", fontSize: "13px" }}>
                              {p.acceptanceRate ? `${p.acceptanceRate}%` : "—"}
                            </td>

                            {/* XP Reward */}
                            <td style={{ padding: "14px 16px" }}>
                              <span style={{ color: "#eab308", fontWeight: "600", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                                <Sparkles size={13} /> +{p.xpReward || 50}
                              </span>
                            </td>

                            {/* Action Button */}
                            <td style={{ padding: "14px 16px", textAlign: "right" }}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/coding/${p.id}`);
                                }}
                                style={{
                                  background: isSolved ? "rgba(34, 197, 94, 0.15)" : "rgba(99, 102, 241, 0.2)",
                                  color: isSolved ? "#4ade80" : "#818cf8",
                                  border: isSolved ? "1px solid rgba(34, 197, 94, 0.3)" : "1px solid rgba(99, 102, 241, 0.4)",
                                  padding: "6px 12px",
                                  borderRadius: "6px",
                                  fontSize: "12px",
                                  fontWeight: "600",
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px"
                                }}
                              >
                                {isSolved ? "Practice Again" : "Solve"} <ArrowRight size={13} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* SUBMISSIONS TAB */}
        {activeTab === "submissions" && (
          <div style={{
            background: "rgba(30, 41, 59, 0.5)",
            borderRadius: "14px",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            padding: "20px"
          }}>
            <h3 style={{ fontSize: "18px", color: "#f8fafc", margin: "0 0 16px 0" }}>Recent Coding Submissions</h3>
            {submissionsLoading ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>Loading submission history...</div>
            ) : submissions.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
                No submissions recorded yet. Pick a problem from the catalog to start coding!
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
                  <thead>
                    <tr style={{ color: "#94a3b8", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "8px" }}>
                      <th style={{ padding: "10px 14px" }}>Problem</th>
                      <th style={{ padding: "10px 14px" }}>Status</th>
                      <th style={{ padding: "10px 14px" }}>Language</th>
                      <th style={{ padding: "10px 14px" }}>Test Cases</th>
                      <th style={{ padding: "10px 14px" }}>Runtime</th>
                      <th style={{ padding: "10px 14px" }}>XP Earned</th>
                      <th style={{ padding: "10px 14px" }}>Submitted At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((sub) => (
                      <tr key={sub.id} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.04)" }}>
                        <td style={{ padding: "12px 14px", fontWeight: "600", color: "#f8fafc" }}>
                          <Link to={`/coding/${sub.problemId}`} style={{ color: "#818cf8", textDecoration: "none" }}>
                            {sub.problemTitle}
                          </Link>
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <span style={{
                            fontSize: "11px",
                            fontWeight: "700",
                            padding: "2px 8px",
                            borderRadius: "4px",
                            background: sub.status === "ACCEPTED" ? "rgba(34, 197, 94, 0.2)" : "rgba(239, 68, 68, 0.2)",
                            color: sub.status === "ACCEPTED" ? "#4ade80" : "#f87171"
                          }}>
                            {sub.status}
                          </span>
                        </td>
                        <td style={{ padding: "12px 14px", color: "#cbd5e1", textTransform: "uppercase" }}>{sub.language}</td>
                        <td style={{ padding: "12px 14px", color: "#94a3b8" }}>{sub.passedTestCases}/{sub.totalTestCases}</td>
                        <td style={{ padding: "12px 14px", color: "#94a3b8" }}>{sub.executionTimeMs} ms</td>
                        <td style={{ padding: "12px 14px", color: "#eab308" }}>+{sub.xpEarned || 0} XP</td>
                        <td style={{ padding: "12px 14px", color: "#64748b" }}>
                          {new Date(sub.submittedAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>
    </Page>
  );
}
