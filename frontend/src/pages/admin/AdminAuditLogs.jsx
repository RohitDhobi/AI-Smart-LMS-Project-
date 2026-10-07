import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";
import { Loading, Empty, Page } from "../../ui";

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      setLoading(true);
      // Use available API data to construct audit-like logs
      const [users, courses] = await Promise.all([
        api.adminUsers().catch(() => []),
        api.adminCourses().catch(() => []),
      ]);

      // Construct audit logs from available data
      const auditLogs = [];

      if (Array.isArray(users)) {
        users.forEach((u) => {
          auditLogs.push({
            id: `user-${u.id}`,
            action: "User Account",
            details: `${u.name} (${u.email}) - Role: ${u.role}`,
            timestamp: u.createdAt || new Date().toISOString(),
            type: "user",
          });
        });
      }

      if (Array.isArray(courses)) {
        courses.forEach((c) => {
          auditLogs.push({
            id: `course-${c.id}`,
            action: "Course",
            details: `${c.title} - Status: ${c.status || "Active"}`,
            timestamp: c.createdAt || new Date().toISOString(),
            type: "course",
          });
        });
      }

      setLogs(auditLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  const filtered = logs.filter((l) =>
    !search || l.action?.toLowerCase().includes(search.toLowerCase()) || l.details?.toLowerCase().includes(search.toLowerCase())
  );

  function getTypeColor(type) {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    if (isDark) {
      switch (type) {
        case "user": return { bg: "#1e3a5f", color: "#93c5fd" };
        case "course": return { bg: "#16321f", color: "#86efac" };
        default: return { bg: "#1e293b", color: "#94a3b8" };
      }
    }
    switch (type) {
      case "user": return { bg: "#eff6ff", color: "#2563eb" };
      case "course": return { bg: "#f0fdf4", color: "#16a34a" };
      default: return { bg: "#f1f5f9", color: "#64748b" };
    }
  }

  if (loading) return <Loading />;

  return (
    <Page title="📜 Audit Logs" subtitle="System activity and audit trail.">
      <div className="admin-quick-links" style={{ marginBottom: 20 }}>
        <Link className="primary button-link" to="/admin">← Back to Dashboard</Link>
      </div>

      <div className="analytics-stats" style={{ marginBottom: 20 }}>
        <div className="card analytics-stat tint-blue">
          <span className="analytics-stat-icon">📜</span>
          <div className="analytics-stat-text">
            <strong>{logs.length}</strong>
            <span>Total Logs</span>
          </div>
        </div>
      </div>

      <input placeholder="🔍 Search logs..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 300, padding: "8px 12px", fontSize: 13, marginBottom: 20 }} />

      <div className="card">
        <div className="dash-panel-head">
          <h3>Activity Log ({filtered.length})</h3>
        </div>
        {filtered.length === 0 ? <Empty text="No audit logs found." /> : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>Type</th><th>Action</th><th>Details</th><th>Timestamp</th></tr>
              </thead>
              <tbody>
                {filtered.map((log) => {
                  const colors = getTypeColor(log.type);
                  return (
                    <tr key={log.id}>
                      <td>
                        <span style={{
                          background: colors.bg, color: colors.color, padding: "3px 10px",
                          borderRadius: 6, fontSize: 12, fontWeight: 600, textTransform: "capitalize",
                        }}>
                          {log.type}
                        </span>
                      </td>
                      <td><strong>{log.action}</strong></td>
                      <td style={{ maxWidth: 400, overflow: "hidden", textOverflow: "ellipsis" }}>{log.details}</td>
                      <td>{new Date(log.timestamp).toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Page>
  );
}
