import React, { useState, useEffect } from "react";
import { api } from "../../api";
import { useToast } from "../../components/Toast";

const TABS = [
  { id: "problems", label: "📋 Problems", icon: "📋" },
  { id: "submissions", label: "📝 Submissions", icon: "📝" },
  { id: "performance", label: "📊 Performance", icon: "📊" },
  { id: "contests", label: "🏆 Contests", icon: "🏆" },
  { id: "categories", label: "🏷️ Categories", icon: "🏷️" },
];

const CATEGORIES_DEFAULT = [
  "Arrays & Strings",
  "Dynamic Programming",
  "Trees & Graphs",
  "Sorting & Searching",
  "Recursion & Backtracking",
  "Database / SQL",
  "Web / JavaScript",
  "Linked Lists",
  "Stacks & Queues",
  "Greedy Algorithms",
];

const DIFFICULTY_COLORS = {
  EASY: { bg: "rgba(34,197,94,0.15)", color: "#4ade80" },
  MEDIUM: { bg: "rgba(245,158,11,0.15)", color: "#fbbf24" },
  HARD: { bg: "rgba(239,68,68,0.15)", color: "#f87171" },
};

const STATUS_COLORS = {
  ACCEPTED: { bg: "rgba(34,197,94,0.15)", color: "#4ade80", label: "✅ Accepted" },
  WRONG_ANSWER: { bg: "rgba(239,68,68,0.15)", color: "#f87171", label: "❌ Wrong Answer" },
  TIME_LIMIT: { bg: "rgba(245,158,11,0.15)", color: "#fbbf24", label: "⏱️ Time Limit" },
  RUNTIME_ERROR: { bg: "rgba(239,68,68,0.15)", color: "#f87171", label: "💥 Runtime Error" },
  PENDING: { bg: "rgba(148,163,184,0.15)", color: "#94a3b8", label: "⏳ Pending" },
};

/* ═══════════════════════════════════════════════════════════
   PROBLEMS TAB
   ═══════════════════════════════════════════════════════════ */
