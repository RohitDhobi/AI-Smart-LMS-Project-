import React, { useEffect, useState } from "react";
import { api } from "../../api";
import InstructorPage from "./InstructorPage";

export default function InstructorExams() {
  const [exams, setExams] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", duration: 60, courseId: "", url: "", type: "in-person" });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [e, c] = await Promise.all([
        api.exams().catch(() => []),
        api.instructorCourses().catch(() => api.courses().catch(() => [])),
      ]);
      setExams(Array.isArray(e) ? e : []);
      setCourses(Array.isArray(c) ? c : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function handleCreate(e) {
    e.preventDefault();
    try {
      setSaving(true);
      await api.instructorCreateExam({
        title: form.title,
        description: form.description,
        duration: Number(form.duration),
        url: form.url || undefined,
        type: form.type,
      });
      setShowForm(false);
      setForm({ title: "", description: "", duration: 60, courseId: "", url: "", type: "in-person" });
      loadData();
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  }

  function handleCancel() {
    setShowForm(false);
    setForm({ title: "", description: "", duration: 60, courseId: "", url: "", type: "in-person" });
  }

  return (
    <InstructorPage icon="🎓" title="Exams" subtitle="Create and manage course exams.">
      <div style={{ marginBottom: 16 }}>
        <button className="inst-btn primary" onClick={() => setShowForm(true)}>+ Create Exam</button>
      </div>

      {showForm && (
        <form className="inst-form card" onSubmit={handleCreate} style={{ marginBottom: 20 }}>
          <h3>Create Exam</h3>

          <div className="inst-form-group">
            <label>Title *</label>
            <input required placeholder="e.g. Mid-term Exam" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          </div>

          <div className="inst-form-group">
            <label>Description</label>
            <textarea rows={3} placeholder="Exam description..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>

          <div className="inst-form-row">
            <div className="inst-form-group">
              <label>Duration (minutes)</label>
              <input type="number" min={1} value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} />
            </div>
            <div className="inst-form-group">
              <label>Exam Type</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                <option value="in-person">In-Person</option>
                <option value="online">Online</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>
          </div>

          {/* URL field for online exams */}
          {form.type === "online" && (
            <div className="inst-form-group">
              <label>🔗 Exam URL / Link</label>
              <input
                type="url"
                placeholder="https://example.com/exam-platform or Google Forms link"
                value={form.url}
                onChange={e => setForm({ ...form, url: e.target.value })}
              />
              <small style={{ fontSize: 12, color: "#94a3b8", marginTop: 4, display: "block" }}>
                Add a link to your online exam platform, Google Forms, or any external exam URL.
              </small>
            </div>
          )}

          <div className="inst-form-actions">
            <button type="button" className="inst-btn secondary" onClick={handleCancel}>Cancel</button>
            <button type="submit" className="inst-btn primary" disabled={saving}>{saving ? "Creating..." : "Create Exam"}</button>
          </div>
        </form>
      )}

      {exams.length === 0 ? (
        <div className="inst-empty"><div className="inst-empty-icon">🎓</div><h3>No exams yet</h3><p>Create your first exam to assess student learning.</p></div>
      ) : (
        <div className="inst-grid">{exams.map(e => (
          <div key={e.id} className="card inst-list-item">
            <h3>{e.title}</h3>
            <p>{e.description || "No description"}</p>
            {e.url && (
              <div style={{ marginTop: 8 }}>
                <a href={e.url} target="_blank" rel="noopener noreferrer" className="inst-resource-link" style={{ fontSize: 13, display: "inline-flex", alignItems: "center", gap: 4 }}>
                  🔗 Open Exam Link
                </a>
              </div>
            )}
            <div className="inst-list-meta">
              <span>⏱ {e.duration || 60} min</span>
              <span>📋 {e.type === "online" ? "Online" : e.type === "hybrid" ? "Hybrid" : "In-Person"}</span>
            </div>
          </div>
        ))}</div>
      )}
    </InstructorPage>
  );
}
