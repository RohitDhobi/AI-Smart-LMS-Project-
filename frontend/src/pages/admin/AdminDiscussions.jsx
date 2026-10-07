import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";
import { Loading, Empty, Page } from "../../ui";

export default function AdminDiscussions() {
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      setLoading(true);
      const d = await api.discussions().catch(() => []);
      setDiscussions(Array.isArray(d) ? d : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  const filtered = discussions.filter((d) =>
    !search || d.title?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <Loading />;

  return (
    <Page title="💬 Discussions" subtitle="View all discussions across courses.">
      <div className="admin-quick-links" style={{ marginBottom: 20 }}>
        <Link className="primary button-link" to="/admin">← Back to Dashboard</Link>
      </div>

      <input placeholder="🔍 Search discussions..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 300, padding: "8px 12px", fontSize: 13, marginBottom: 20 }} />

      <div className="card">
        <div className="dash-panel-head">
          <h3>Discussions ({filtered.length})</h3>
        </div>
        {filtered.length === 0 ? <Empty text="No discussions found." /> : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>ID</th><th>Title</th><th>Author</th><th>Likes</th><th>Solved</th><th>Date</th></tr>
              </thead>
              <tbody>
                {filtered.map((d) => (
                  <tr key={d.id}>
                    <td>{d.id}</td>
                    <td><strong>{d.title}</strong></td>
                    <td>{d.authorName || "—"}</td>
                    <td>{d.likeCount || 0}</td>
                    <td>
                      <span style={{ color: d.solved ? "#16a34a" : "#94a3b8", fontWeight: 600 }}>
                        {d.solved ? "✅ Solved" : "Open"}
                      </span>
                    </td>
                    <td>{d.createdAt ? new Date(d.createdAt).toLocaleDateString() : "—"}</td>
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
