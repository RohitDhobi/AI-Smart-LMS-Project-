import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../../services/api";

export default function InstructorCourseDetails() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [lessonForm, setLessonForm] = useState({ title: "", description: "", content: "", durationMinutes: 30 });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); }, [id]);

  async function loadData() {
    try {
      setLoading(true);
      const [c, l, s] = await Promise.all([
        api.instructorCourse(id).catch(() => api.course(id)),
        api.lessonsByCourse(id).catch(() => []),
        api.courseSubjects(id).catch(() => []),
      ]);
      setCourse(c);
      setLessons(Array.isArray(l) ? l : []);
      setSubjects(Array.isArray(s) ? s : []);
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

  // canManage comes from the backend. When false the instructor may still
  // read everything here, but no management controls are rendered.
  const canManage = course.canManage !== false;

  // ---------- semester system ----------
  // Degree programs (BCA, MCA, ...) organise their subjects across
  // semesters. When the course has semesters and its lessons belong to
  // subjects, the lesson list is grouped Semester 1..N instead of one
  // flat list. Lessons without a subject (or without a semester) fall
  // back to a "General" group, and the flat list stays as a fallback.
  const totalSemesters = Number(course.totalSemesters) || 0;

  const subjectById = new Map(
    subjects
      .filter(s => s && s.id != null)
      .map(s => [Number(s.id), s])
  );

  const sortedLessons = [...lessons].sort(
    (a, b) => (a.lessonOrder || 0) - (b.lessonOrder || 0)
  );

  const semesterGroups = Array.from(
    { length: totalSemesters },
    (_, i) => ({ semester: i + 1, lessons: [] })
  );
  const ungroupedLessons = [];

  sortedLessons.forEach(l => {
    const subject =
      l.subjectId != null ? subjectById.get(Number(l.subjectId)) : null;
    const semester = subject ? Number(subject.semester) : NaN;
    const group = semesterGroups.find(g => g.semester === semester);

    if (group) group.lessons.push({ lesson: l, subject });
    else ungroupedLessons.push({ lesson: l, subject });
  });

  const grouped =
    semesterGroups.length > 0 &&
    semesterGroups.some(g => g.lessons.length > 0);

  function lessonRow({ lesson: l, subject }, index) {
    return (
      <div key={l.id} className="inst-lesson-row card">
        <div className="inst-lesson-number">{index + 1}</div>
        <div className="inst-lesson-info">
          <strong>{l.title}</strong>
          <span>
            {subject?.subjectName ? `${subject.subjectName} · ` : ""}
            {l.description || "No description"} · {l.durationMinutes || 0} min
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="inst-page">
      <div className="inst-page-header">
        <div>
          <Link to="/instructor/courses" className="inst-link">← Back to Courses</Link>
          <h1>{course.title}</h1>
          <p>{course.description}</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {canManage ? (
            <>
              <Link to={`/courses/${id}/learn`} className="inst-btn secondary">Preview</Link>
              <button className="inst-btn primary" onClick={() => setShowLessonForm(true)}>+ Add Lesson</button>
            </>
          ) : (
            <span className="inst-badge" style={{ background: "#fef3c7", color: "#b45309", padding: "6px 12px", borderRadius: 999, fontSize: 12, fontWeight: 700 }}>
              🔒 View Only — not assigned to you
            </span>
          )}
        </div>
      </div>

      {/* Course Info */}
      <div className="inst-info-grid card">
        <div className="inst-info-item"><span className="inst-info-label">Category</span><strong>{course.category || "General"}</strong></div>
        <div className="inst-info-item"><span className="inst-info-label">Difficulty</span><strong>{course.difficulty || "Beginner"}</strong></div>
        <div className="inst-info-item"><span className="inst-info-label">Price</span><strong>{course.price ? `₹${course.price}` : "Free"}</strong></div>
        <div className="inst-info-item"><span className="inst-info-label">Duration</span><strong>{course.duration || "—"}</strong></div>
        <div className="inst-info-item"><span className="inst-info-label">Semesters</span><strong>{course.totalSemesters || "—"}</strong></div>
        <div className="inst-info-item"><span className="inst-info-label">Lessons</span><strong>{lessons.length}</strong></div>
        <div className="inst-info-item"><span className="inst-info-label">Status</span><strong className="inst-status-active">Active</strong></div>
      </div>

      {/* Lessons */}
      <div className="inst-section">
        <div className="inst-section-header">
          <h2>📖 Lessons ({lessons.length})</h2>
          {canManage && (
            <button className="inst-btn primary small" onClick={() => setShowLessonForm(true)}>+ Add Lesson</button>
          )}
        </div>

        {canManage && showLessonForm && (
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
        ) : grouped ? (
          <div className="inst-semester-groups">
            {semesterGroups.map(group => (
              <div key={group.semester} className="inst-semester-group">
                <h3 className="inst-semester-title">
                  📘 Semester {group.semester}
                  <span>
                    {group.lessons.length} lesson{group.lessons.length === 1 ? "" : "s"}
                  </span>
                </h3>
                {group.lessons.length === 0 ? (
                  <div className="inst-empty">No lessons in this semester yet.</div>
                ) : (
                  <div className="inst-lesson-list">
                    {group.lessons.map(lessonRow)}
                  </div>
                )}
              </div>
            ))}

            {ungroupedLessons.length > 0 && (
              <div className="inst-semester-group">
                <h3 className="inst-semester-title">
                  📗 General
                  <span>
                    {ungroupedLessons.length} lesson{ungroupedLessons.length === 1 ? "" : "s"}
                  </span>
                </h3>
                <div className="inst-lesson-list">
                  {ungroupedLessons.map(lessonRow)}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="inst-lesson-list">
            {sortedLessons.map((l, i) =>
              lessonRow({ lesson: l, subject: null }, i)
            )}
          </div>
        )}
      </div>
    </div>
  );
}
