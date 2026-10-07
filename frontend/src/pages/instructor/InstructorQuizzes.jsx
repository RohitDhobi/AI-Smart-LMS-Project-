import React, { useEffect, useState } from "react";
import { api } from "../../api";

export default function InstructorQuizzes() {
  const [quizzes, setQuizzes] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", timeLimit: 30, courseId: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [q, c] = await Promise.all([
        api.quizzes().catch(() => []),
        api.instructorCourses().catch(() => api.courses().catch(() => [])),
      ]);
      setQuizzes(Array.isArray(q) ? q : []);
      setCourses(Array.isArray(c) ? c : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.courseId) return alert("Please select a course");
    try {
      setSaving(true);
      await api.instructorCreateQuiz(form.courseId, {
        title: form.title,
        description: form.description,
        timeLimit: Number(form.timeLimit),
      });
      setShowForm(false);
      setForm({ title: "", description: "", timeLimit: 30, courseId: "" });
      loadData();
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  }

  return (
    <div className="inst-page">
      <div className="inst-page-header">
        <div><h1>❓ Quizzes</h1><p>Create and manage quizzes for your courses.</p></div>
        <button className="inst-btn primary" onClick={() => setShowForm(true)}>+ Create Quiz</button>
      </div>

      {showForm && (
        <form className="inst-form card" onSubmit={handleCreate} style={{ marginBottom: 20 }}>
          <h3>Create Quiz</h3>
          <div className="inst-form-group">
            <label>Course *</label>
            <select required value={form.courseId} onChange={e => setForm({ ...form, courseId: e.target.value })}>
              <option value="">Select a course</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          <div className="inst-form-group">
            <label>Title *</label>
            <input required placeholder="e.g. Chapter 1 Quiz" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="inst-form-group">
            <label>Description</label>
            <textarea rows={3} placeholder="Quiz description..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="inst-form-group">
            <label>Time Limit (minutes)</label>
            <input type="number" min={1} value={form.timeLimit} onChange={e => setForm({ ...form, timeLimit: e.target.value })} />
          </div>
          <div className="inst-form-actions">
            <button type="button" className="inst-btn secondary" onClick={() => setShowForm(false)}>Cancel</button>
            <button type="submit" className="inst-btn primary" disabled={saving}>{saving ? "Creating..." : "Create Quiz"}</button>
          </div>
        </form>
      )}

      {loading ? <div className="inst-loading">Loading...</div> : quizzes.length === 0 ? (
        <div className="inst-empty"><div className="inst-empty-icon">❓</div><h3>No quizzes yet</h3><p>Create your first quiz to test student knowledge.</p></div>
      ) : (
        <div className="inst-grid">
          {quizzes.map(q => (
            <div key={q.id} className="card inst-list-item">
              <h3>{q.title}</h3>
              <p>{q.description || "No description"}</p>
              <div className="inst-list-meta">
                <span>⏱ {q.timeLimit || 30} min</span>
                {q.course && <span>📚 {q.course.title || "Course"}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
