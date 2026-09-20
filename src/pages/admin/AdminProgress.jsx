import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";
import { Loading, Empty, Page } from "../../ui";

export default function AdminProgress() {
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      setLoading(true);
      const p = await api.myProgress().catch(() => []);
      setProgress(Array.isArray(p) ? p : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  const filtered = progress.filter((p) =>
    !search || p.courseTitle?.toLowerCase().includes(search.toLowerCase())
  );

  const avgProgress = progress.length > 0
    ? (progress.reduce((sum, p) => sum + (p.progressPercentage || 0), 0) / progress.length).toFixed(1)
    : 0;

  const isDark = typeof document !== "undefined" && document.documentElement.getAttribute("data-theme") === "dark";

  if (loading) return <Loading />;

  return (
    <Page title="📈 Progress" subtitle="Track student progress across courses.">
      <div className="admin-quick-links" style={{ marginBottom: 20 }}>
        <Link className="primary button-link" to="/admin">← Back to Dashboard</Link>
      </div>

      <div className="analytics-stats" style={{ marginBottom: 20 }}>
        <div className="card analytics-stat tint-blue">
          <span className="analytics-stat-icon">📈</span>
          <div className="analytics-stat-text">
            <strong>{progress.length}</strong>
            <span>Progress Records</span>
          </div>
        </div>
        <div className="card analytics-stat tint-green">
          <span className="analytics-stat-icon">✅</span>
          <div className="analytics-stat-text">
            <strong>{avgProgress}%</strong>
            <span>Average Progress</span>
          </div>
        </div>
      </div>

      <input placeholder="🔍 Search..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 300, padding: "8px 12px", fontSize: 13, marginBottom: 20 }} />

      <div className="card">
        <div className="dash-panel-head">
          <h3>Progress Records ({filtered.length})</h3>
        </div>
        {filtered.length === 0 ? <Empty text="No progress records found." /> : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>Course</th><th>Progress</th><th>Status</th><th>Last Updated</th></tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <tr key={i}>
                    <td><strong>{p.courseTitle || `Course #${p.courseId}`}</strong></td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 100, height: 6, background: isDark ? "#334155" : "#e2e8f0", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ width: `${p.progressPercentage || 0}%`, height: "100%", background: p.progressPercentage >= 70 ? "#16a34a" : "#2563eb", borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600 }}>{p.progressPercentage || 0}%</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ color: p.completed ? "#16a34a" : "#d97706", fontWeight: 600, fontSize: 13 }}>
                        {p.completed ? "Completed" : "In Progress"}
                      </span>
                    </td>
                    <td>{p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : "—"}</td>
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
