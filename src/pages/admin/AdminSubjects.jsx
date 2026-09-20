import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";
import { Loading, Empty, Page } from "../../ui";

export default function AdminSubjects() {
  const [subjects, setSubjects] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ subjectName: "", semester: 1, courseId: "" });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      setLoading(true);
      const c = await api.adminCourses().catch(() => api.courses());
      setCourses(Array.isArray(c) ? c : []);
      // Load all lessons as proxy for subjects
      const allLessons = await api.lessons().catch(() => []);
      setSubjects(Array.isArray(allLessons) ? allLessons : []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.courseId) return alert("Select a course");
    try {
      setSaving(true);
      await api.adminCreateSubject({ ...form, courseId: Number(form.courseId) });
      setShowForm(false);
      setForm({ subjectName: "", semester: 1, courseId: "" });
      loadData();
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this subject?")) return;
    try {
      await api.adminDeleteSubject(id);
      loadData();
    } catch (e) { alert(e.message); }
  }

  const filtered = courses.filter((c) => !search || c.title?.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <Loading />;

  return (
    <Page title="📖 Subjects" subtitle="Manage subjects across all courses.">
      {error && <div className="error">{error}</div>}
      <div className="admin-quick-links" style={{ marginBottom: 20 }}>
        <Link className="primary button-link" to="/admin">← Back to Dashboard</Link>
        <button className="secondary button-link" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Close" : "+ Add Subject"}
        </button>
      </div>

      {showForm && (
        <form className="card" onSubmit={handleCreate} style={{ marginBottom: 20 }}>
          <h3>Add Subject</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div className="form-field">
              <label>Subject Name *</label>
              <input required value={form.subjectName} onChange={(e) => setForm({ ...form, subjectName: e.target.value })} placeholder="e.g. Data Structures" />
            </div>
            <div className="form-field">
              <label>Semester</label>
              <input type="number" min={1} max={12} value={form.semester} onChange={(e) => setForm({ ...form, semester: Number(e.target.value) })} />
            </div>
            <div className="form-field">
              <label>Course *</label>
              <select required value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })}>
                <option value="">Select course</option>
                {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
          </div>
          <button className="primary" type="submit" disabled={saving} style={{ marginTop: 12 }}>
            {saving ? "Creating..." : "Create Subject"}
          </button>
        </form>
      )}

      <div className="card">
        <div className="dash-panel-head">
          <h3>Courses ({filtered.length})</h3>
          <input placeholder="🔍 Search..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 250, padding: "8px 12px", fontSize: 13 }} />
        </div>
        {filtered.length === 0 ? <Empty text="No courses found." /> : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>ID</th><th>Course</th><th>Category</th><th>Difficulty</th><th>Lessons</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id}>
                    <td>{c.id}</td>
                    <td><strong>{c.title}</strong></td>
                    <td>{c.category || "—"}</td>
                    <td>{c.difficulty || "—"}</td>
                    <td>{c.lessons?.length || 0}</td>
                    <td>
                      <Link className="secondary small" to={`/admin/courses`} style={{ marginRight: 6, padding: "4px 10px", fontSize: 12, borderRadius: 6, textDecoration: "none" }}>View</Link>
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
