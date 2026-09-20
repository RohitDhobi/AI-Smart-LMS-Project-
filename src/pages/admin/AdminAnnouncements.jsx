import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";
import { Loading, Empty, Page } from "../../ui";

export default function AdminAnnouncements() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      setLoading(true);
      const n = await api.notifications().catch(() => []);
      setNotifications(Array.isArray(n) ? n : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  const filtered = notifications.filter((n) =>
    !search || n.title?.toLowerCase().includes(search.toLowerCase()) || n.message?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <Loading />;

  return (
    <Page title="📢 Announcements" subtitle="Manage platform announcements and notifications.">
      <div className="admin-quick-links" style={{ marginBottom: 20 }}>
        <Link className="primary button-link" to="/admin">← Back to Dashboard</Link>
      </div>

      <div className="analytics-stats" style={{ marginBottom: 20 }}>
        <div className="card analytics-stat tint-blue">
          <span className="analytics-stat-icon">📢</span>
          <div className="analytics-stat-text">
            <strong>{notifications.length}</strong>
            <span>Total Notifications</span>
          </div>
        </div>
        <div className="card analytics-stat tint-orange">
          <span className="analytics-stat-icon">📬</span>
          <div className="analytics-stat-text">
            <strong>{notifications.filter((n) => !n.read).length}</strong>
            <span>Unread</span>
          </div>
        </div>
      </div>

      <input placeholder="🔍 Search announcements..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 300, padding: "8px 12px", fontSize: 13, marginBottom: 20 }} />

      <div className="card">
        <div className="dash-panel-head">
          <h3>Announcements ({filtered.length})</h3>
        </div>
        {filtered.length === 0 ? <Empty text="No announcements found." /> : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>Title</th><th>Message</th><th>Status</th><th>Date</th></tr>
              </thead>
              <tbody>
                {filtered.map((n) => (
                  <tr key={n.id} style={{ opacity: n.read ? 0.7 : 1 }}>
                    <td><strong>{n.title || "Notification"}</strong></td>
                    <td style={{ maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis" }}>{n.message || "—"}</td>
                    <td>
                      <span style={{ color: n.read ? "#94a3b8" : "#2563eb", fontWeight: 600, fontSize: 13 }}>
                        {n.read ? "Read" : "Unread"}
                      </span>
                    </td>
                    <td>{n.createdAt ? new Date(n.createdAt).toLocaleDateString() : "—"}</td>
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
