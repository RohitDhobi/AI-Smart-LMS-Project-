import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";
import { Loading, Empty, Page } from "../../ui";

export default function AdminExams() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      setLoading(true);
      const e = await api.exams().catch(() => []);
      setExams(Array.isArray(e) ? e : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  const filtered = exams.filter((e) => !search || e.title?.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <Loading />;

  return (
    <Page title="🎓 Exams" subtitle="View all exams across courses.">
      <div className="admin-quick-links" style={{ marginBottom: 20 }}>
        <Link className="primary button-link" to="/admin">← Back to Dashboard</Link>
      </div>

      <input placeholder="🔍 Search exams..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 300, padding: "8px 12px", fontSize: 13, marginBottom: 20 }} />

      <div className="card">
        <div className="dash-panel-head">
          <h3>Exams ({filtered.length})</h3>
        </div>
        {filtered.length === 0 ? <Empty text="No exams found." /> : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>ID</th><th>Title</th><th>Duration</th><th>Total Marks</th><th>Passing Marks</th></tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <tr key={e.id}>
                    <td>{e.id}</td>
                    <td><strong>{e.title}</strong></td>
                    <td>{e.duration ? `${e.duration} min` : "—"}</td>
                    <td>{e.totalMarks || "—"}</td>
                    <td>{e.passingMarks || "—"}</td>
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
