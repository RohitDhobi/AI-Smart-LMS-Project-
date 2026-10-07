import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";
import { Loading, Empty, Page } from "../../ui";

export default function AdminResults() {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      setLoading(true);
      const a = await api.adminQuizAttempts().catch(() => []);
      setAttempts(Array.isArray(a) ? a : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  function getQuizTitle(a) {
    return a.quiz?.title || a.quizTitle || `Quiz #${a.quiz?.id || a.quizId || "?"}`;
  }

  function getStudentName(a) {
    return a.user?.name || a.studentName || "—";
  }

  function getAttemptDate(a) {
    const dateStr = a.attemptedAt || a.createdAt;
    return dateStr ? new Date(dateStr).toLocaleDateString() : "—";
  }

  const filtered = attempts.filter((a) =>
    !search ||
    getQuizTitle(a).toLowerCase().includes(search.toLowerCase()) ||
    getStudentName(a).toLowerCase().includes(search.toLowerCase())
  );

  const avgScore = attempts.length > 0
    ? (attempts.reduce((sum, a) => sum + (a.score || 0), 0) / attempts.length).toFixed(1)
    : 0;

  if (loading) return <Loading />;

  return (
    <Page title="📊 Results" subtitle="View quiz and exam results.">
      <div className="admin-quick-links" style={{ marginBottom: 20 }}>
        <Link className="primary button-link" to="/admin">← Back to Dashboard</Link>
      </div>

      <div className="analytics-stats" style={{ marginBottom: 20 }}>
        <div className="card analytics-stat tint-blue">
          <span className="analytics-stat-icon">📝</span>
          <div className="analytics-stat-text">
            <strong>{attempts.length}</strong>
            <span>Total Attempts</span>
          </div>
        </div>
        <div className="card analytics-stat tint-green">
          <span className="analytics-stat-icon">🏅</span>
          <div className="analytics-stat-text">
            <strong>{avgScore}%</strong>
            <span>Average Score</span>
          </div>
        </div>
      </div>

      <input placeholder="🔍 Search results..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 300, padding: "8px 12px", fontSize: 13, marginBottom: 20 }} />

      <div className="card">
        <div className="dash-panel-head">
          <h3>Quiz Attempts ({filtered.length})</h3>
        </div>
        {filtered.length === 0 ? <Empty text="No results found." /> : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>ID</th><th>Student</th><th>Quiz</th><th>Score</th><th>Result</th><th>Date</th></tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.id}>
                    <td>{a.id}</td>
                    <td>{getStudentName(a)}</td>
                    <td><strong>{getQuizTitle(a)}</strong></td>
                    <td>
                      <span style={{ color: (a.score / (a.totalMarks || 1)) * 100 >= 70 ? "#16a34a" : "#dc2626", fontWeight: 600 }}>
                        {a.score || 0}/{a.totalMarks || 0}
                      </span>
                    </td>
                    <td>
                      <span className={"result-badge " + (a.passed ? "passed" : "failed")}>
                        {a.passed ? "✅ Passed" : "❌ Failed"}
                      </span>
                    </td>
                    <td>{getAttemptDate(a)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Page>
  );
}