function ProblemsTab({ problems, loading, onRefresh, toast }) {
  const [search, setSearch] = useState("");
  const [diffFilter, setDiffFilter] = useState("ALL");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    title: "", slug: "", difficulty: "EASY", category: "Arrays & Strings",
    description: "", inputFormat: "", outputFormat: "", constraints: "",
    points: 100, xpReward: 50, starterCodeJs: "function solution() {\n  // Write code\n}",
    hints: "", solutionExplanation: "", tags: "", sampleInput: "", sampleOutput: "",
  });

  const filtered = problems.filter(p => {
    const matchSearch = !search || p.title?.toLowerCase().includes(search.toLowerCase()) || p.category?.toLowerCase().includes(search.toLowerCase());
    const matchDiff = diffFilter === "ALL" || p.difficulty === diffFilter;
    return matchSearch && matchDiff;
  });

  function openCreate() {
    setEditing(null);
    setForm({ title: "", slug: "", difficulty: "EASY", category: "Arrays & Strings", description: "", inputFormat: "", outputFormat: "", constraints: "", points: 100, xpReward: 50, starterCodeJs: "function solution() {\n  // Write code\n}", hints: "", solutionExplanation: "", tags: "", sampleInput: "", sampleOutput: "" });
    setShowModal(true);
  }

  function openEdit(p) {
    setEditing(p);
    setForm({
      title: p.title || "", slug: p.slug || "", difficulty: p.difficulty || "EASY", category: p.category || "Arrays & Strings",
      description: p.description || "", inputFormat: p.inputFormat || "", outputFormat: p.outputFormat || "", constraints: p.constraints || "",
      points: p.points || 100, xpReward: p.xpReward || 50, starterCodeJs: p.starterCodeJson || "function solution() {\n  // Write code\n}",
      hints: p.hintsJson || "", solutionExplanation: p.solutionExplanation || "", tags: p.tags || "", sampleInput: "", sampleOutput: "",
    });
    setShowModal(true);
  }

  async function handleDelete(id, title) {
    if (!window.confirm(`Delete "${title}"?`)) return;
    try { await api.deleteCodingProblem(id); toast.success("Deleted!"); onRefresh(); }
    catch (e) { toast.error(e.message); }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const payload = {
        title: form.title, slug: form.slug || form.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        difficulty: form.difficulty, category: form.category, description: form.description,
        inputFormat: form.inputFormat, outputFormat: form.outputFormat, constraints: form.constraints,
        points: Number(form.points), xpReward: Number(form.xpReward),
        starterCodeJson: JSON.stringify({ javascript: form.starterCodeJs }),
        hintsJson: form.hints ? JSON.stringify([form.hints]) : "[]",
        solutionExplanation: form.solutionExplanation, tags: form.tags,
      };
      const testCases = [];
      if (form.sampleInput && form.sampleOutput) {
        testCases.push({ input: form.sampleInput, expectedOutput: form.sampleOutput, isSample: true, orderIndex: 0 });
      }
      if (editing) { await api.updateCodingProblem(editing.id, payload, testCases); toast.success("Updated!"); }
      else { await api.createCodingProblem(payload, testCases); toast.success("Created!"); }
      setShowModal(false); onRefresh();
    } catch (e) { toast.error(e.message); }
  }

  const cardStyle = { background: "rgba(30,41,59,0.6)", borderRadius: 14, border: "1px solid rgba(255,255,255,0.08)", padding: 16 };
  const inputStyle = { width: "100%", padding: "8px 12px", borderRadius: 6, background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.12)", color: "#f8fafc", fontSize: 13 };
  const labelStyle = { display: "block", fontSize: 12, color: "#94a3b8", marginBottom: 4, fontWeight: 600 };

  return (
    <>
      {/* Filters */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <input placeholder="🔍 Search problems..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: 200 }} />
        {["ALL", "EASY", "MEDIUM", "HARD"].map(d => (
          <button key={d} onClick={() => setDiffFilter(d)} style={{ padding: "6px 14px", borderRadius: 999, border: "1.5px solid", borderColor: d === "ALL" ? "#6366f1" : DIFFICULTY_COLORS[d]?.color || "#6366f1", background: d === diffFilter ? (d === "ALL" ? "#6366f1" : DIFFICULTY_COLORS[d]?.bg || "rgba(99,102,241,0.15)") : "transparent", color: d === diffFilter ? "#fff" : (DIFFICULTY_COLORS[d]?.color || "#94a3b8"), fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>{d}</button>
        ))}
        <button onClick={openCreate} style={{ marginLeft: "auto", background: "linear-gradient(135deg,#6366f1,#4f46e5)", color: "#fff", border: "none", padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>+ Create Problem</button>
      </div>

      {/* Table */}
      <div style={cardStyle}>
        {loading ? <p style={{ textAlign: "center", color: "#94a3b8", padding: 30 }}>Loading...</p> : filtered.length === 0 ? <p style={{ textAlign: "center", color: "#94a3b8", padding: 30 }}>No problems found.</p> : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", color: "#64748b", fontSize: 12, textTransform: "uppercase" }}>
                <th style={{ padding: "10px 14px", textAlign: "left" }}>#</th>
                <th style={{ padding: "10px 14px", textAlign: "left" }}>Title</th>
                <th style={{ padding: "10px 14px", textAlign: "left" }}>Difficulty</th>
                <th style={{ padding: "10px 14px", textAlign: "left" }}>Category</th>
                <th style={{ padding: "10px 14px", textAlign: "left" }}>Submissions</th>
                <th style={{ padding: "10px 14px", textAlign: "left" }}>XP</th>
                <th style={{ padding: "10px 14px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <td style={{ padding: "10px 14px", color: "#64748b" }}>#{p.id}</td>
                  <td style={{ padding: "10px 14px", fontWeight: 600, color: "#f1f5f9" }}>{p.title}</td>
                  <td style={{ padding: "10px 14px" }}><span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4, ...DIFFICULTY_COLORS[p.difficulty] }}>{p.difficulty}</span></td>
                  <td style={{ padding: "10px 14px", color: "#94a3b8", fontSize: 13 }}>{p.category}</td>
                  <td style={{ padding: "10px 14px", color: "#94a3b8" }}>{p.totalSubmissions || 0}</td>
                  <td style={{ padding: "10px 14px", color: "#eab308", fontWeight: 600 }}>+{p.xpReward || 50}</td>
                  <td style={{ padding: "10px 14px", textAlign: "right" }}>
                    <button onClick={() => openEdit(p)} style={{ background: "transparent", border: "none", color: "#818cf8", cursor: "pointer", marginRight: 8, fontSize: 13 }}>✏️ Edit</button>
                    <button onClick={() => handleDelete(p.id, p.title)} style={{ background: "transparent", border: "none", color: "#f87171", cursor: "pointer", fontSize: 13 }}>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
          <div style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, width: "100%", maxWidth: 700, maxHeight: "90vh", overflowY: "auto", padding: 24, color: "#f8fafc" }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 16px" }}>{editing ? "Edit Problem" : "Create Problem"}</h2>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
                <div><label style={labelStyle}>Title</label><input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Two Sum" style={inputStyle} /></div>
                <div><label style={labelStyle}>Difficulty</label><select value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })} style={inputStyle}><option value="EASY">EASY</option><option value="MEDIUM">MEDIUM</option><option value="HARD">HARD</option></select></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <div><label style={labelStyle}>Category</label><select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={inputStyle}>{CATEGORIES_DEFAULT.map(c => <option key={c}>{c}</option>)}</select></div>
                <div><label style={labelStyle}>Points</label><input type="number" value={form.points} onChange={e => setForm({ ...form, points: e.target.value })} style={inputStyle} /></div>
                <div><label style={labelStyle}>XP Reward</label><input type="number" value={form.xpReward} onChange={e => setForm({ ...form, xpReward: e.target.value })} style={inputStyle} /></div>
              </div>
              <div><label style={labelStyle}>Description</label><textarea rows={4} required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Problem description..." style={inputStyle} /></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div><label style={labelStyle}>Sample Input</label><input value={form.sampleInput} onChange={e => setForm({ ...form, sampleInput: e.target.value })} placeholder="[1,2,3]" style={{ ...inputStyle, fontFamily: "monospace" }} /></div>
                <div><label style={labelStyle}>Sample Output</label><input value={form.sampleOutput} onChange={e => setForm({ ...form, sampleOutput: e.target.value })} placeholder="[3,2,1]" style={{ ...inputStyle, fontFamily: "monospace" }} /></div>
              </div>
              <div><label style={labelStyle}>Starter Code (JS)</label><textarea rows={3} value={form.starterCodeJs} onChange={e => setForm({ ...form, starterCodeJs: e.target.value })} style={{ ...inputStyle, fontFamily: "monospace" }} /></div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ background: "transparent", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.15)", padding: "8px 16px", borderRadius: 8, cursor: "pointer" }}>Cancel</button>
                <button type="submit" style={{ background: "linear-gradient(135deg,#6366f1,#4f46e5)", color: "#fff", border: "none", padding: "8px 20px", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}>{editing ? "Save Changes" : "Create Problem"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
   SUBMISSIONS TAB
   ═══════════════════════════════════════════════════════════ */
function SubmissionsTab({ submissions, problems, loading }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const enriched = submissions.map(s => {
    const prob = problems.find(p => p.id === s.problemId || p.id === s.problem?.id);
    return { ...s, problemTitle: prob?.title || s.problem?.title || `Problem #${s.problemId}` };
  });

  const filtered = enriched.filter(s => {
    const matchSearch = !search || s.problemTitle?.toLowerCase().includes(search.toLowerCase()) || s.studentName?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "ALL" || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <input placeholder="🔍 Search by problem or student..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, minWidth: 200, padding: "8px 12px", borderRadius: 6, background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.12)", color: "#f8fafc", fontSize: 13 }} />
        {["ALL", "ACCEPTED", "WRONG_ANSWER", "TIME_LIMIT", "RUNTIME_ERROR"].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} style={{ padding: "6px 14px", borderRadius: 999, border: "1.5px solid", borderColor: s === "ALL" ? "#6366f1" : STATUS_COLORS[s]?.color || "#6366f1", background: statusFilter === s ? (s === "ALL" ? "#6366f1" : STATUS_COLORS[s]?.bg) : "transparent", color: statusFilter === s ? "#fff" : (STATUS_COLORS[s]?.color || "#94a3b8"), fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>{s === "ALL" ? "ALL" : STATUS_COLORS[s]?.label || s}</button>
        ))}
      </div>
      <div style={{ background: "rgba(30,41,59,0.6)", borderRadius: 14, border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden" }}>
        {loading ? <p style={{ textAlign: "center", color: "#94a3b8", padding: 30 }}>Loading...</p> : filtered.length === 0 ? <p style={{ textAlign: "center", color: "#94a3b8", padding: 30 }}>No submissions found.</p> : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", color: "#64748b", fontSize: 12, textTransform: "uppercase" }}>
                <th style={{ padding: "10px 14px", textAlign: "left" }}>Student</th>
                <th style={{ padding: "10px 14px", textAlign: "left" }}>Problem</th>
                <th style={{ padding: "10px 14px", textAlign: "left" }}>Status</th>
                <th style={{ padding: "10px 14px", textAlign: "left" }}>Language</th>
                <th style={{ padding: "10px 14px", textAlign: "left" }}>Time</th>
                <th style={{ padding: "10px 14px", textAlign: "left" }}>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => {
                const st = STATUS_COLORS[s.status] || STATUS_COLORS.PENDING;
                return (
                  <tr key={s.id || i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding: "10px 14px", fontWeight: 600, color: "#f1f5f9" }}>{s.studentName || s.user?.name || "—"}</td>
                    <td style={{ padding: "10px 14px", color: "#94a3b8" }}>{s.problemTitle}</td>
                    <td style={{ padding: "10px 14px" }}><span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: st.bg, color: st.color }}>{st.label}</span></td>
                    <td style={{ padding: "10px 14px", color: "#94a3b8", fontSize: 13 }}>{s.language || "—"}</td>
                    <td style={{ padding: "10px 14px", color: "#94a3b8" }}>{s.executionTimeMs ? `${s.executionTimeMs}ms` : "—"}</td>
                    <td style={{ padding: "10px 14px", color: "#64748b", fontSize: 12 }}>{s.submittedAt ? new Date(s.submittedAt).toLocaleDateString() : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
   PERFORMANCE TAB
   ═══════════════════════════════════════════════════════════ */
function PerformanceTab({ problems, submissions }) {
  const totalProblems = problems.length;
  const easy = problems.filter(p => p.difficulty === "EASY").length;
  const medium = problems.filter(p => p.difficulty === "MEDIUM").length;
  const hard = problems.filter(p => p.difficulty === "HARD").length;

  const totalSubs = submissions.length;
  const accepted = submissions.filter(s => s.status === "ACCEPTED").length;
  const rejected = submissions.filter(s => s.status === "WRONG_ANSWER").length;
  const acceptanceRate = totalSubs > 0 ? ((accepted / totalSubs) * 100).toFixed(1) : 0;

  // Student leaderboard from submissions
  const studentMap = {};
  submissions.forEach(s => {
    const name = s.studentName || s.user?.name || "Unknown";
    if (!studentMap[name]) studentMap[name] = { solved: new Set(), total: 0, accepted: 0 };
    studentMap[name].total++;
    if (s.status === "ACCEPTED") {
      studentMap[name].accepted++;
      studentMap[name].solved.add(s.problemId || s.problem?.id);
    }
  });
  const leaderboard = Object.entries(studentMap).map(([name, data]) => ({
    name, solved: data.solved.size, total: data.total, rate: data.total > 0 ? ((data.accepted / data.total) * 100).toFixed(0) : 0,
  })).sort((a, b) => b.solved - a.solved).slice(0, 10);

  // Category breakdown
  const catMap = {};
  problems.forEach(p => {
    const cat = p.category || "Other";
    if (!catMap[cat]) catMap[cat] = { total: 0, subs: 0 };
    catMap[cat].total++;
  });
  submissions.forEach(s => {
    const prob = problems.find(p => p.id === s.problemId || p.id === s.problem?.id);
    const cat = prob?.category || "Other";
    if (!catMap[cat]) catMap[cat] = { total: 0, subs: 0 };
    catMap[cat].subs++;
  });

  const statCard = (label, value, color, icon) => (
    <div style={{ background: "rgba(30,41,59,0.6)", borderRadius: 14, border: "1px solid rgba(255,255,255,0.08)", padding: 20, flex: 1, minWidth: 160 }}>
      <div style={{ fontSize: 28, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color, letterSpacing: "-0.02em" }}>{value}</div>
      <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 2 }}>{label}</div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Overview Stats */}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        {statCard("Total Problems", totalProblems, "#818cf8", "📋")}
        {statCard("Easy", easy, "#4ade80", "🟢")}
        {statCard("Medium", medium, "#fbbf24", "🟡")}
        {statCard("Hard", hard, "#f87171", "🔴")}
        {statCard("Total Submissions", totalSubs, "#38bdf8", "📝")}
        {statCard("Acceptance Rate", `${acceptanceRate}%`, "#34d399", "✅")}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Leaderboard */}
        <div style={{ background: "rgba(30,41,59,0.6)", borderRadius: 14, border: "1px solid rgba(255,255,255,0.08)", padding: 20 }}>
          <h3 style={{ margin: "0 0 14px", fontSize: 16, fontWeight: 700 }}>🏆 Top Students</h3>
          {leaderboard.length === 0 ? <p style={{ color: "#64748b", fontSize: 13 }}>No submissions yet.</p> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {leaderboard.map((s, i) => (
                <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 8, background: "rgba(255,255,255,0.03)" }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: i < 3 ? "#eab308" : "#64748b", width: 24, textAlign: "center" }}>{i + 1}</span>
                  <span style={{ flex: 1, fontWeight: 600, color: "#f1f5f9", fontSize: 13 }}>{s.name}</span>
                  <span style={{ fontSize: 12, color: "#4ade80", fontWeight: 700 }}>{s.solved} solved</span>
                  <span style={{ fontSize: 11, color: "#64748b" }}>{s.rate}%</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Category Breakdown */}
        <div style={{ background: "rgba(30,41,59,0.6)", borderRadius: 14, border: "1px solid rgba(255,255,255,0.08)", padding: 20 }}>
          <h3 style={{ margin: "0 0 14px", fontSize: 16, fontWeight: 700 }}>📊 Category Breakdown</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {Object.entries(catMap).map(([cat, data]) => (
              <div key={cat} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 8, background: "rgba(255,255,255,0.03)" }}>
                <span style={{ flex: 1, fontSize: 13, color: "#f1f5f9", fontWeight: 500 }}>{cat}</span>
                <span style={{ fontSize: 12, color: "#818cf8", fontWeight: 700 }}>{data.total} problems</span>
                <span style={{ fontSize: 11, color: "#64748b" }}>{data.subs} subs</span>
              </div>
            ))}
            {Object.keys(catMap).length === 0 && <p style={{ color: "#64748b", fontSize: 13 }}>No data.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   CONTESTS TAB
   ═══════════════════════════════════════════════════════════ */
function ContestsTab({ problems, toast }) {
  const [contests, setContests] = useState(() => {
    try { return JSON.parse(localStorage.getItem("coding-contests") || "[]"); } catch { return []; }
  });
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", duration: 60, startDate: "", selectedProblems: [] });

  function saveContests(list) { setContests(list); localStorage.setItem("coding-contests", JSON.stringify(list)); }

  function toggleProblem(id) {
    setForm(f => ({ ...f, selectedProblems: f.selectedProblems.includes(id) ? f.selectedProblems.filter(x => x !== id) : [...f.selectedProblems, id] }));
  }

  function handleCreate(e) {
    e.preventDefault();
    if (form.selectedProblems.length === 0) { toast.error("Select at least one problem"); return; }
    const contest = { id: Date.now(), ...form, status: "UPCOMING", participants: 0, createdAt: new Date().toISOString() };
    saveContests([...contests, contest]);
    toast.success("Contest created!");
    setShowModal(false);
    setForm({ title: "", description: "", duration: 60, startDate: "", selectedProblems: [] });
  }

  function deleteContest(id) {
    if (!window.confirm("Delete this contest?")) return;
    saveContests(contests.filter(c => c.id !== id));
    toast.success("Deleted!");
  }

  function startContest(id) {
    saveContests(contests.map(c => c.id === id ? { ...c, status: "LIVE" } : c));
    toast.success("Contest started!");
  }

  function endContest(id) {
    saveContests(contests.map(c => c.id === id ? { ...c, status: "ENDED" } : c));
    toast.success("Contest ended!");
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button onClick={() => setShowModal(true)} style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)", color: "#fff", border: "none", padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>+ Create Contest</button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {contests.length === 0 ? (
          <div style={{ background: "rgba(30,41,59,0.6)", borderRadius: 14, border: "1px solid rgba(255,255,255,0.08)", padding: 40, textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🏆</div>
            <h3 style={{ color: "#f1f5f9", margin: "0 0 6px" }}>No Contests Yet</h3>
            <p style={{ color: "#64748b", fontSize: 13 }}>Create a coding contest to challenge your students!</p>
          </div>
        ) : contests.map(c => {
          const statusColor = c.status === "LIVE" ? "#4ade80" : c.status === "ENDED" ? "#64748b" : "#fbbf24";
          return (
            <div key={c.id} style={{ background: "rgba(30,41,59,0.6)", borderRadius: 14, border: "1px solid rgba(255,255,255,0.08)", padding: 20, display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ fontSize: 32 }}>🏆</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: "#f1f5f9", fontSize: 16 }}>{c.title}</div>
                <div style={{ color: "#94a3b8", fontSize: 13, marginTop: 2 }}>{c.description || "No description"}</div>
                <div style={{ display: "flex", gap: 12, marginTop: 6, fontSize: 12, color: "#64748b" }}>
                  <span>⏱️ {c.duration} min</span>
                  <span>📋 {c.selectedProblems?.length || 0} problems</span>
                  <span>👥 {c.participants || 0} participants</span>
                </div>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 999, background: `${statusColor}20`, color: statusColor }}>{c.status}</span>
              <div style={{ display: "flex", gap: 6 }}>
                {c.status === "UPCOMING" && <button onClick={() => startContest(c.id)} style={{ background: "#10b981", color: "#fff", border: "none", padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>▶ Start</button>}
                {c.status === "LIVE" && <button onClick={() => endContest(c.id)} style={{ background: "#ef4444", color: "#fff", border: "none", padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>⏹ End</button>}
                <button onClick={() => deleteContest(c.id)} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#f87171", padding: "6px 12px", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>🗑️</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Contest Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
          <div style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, width: "100%", maxWidth: 600, maxHeight: "90vh", overflowY: "auto", padding: 24, color: "#f8fafc" }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 16px" }}>🏆 Create Contest</h2>
            <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div><label style={{ display: "block", fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>Title</label><input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Week 5 Challenge" style={{ width: "100%", padding: "8px 12px", borderRadius: 6, background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.12)", color: "#f8fafc" }} /></div>
              <div><label style={{ display: "block", fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>Description</label><textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Contest description..." style={{ width: "100%", padding: "8px 12px", borderRadius: 6, background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.12)", color: "#f8fafc" }} /></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div><label style={{ display: "block", fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>Duration (min)</label><input type="number" value={form.duration} onChange={e => setForm({ ...form, duration: Number(e.target.value) })} style={{ width: "100%", padding: "8px 12px", borderRadius: 6, background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.12)", color: "#f8fafc" }} /></div>
                <div><label style={{ display: "block", fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>Start Date</label><input type="datetime-local" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} style={{ width: "100%", padding: "8px 12px", borderRadius: 6, background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.12)", color: "#f8fafc" }} /></div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>Select Problems ({form.selectedProblems.length} selected)</label>
                <div style={{ maxHeight: 200, overflowY: "auto", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: 8 }}>
                  {problems.map(p => (
                    <label key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 6, cursor: "pointer", background: form.selectedProblems.includes(p.id) ? "rgba(99,102,241,0.15)" : "transparent" }}>
                      <input type="checkbox" checked={form.selectedProblems.includes(p.id)} onChange={() => toggleProblem(p.id)} />
                      <span style={{ flex: 1, fontSize: 13, color: "#f1f5f9" }}>{p.title}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "1px 6px", borderRadius: 4, ...DIFFICULTY_COLORS[p.difficulty] }}>{p.difficulty}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ background: "transparent", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.15)", padding: "8px 16px", borderRadius: 8, cursor: "pointer" }}>Cancel</button>
                <button type="submit" style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)", color: "#fff", border: "none", padding: "8px 20px", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}>Create Contest</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
   CATEGORIES TAB
   ═══════════════════════════════════════════════════════════ */
function CategoriesTab({ problems }) {
  const [categories, setCategories] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("coding-categories") || "null");
      return saved && saved.length > 0 ? saved : CATEGORIES_DEFAULT;
    } catch { return CATEGORIES_DEFAULT; }
  });
  const [newCat, setNewCat] = useState("");
  const [editing, setEditing] = useState(null);
  const [editVal, setEditVal] = useState("");

  function saveCats(list) { setCategories(list); localStorage.setItem("coding-categories", JSON.stringify(list)); }

  function addCategory() {
    const val = newCat.trim();
    if (!val || categories.includes(val)) return;
    saveCats([...categories, val]);
    setNewCat("");
  }

  function deleteCategory(cat) {
    if (!window.confirm(`Delete category "${cat}"?`)) return;
    saveCats(categories.filter(c => c !== cat));
  }

  function saveEdit() {
    if (!editVal.trim()) return;
    saveCats(categories.map(c => c === editing ? editVal.trim() : c));
    setEditing(null);
  }

  const catStats = categories.map(cat => ({
    name: cat, count: problems.filter(p => p.category === cat).length,
    easy: problems.filter(p => p.category === cat && p.difficulty === "EASY").length,
    medium: problems.filter(p => p.category === cat && p.difficulty === "MEDIUM").length,
    hard: problems.filter(p => p.category === cat && p.difficulty === "HARD").length,
  }));

  return (
    <>
      <div style={{ display: "flex", gap: 10, marginBottom: 4 }}>
        <input placeholder="➕ Add new category..." value={newCat} onChange={e => setNewCat(e.target.value)} onKeyDown={e => e.key === "Enter" && addCategory()} style={{ flex: 1, padding: "8px 12px", borderRadius: 6, background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.12)", color: "#f8fafc", fontSize: 13 }} />
        <button onClick={addCategory} style={{ background: "#10b981", color: "#fff", border: "none", padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Add</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14, marginTop: 8 }}>
        {catStats.map(cat => (
          <div key={cat.name} style={{ background: "rgba(30,41,59,0.6)", borderRadius: 14, border: "1px solid rgba(255,255,255,0.08)", padding: 16 }}>
            {editing === cat.name ? (
              <div style={{ display: "flex", gap: 8 }}>
                <input value={editVal} onChange={e => setEditVal(e.target.value)} onKeyDown={e => e.key === "Enter" && saveEdit()} autoFocus style={{ flex: 1, padding: "6px 10px", borderRadius: 6, background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.12)", color: "#f8fafc", fontSize: 13 }} />
                <button onClick={saveEdit} style={{ background: "#10b981", color: "#fff", border: "none", padding: "4px 10px", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>✓</button>
                <button onClick={() => setEditing(null)} style={{ background: "transparent", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.1)", padding: "4px 10px", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>✕</button>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontWeight: 700, color: "#f1f5f9", fontSize: 14 }}>{cat.name}</span>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button onClick={() => { setEditing(cat.name); setEditVal(cat.name); }} style={{ background: "transparent", border: "none", color: "#818cf8", cursor: "pointer", fontSize: 12 }}>✏️</button>
                    <button onClick={() => deleteCategory(cat.name)} style={{ background: "transparent", border: "none", color: "#f87171", cursor: "pointer", fontSize: 12 }}>🗑️</button>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, fontSize: 12 }}>
                  <span style={{ color: "#94a3b8" }}>{cat.count} problems</span>
                  <span style={{ color: "#4ade80" }}>{cat.easy} easy</span>
                  <span style={{ color: "#fbbf24" }}>{cat.medium} med</span>
                  <span style={{ color: "#f87171" }}>{cat.hard} hard</span>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */
export default function InstructorCodingPractice() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState("problems");
  const [problems, setProblems] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [probData, subData] = await Promise.all([
        api.codingProblems().catch(() => ({ problems: [] })),
        api.adminQuizAttempts().catch(() => []),
      ]);
      setProblems(probData?.problems || []);
      setSubmissions(Array.isArray(subData) ? subData : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  const tabs = [
    { id: "problems", label: `📋 Problems (${problems.length})` },
    { id: "submissions", label: `📝 Submissions (${submissions.length})` },
    { id: "performance", label: "📊 Performance" },
    { id: "contests", label: "🏆 Contests" },
    { id: "categories", label: "🏷️ Categories" },
  ];

  return (
    <div className="inst-page">
      <div className="inst-page-header">
        <div>
          <h1>💻 Coding Practice</h1>
          <p>Manage coding problems, view submissions, track performance, and create contests.</p>
        </div>
        <button className="inst-btn inst-btn-primary" onClick={loadAll}>🔄 Refresh</button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ padding: "8px 16px", borderRadius: 8, border: activeTab === t.id ? "2px solid #6366f1" : "1.5px solid rgba(255,255,255,0.1)", background: activeTab === t.id ? "rgba(99,102,241,0.15)" : "transparent", color: activeTab === t.id ? "#818cf8" : "#94a3b8", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit", transition: "all .2s" }}>{t.label}</button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {activeTab === "problems" && <ProblemsTab problems={problems} loading={loading} onRefresh={loadAll} toast={toast} />}
        {activeTab === "submissions" && <SubmissionsTab submissions={submissions} problems={problems} loading={loading} />}
        {activeTab === "performance" && <PerformanceTab problems={problems} submissions={submissions} />}
        {activeTab === "contests" && <ContestsTab problems={problems} toast={toast} />}
        {activeTab === "categories" && <CategoriesTab problems={problems} />}
      </div>
    </div>
  );
}
