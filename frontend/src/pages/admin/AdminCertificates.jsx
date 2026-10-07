import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";
import { Loading, Empty, Page } from "../../ui";

export default function AdminCertificates() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      setLoading(true);
      const c = await api.certificates().catch(() => []);
      setCertificates(Array.isArray(c) ? c : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  const filtered = certificates.filter((c) =>
    !search || c.courseTitle?.toLowerCase().includes(search.toLowerCase()) || c.studentName?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <Loading />;

  return (
    <Page title="🏆 Certificates" subtitle="View all issued certificates.">
      <div className="admin-quick-links" style={{ marginBottom: 20 }}>
        <Link className="primary button-link" to="/admin">← Back to Dashboard</Link>
      </div>

      <div className="analytics-stats" style={{ marginBottom: 20 }}>
        <div className="card analytics-stat tint-blue">
          <span className="analytics-stat-icon">🏆</span>
          <div className="analytics-stat-text">
            <strong>{certificates.length}</strong>
            <span>Total Certificates</span>
          </div>
        </div>
      </div>

      <input placeholder="🔍 Search certificates..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 300, padding: "8px 12px", fontSize: 13, marginBottom: 20 }} />

      <div className="card">
        <div className="dash-panel-head">
          <h3>Certificates ({filtered.length})</h3>
        </div>
        {filtered.length === 0 ? <Empty text="No certificates found." /> : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>ID</th><th>Course</th><th>Issued Date</th></tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id}>
                    <td>{c.id}</td>
                    <td><strong>{c.courseTitle || `Course #${c.courseId}`}</strong></td>
                    <td>{c.issuedAt ? new Date(c.issuedAt).toLocaleDateString() : "—"}</td>
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
