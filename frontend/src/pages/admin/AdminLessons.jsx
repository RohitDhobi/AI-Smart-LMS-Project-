import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";
import { Loading, Empty, Page } from "../../ui";

export default function AdminLessons() {
  const [lessons, setLessons] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCourse, setFilterCourse] = useState("");

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [l, c] = await Promise.all([
        api.lessons().catch(() => []),
        api.adminCourses().catch(() => api.courses()),
      ]);
      setLessons(Array.isArray(l) ? l : []);
      setCourses(Array.isArray(c) ? c : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this lesson?")) return;
    try {
      await api.adminDeleteLesson(id);
      setLessons((prev) => prev.filter((l) => l.id !== id));
    } catch (e) { alert(e.message); }
  }

  const filtered = lessons.filter((l) => {
    const matchSearch = !search || l.title?.toLowerCase().includes(search.toLowerCase());
    const matchCourse = !filterCourse || String(l.courseId) === filterCourse;
    return matchSearch && matchCourse;
  });

  if (loading) return <Loading />;

  return (
    <Page title="📝 Lessons" subtitle="Manage all lessons across courses.">
      <div className="admin-quick-links" style={{ marginBottom: 20 }}>
        <Link className="primary button-link" to="/admin">← Back to Dashboard</Link>
        <Link className="secondary button-link" to="/admin/courses">📚 Manage Courses</Link>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <input placeholder="🔍 Search lessons..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 300, padding: "8px 12px", fontSize: 13 }} />
        <select value={filterCourse} onChange={(e) => setFilterCourse(e.target.value)} style={{ maxWidth: 250, padding: "8px 12px", fontSize: 13 }}>
          <option value="">All Courses</option>
          {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
      </div>

      <div className="card">
        <div className="dash-panel-head">
          <h3>Lessons ({filtered.length})</h3>
        </div>
        {filtered.length === 0 ? <Empty text="No lessons found." /> : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>ID</th><th>Title</th><th>Duration</th><th>Order</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map((l) => (
                  <tr key={l.id}>
                    <td>{l.id}</td>
                    <td><strong>{l.title}</strong></td>
                    <td>{l.durationMinutes || 0} min</td>
                    <td>{l.lessonOrder || "—"}</td>
                    <td>
                      <button className="danger small" onClick={() => handleDelete(l.id)}>Delete</button>
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
