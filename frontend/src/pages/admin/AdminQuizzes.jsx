import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";
import { Loading, Empty, Page } from "../../ui";

export default function AdminQuizzes() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      setLoading(true);
      const q = await api.quizzes().catch(() => []);
      setQuizzes(Array.isArray(q) ? q : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  const filtered = quizzes.filter((q) => !search || q.title?.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <Loading />;

  return (
    <Page title="❓ Quizzes" subtitle="View all quizzes across courses.">
      <div className="admin-quick-links" style={{ marginBottom: 20 }}>
        <Link className="primary button-link" to="/admin">← Back to Dashboard</Link>
      </div>

      <input placeholder="🔍 Search quizzes..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 300, padding: "8px 12px", fontSize: 13, marginBottom: 20 }} />

      <div className="card">
        <div className="dash-panel-head">
          <h3>Quizzes ({filtered.length})</h3>
        </div>
        {filtered.length === 0 ? <Empty text="No quizzes found." /> : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>ID</th><th>Title</th><th>Questions</th><th>Time Limit</th><th>Passing Score</th></tr>
              </thead>
              <tbody>
                {filtered.map((q) => (
                  <tr key={q.id}>
                    <td>{q.id}</td>
                    <td><strong>{q.title}</strong></td>
                    <td>{q.questions?.length || q.questionCount || 0}</td>
                    <td>{q.timeLimit ? `${q.timeLimit} min` : "—"}</td>
                    <td>{q.passingScore ? `${q.passingScore}%` : "—"}</td>
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
