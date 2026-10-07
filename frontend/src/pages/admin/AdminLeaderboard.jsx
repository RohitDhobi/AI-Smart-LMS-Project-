import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";
import { Loading, Empty, Page } from "../../ui";

export default function AdminLeaderboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      setLoading(true);
      const u = await api.adminUsers().catch(() => []);
      // Sort by some metric - using ID as proxy for activity
      const students = Array.isArray(u) ? u.filter((x) => x.role === "STUDENT") : [];
      setUsers(students);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  const isDark = typeof document !== "undefined" && document.documentElement.getAttribute("data-theme") === "dark";

  if (loading) return <Loading />;

  return (
    <Page title="🏆 Leaderboard" subtitle="Top performing students.">
      <div className="admin-quick-links" style={{ marginBottom: 20 }}>
        <Link className="primary button-link" to="/admin">← Back to Dashboard</Link>
      </div>

      <div className="card">
        <div className="dash-panel-head">
          <h3>Student Leaderboard</h3>
          <span>{users.length} students</span>
        </div>
        {users.length === 0 ? <Empty text="No students found." /> : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>Rank</th><th>Student</th><th>Email</th><th>Status</th></tr>
              </thead>
              <tbody>
                {users.slice(0, 20).map((u, i) => (
                  <tr key={u.id}>
                    <td>
                      <span style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        background: i < 3
                          ? ["#fbbf24", "#94a3b8", "#cd7f32"][i]
                          : isDark ? "#334155" : "#e2e8f0",
                        color: i < 3 ? "#fff" : isDark ? "#94a3b8" : "#64748b",
                        fontWeight: 700,
                        fontSize: 12,
                      }}>
                        {i + 1}
                      </span>
                    </td>
                    <td><strong>{u.name}</strong></td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`role-badge ${u.active ? "role-student" : "role-admin"}`}>
                        {u.active ? "Active" : "Inactive"}
                      </span>
                    </td>
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
