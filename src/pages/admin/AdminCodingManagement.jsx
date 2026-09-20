import React, { useState, useEffect } from "react";
import {
  Code2,
  Plus,
  Edit2,
  Trash2,
  Search,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Layers,
  BookOpen,
  Eye
} from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../../api";
import { Page } from "../../ui";
import { useToast } from "../../components/Toast";

export default function AdminCodingManagement() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [problems, setProblems] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingProblem, setEditingProblem] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    difficulty: "EASY",
    category: "Arrays & Strings",
    description: "",
    inputFormat: "",
    outputFormat: "",
    constraints: "",
    points: 100,
    xpReward: 50,
    starterCodeJs: "function solution() {\n    // Write code\n}",
    hints: "",
    solutionExplanation: "",
    tags: "",
    sampleInput: "",
    sampleOutput: "",
  });

  useEffect(() => {
    loadProblems();
  }, []);

  async function loadProblems() {
    setLoading(true);
    try {
      const data = await api.codingProblems();
      setProblems(data?.problems || []);
    } catch (err) {
      toast.error("Failed to load problems: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingProblem(null);
    setFormData({
      title: "",
      slug: "",
      difficulty: "EASY",
      category: "Arrays & Strings",
      description: "",
      inputFormat: "",
      outputFormat: "",
      constraints: "",
      points: 100,
      xpReward: 50,
      starterCodeJs: "function solution() {\n    // Write code\n}",
      hints: "",
      solutionExplanation: "",
      tags: "",
      sampleInput: "",
      sampleOutput: "",
    });
    setShowModal(true);
  }

  function openEditModal(p) {
    setEditingProblem(p);
    setFormData({
      title: p.title || "",
      slug: p.slug || "",
      difficulty: p.difficulty || "EASY",
      category: p.category || "Arrays & Strings",
      description: p.description || "",
      inputFormat: p.inputFormat || "",
      outputFormat: p.outputFormat || "",
      constraints: p.constraints || "",
      points: p.points || 100,
      xpReward: p.xpReward || 50,
      starterCodeJs: p.starterCodeJson || "function solution() {\n    // Write code\n}",
      hints: p.hintsJson || "",
      solutionExplanation: p.solutionExplanation || "",
      tags: p.tags || "",
      sampleInput: "",
      sampleOutput: "",
    });
    setShowModal(true);
  }

  async function handleDelete(id, title) {
    if (!window.confirm(`Are you sure you want to delete problem "${title}"?`)) return;
    try {
      await api.deleteCodingProblem(id);
      toast.success("Problem deleted successfully.");
      loadProblems();
    } catch (err) {
      toast.error("Failed to delete problem: " + err.message);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const starterCodeMap = {
        javascript: formData.starterCodeJs,
        python: `# Python solution\ndef solution():\n    pass`,
        java: `// Java Solution\nclass Solution {\n    public void solution() {\n    }\n}`
      };

      const problemPayload = {
        title: formData.title,
        slug: formData.slug || formData.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        difficulty: formData.difficulty,
        category: formData.category,
        description: formData.description,
        inputFormat: formData.inputFormat,
        outputFormat: formData.outputFormat,
        constraints: formData.constraints,
        points: Number(formData.points),
        xpReward: Number(formData.xpReward),
        starterCodeJson: JSON.stringify(starterCodeMap),
        hintsJson: formData.hints ? JSON.stringify([formData.hints]) : "[]",
        solutionExplanation: formData.solutionExplanation,
        tags: formData.tags
      };

      const testCases = [];
      if (formData.sampleInput && formData.sampleOutput) {
        testCases.push({
          input: formData.sampleInput,
          expectedOutput: formData.sampleOutput,
          isSample: true,
          explanation: "Sample Testcase",
          orderIndex: 0
        });
      }

      if (editingProblem) {
        await api.updateCodingProblem(editingProblem.id, problemPayload, testCases);
        toast.success("Problem updated successfully.");
      } else {
        await api.createCodingProblem(problemPayload, testCases);
        toast.success("Problem created successfully!");
      }

      setShowModal(false);
      loadProblems();
    } catch (err) {
      toast.error("Failed to save problem: " + err.message);
    }
  }

  const filtered = problems.filter((p) =>
    !search.trim() ||
    p.title?.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Page title="Coding Practice Management" subtitle="Create, edit, and organize coding problems and algorithmic test cases.">
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        
        {/* ACTION BAR */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "rgba(30, 41, 59, 0.6)",
          padding: "16px 20px",
          borderRadius: "12px",
          border: "1px solid rgba(255, 255, 255, 0.08)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", width: "300px" }}>
            <Search size={16} style={{ color: "#64748b" }} />
            <input
              type="text"
              placeholder="Search problems..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                background: "rgba(15, 23, 42, 0.8)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "#f8fafc",
                borderRadius: "6px",
                padding: "6px 10px",
                fontSize: "13px",
                outline: "none"
              }}
            />
          </div>

          <button
            onClick={openCreateModal}
            style={{
              background: "linear-gradient(135deg, #6366f1, #4f46e5)",
              color: "#fff",
              border: "none",
              padding: "8px 18px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <Plus size={16} /> Create Problem
          </button>
        </div>

        {/* PROBLEMS TABLE */}
        <div style={{
          background: "rgba(30, 41, 59, 0.5)",
          borderRadius: "14px",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          overflow: "hidden"
        }}>
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>Loading problems...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>No coding problems found.</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
              <thead>
                <tr style={{ background: "rgba(15, 23, 42, 0.7)", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", color: "#94a3b8", fontSize: "12px", textTransform: "uppercase" }}>
                  <th style={{ padding: "12px 16px" }}>ID</th>
                  <th style={{ padding: "12px 16px" }}>Title</th>
                  <th style={{ padding: "12px 16px" }}>Difficulty</th>
                  <th style={{ padding: "12px 16px" }}>Category</th>
                  <th style={{ padding: "12px 16px" }}>Submissions</th>
                  <th style={{ padding: "12px 16px" }}>XP Reward</th>
                  <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}>
                    <td style={{ padding: "12px 16px", color: "#64748b" }}>#{p.id}</td>
                    <td style={{ padding: "12px 16px", fontWeight: "600", color: "#f8fafc" }}>
                      {p.title}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{
                        fontSize: "11px",
                        fontWeight: "700",
                        padding: "2px 8px",
                        borderRadius: "4px",
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
                    <td style={{ padding: "12px 16px", color: "#94a3b8" }}>{p.category}</td>
                    <td style={{ padding: "12px 16px", color: "#94a3b8" }}>{p.totalSubmissions || 0}</td>
                    <td style={{ padding: "12px 16px", color: "#eab308" }}>+{p.xpReward || 50} XP</td>
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                        <Link
                          to={`/coding/${p.id}`}
                          target="_blank"
                          style={{ color: "#38bdf8", padding: "4px" }}
                          title="Open in IDE"
                        >
                          <Eye size={16} />
                        </Link>
                        <button
                          onClick={() => openEditModal(p)}
                          style={{ background: "transparent", border: "none", color: "#818cf8", cursor: "pointer", padding: "4px" }}
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id, p.title)}
                          style={{ background: "transparent", border: "none", color: "#f87171", cursor: "pointer", padding: "4px" }}
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* CREATE / EDIT MODAL */}
        {showModal && (
          <div style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px"
          }}>
            <div style={{
              background: "#0f172a",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "700px",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "24px",
              color: "#f8fafc"
            }}>
              <h2 style={{ fontSize: "20px", fontWeight: "700", margin: "0 0 16px 0" }}>
                {editingProblem ? "Edit Coding Problem" : "Create New Coding Problem"}
              </h2>

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", color: "#94a3b8", marginBottom: "4px" }}>Problem Title</label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g. Reverse Linked List"
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", background: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(255, 255, 255, 0.12)", color: "#f8fafc" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", color: "#94a3b8", marginBottom: "4px" }}>Difficulty</label>
                    <select
                      value={formData.difficulty}
                      onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", background: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(255, 255, 255, 0.12)", color: "#f8fafc" }}
                    >
                      <option value="EASY">EASY</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HARD">HARD</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", color: "#94a3b8", marginBottom: "4px" }}>Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", background: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(255, 255, 255, 0.12)", color: "#f8fafc" }}
                    >
                      <option value="Arrays & Strings">Arrays & Strings</option>
                      <option value="Dynamic Programming">Dynamic Programming</option>
                      <option value="Trees & Graphs">Trees & Graphs</option>
                      <option value="Sorting & Searching">Sorting & Searching</option>
                      <option value="Recursion">Recursion</option>
                      <option value="Database/SQL">Database/SQL</option>
                      <option value="Web">Web / JavaScript</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", color: "#94a3b8", marginBottom: "4px" }}>Points</label>
                    <input
                      type="number"
                      value={formData.points}
                      onChange={(e) => setFormData({ ...formData, points: e.target.value })}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", background: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(255, 255, 255, 0.12)", color: "#f8fafc" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", color: "#94a3b8", marginBottom: "4px" }}>XP Reward</label>
                    <input
                      type="number"
                      value={formData.xpReward}
                      onChange={(e) => setFormData({ ...formData, xpReward: e.target.value })}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", background: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(255, 255, 255, 0.12)", color: "#f8fafc" }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", color: "#94a3b8", marginBottom: "4px" }}>Description (Markdown / Text)</label>
                  <textarea
                    rows={4}
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the problem statement and expectations..."
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", background: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(255, 255, 255, 0.12)", color: "#f8fafc", fontFamily: "sans-serif" }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", color: "#94a3b8", marginBottom: "4px" }}>Sample Input</label>
                    <input
                      type="text"
                      value={formData.sampleInput}
                      onChange={(e) => setFormData({ ...formData, sampleInput: e.target.value })}
                      placeholder="e.g. [1, 2, 3, 4]"
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", background: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(255, 255, 255, 0.12)", color: "#f8fafc", fontFamily: "monospace" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", color: "#94a3b8", marginBottom: "4px" }}>Sample Expected Output</label>
                    <input
                      type="text"
                      value={formData.sampleOutput}
                      onChange={(e) => setFormData({ ...formData, sampleOutput: e.target.value })}
                      placeholder="e.g. [4, 3, 2, 1]"
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", background: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(255, 255, 255, 0.12)", color: "#f8fafc", fontFamily: "monospace" }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", color: "#94a3b8", marginBottom: "4px" }}>Starter JavaScript Template</label>
                  <textarea
                    rows={3}
                    value={formData.starterCodeJs}
                    onChange={(e) => setFormData({ ...formData, starterCodeJs: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", background: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(255, 255, 255, 0.12)", color: "#f8fafc", fontFamily: "monospace" }}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    style={{ background: "transparent", color: "#94a3b8", border: "1px solid rgba(255, 255, 255, 0.15)", padding: "8px 16px", borderRadius: "8px", cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)", color: "#fff", border: "none", padding: "8px 20px", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}
                  >
                    {editingProblem ? "Save Changes" : "Create Challenge"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </Page>
  );
}
