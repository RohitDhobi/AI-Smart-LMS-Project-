import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";
import { Loading, Empty, Page } from "../../ui";

export default function AdminAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      setLoading(true);
      const a = await api.assignments().catch(() => []);
      setAssignments(Array.isArray(a) ? a : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  const filtered = assignments.filter((a) => !search || a.title?.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <Loading />;

  return (
    <Page title="📋 Assignments" subtitle="View all assignments across courses.">
      <div className="admin-quick-links" style={{ marginBottom: 20 }}>
        <Link className="primary button-link" to="/admin">← Back to Dashboard</Link>
      </div>

      <input placeholder="🔍 Search assignments..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 300, padding: "8px 12px", fontSize: 13, marginBottom: 20 }} />

      <div className="card">
        <div className="dash-panel-head">
          <h3>Assignments ({filtered.length})</h3>
        </div>
        {filtered.length === 0 ? <Empty text="No assignments found." /> : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>ID</th><th>Title</th><th>Description</th><th>Max Marks</th><th>Due Date</th></tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.id}>
                    <td>{a.id}</td>
                    <td><strong>{a.title}</strong></td>
                    <td style={{ maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis" }}>{a.description || "—"}</td>
                    <td>{a.maxMarks || "—"}</td>
                    <td>{a.dueDate ? new Date(a.dueDate).toLocaleDateString() : "—"}</td>
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
