import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";
import { Loading, Empty, Page } from "../../ui";

export default function AdminResources() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      setLoading(true);
      const r = await api.resources().catch(() => []);
      setResources(Array.isArray(r) ? r : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this resource?")) return;
    try {
      await api.deleteResource(id);
      setResources((prev) => prev.filter((r) => r.id !== id));
    } catch (e) { alert(e.message); }
  }

  const types = ["DOCUMENT", "VIDEO", "LINK", "IMAGE", "OTHER"];
  const filtered = resources.filter((r) => {
    const matchSearch = !search || r.title?.toLowerCase().includes(search.toLowerCase());
    const matchType = !filterType || r.type === filterType;
    return matchSearch && matchType;
  });

  function getTypeIcon(type) {
    switch (type) {
      case "DOCUMENT": return "📄";
      case "VIDEO": return "🎥";
      case "LINK": return "🔗";
      case "IMAGE": return "🖼️";
      default: return "📁";
    }
  }

  function formatSize(bytes) {
    if (!bytes) return "";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  if (loading) return <Loading />;

  return (
    <Page title="📁 Resources" subtitle="View all resources uploaded across courses.">
      <div className="admin-quick-links" style={{ marginBottom: 20 }}>
        <Link className="primary button-link" to="/admin">← Back to Dashboard</Link>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <input placeholder="🔍 Search resources..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 300, padding: "8px 12px", fontSize: 13 }} />
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ maxWidth: 180, padding: "8px 12px", fontSize: 13 }}>
          <option value="">All Types</option>
          {types.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="card">
        <div className="dash-panel-head">
          <h3>Resources ({filtered.length})</h3>
        </div>
        {filtered.length === 0 ? <Empty text="No resources found." /> : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr><th></th><th>Title</th><th>Type</th><th>Category</th><th>Size</th><th>Downloads</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id}>
                    <td>{getTypeIcon(r.type)}</td>
                    <td><strong>{r.title}</strong></td>
                    <td>{r.type}</td>
                    <td>{r.category || "—"}</td>
                    <td>{formatSize(r.fileSize)}</td>
                    <td>{r.downloadCount || 0}</td>
                    <td>
                      <button className="danger small" onClick={() => handleDelete(r.id)}>Delete</button>
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
