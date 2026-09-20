import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../../api";

export default function InstructorCourseDetails() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [lessonForm, setLessonForm] = useState({ title: "", description: "", content: "", durationMinutes: 30 });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); }, [id]);

  async function loadData() {
    try {
      setLoading(true);
      const [c, l] = await Promise.all([
        api.instructorCourse(id).catch(() => api.course(id)),
        api.lessonsByCourse(id).catch(() => []),
      ]);
      setCourse(c);
      setLessons(Array.isArray(l) ? l : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function addLesson(e) {
    e.preventDefault();
    try {
      setSaving(true);
      await api.adminAddLesson(id, {
        ...lessonForm,
        lessonOrder: lessons.length + 1,
        durationMinutes: Number(lessonForm.durationMinutes),
      });
      setShowLessonForm(false);
      setLessonForm({ title: "", description: "", content: "", durationMinutes: 30 });
      loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="inst-loading">Loading...</div>;
  if (!course) return <div className="inst-empty">Course not found.</div>;

  return (
    <div className="inst-page">
      <div className="inst-page-header">
        <div>
          <Link to="/instructor/courses" className="inst-link">← Back to Courses</Link>
          <h1>{course.title}</h1>
          <p>{course.description}</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Link to={`/courses/${id}/learn`} className="inst-btn secondary">Preview</Link>
          <button className="inst-btn primary" onClick={() => setShowLessonForm(true)}>+ Add Lesson</button>
        </div>
      </div>

      {/* Course Info */}
      <div className="inst-info-grid card">
        <div className="inst-info-item"><span className="inst-info-label">Category</span><strong>{course.category || "General"}</strong></div>
        <div className="inst-info-item"><span className="inst-info-label">Difficulty</span><strong>{course.difficulty || "Beginner"}</strong></div>
        <div className="inst-info-item"><span className="inst-info-label">Price</span><strong>{course.price ? `₹${course.price}` : "Free"}</strong></div>
        <div className="inst-info-item"><span className="inst-info-label">Duration</span><strong>{course.duration || "—"}</strong></div>
        <div className="inst-info-item"><span className="inst-info-label">Lessons</span><strong>{lessons.length}</strong></div>
        <div className="inst-info-item"><span className="inst-info-label">Status</span><strong className="inst-status-active">Active</strong></div>
      </div>

      {/* Lessons */}
      <div className="inst-section">
        <div className="inst-section-header">
          <h2>📖 Lessons ({lessons.length})</h2>
          <button className="inst-btn primary small" onClick={() => setShowLessonForm(true)}>+ Add Lesson</button>
        </div>

        {showLessonForm && (
          <form className="inst-form card" onSubmit={addLesson} style={{ marginBottom: 20 }}>
            <h3>Add New Lesson</h3>
            <div className="inst-form-group">
              <label>Title *</label>
              <input required placeholder="e.g. Introduction to Java" value={lessonForm.title} onChange={e => setLessonForm({ ...lessonForm, title: e.target.value })} />
            </div>
            <div className="inst-form-group">
              <label>Description</label>
              <input placeholder="Brief description" value={lessonForm.description} onChange={e => setLessonForm({ ...lessonForm, description: e.target.value })} />
            </div>
            <div className="inst-form-group">
              <label>Content (Markdown)</label>
              <textarea rows={6} placeholder="Lesson content in markdown..." value={lessonForm.content} onChange={e => setLessonForm({ ...lessonForm, content: e.target.value })} />
            </div>
            <div className="inst-form-group">
              <label>Duration (minutes)</label>
              <input type="number" min={1} value={lessonForm.durationMinutes} onChange={e => setLessonForm({ ...lessonForm, durationMinutes: e.target.value })} />
            </div>
            <div className="inst-form-actions">
              <button type="button" className="inst-btn secondary" onClick={() => setShowLessonForm(false)}>Cancel</button>
              <button type="submit" className="inst-btn primary" disabled={saving}>{saving ? "Adding..." : "Add Lesson"}</button>
            </div>
          </form>
        )}

        {lessons.length === 0 ? (
          <div className="inst-empty">No lessons yet. Add your first lesson!</div>
        ) : (
          <div className="inst-lesson-list">
            {lessons.sort((a, b) => (a.lessonOrder || 0) - (b.lessonOrder || 0)).map((l, i) => (
              <div key={l.id} className="inst-lesson-row card">
                <div className="inst-lesson-number">{i + 1}</div>
                <div className="inst-lesson-info">
                  <strong>{l.title}</strong>
                  <span>{l.description || "No description"} · {l.durationMinutes || 0} min</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
