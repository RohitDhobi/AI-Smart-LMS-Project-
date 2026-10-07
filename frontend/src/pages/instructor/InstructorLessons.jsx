import React, { useEffect, useState } from "react";
import { api } from "../../api";

export default function InstructorLessons() {
  const [lessons, setLessons] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", content: "", durationMinutes: 30, lessonOrder: 1 });
  const [saving, setSaving] = useState(false);

  // Semester system
  const [activeSemester, setActiveSemester] = useState(null);
  const [totalSemesters, setTotalSemesters] = useState(0);
  const [subjects, setSubjects] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedSubject, setSelectedSubject] = useState(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      setLoading(true);
      const c = await api.instructorCourses().catch(() => api.adminCourses().catch(() => api.courses()));
      setCourses(Array.isArray(c) ? c : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function loadLessons(courseId) {
    if (!courseId) { setLessons([]); return; }
    try {
      const l = await api.lessonsByCourse(courseId);
      setLessons(Array.isArray(l) ? l : []);
    } catch (e) { setLessons([]); }
  }

  async function loadSemestersAndSubjects(courseId) {
    if (!courseId) {
      setTotalSemesters(0);
      setSubjects([]);
      setActiveSemester(null);
      setSelectedSubjectId("");
      setSelectedSubject(null);
      return;
    }
    try {
      // Get course details for total semesters
      const courseCourses = courses.find(c => String(c.id) === String(courseId));
      const ts = courseCourses?.totalSemesters || 6;
      setTotalSemesters(ts);
      setActiveSemester(1);
      await loadSubjectsForSemester(courseId, 1);
    } catch (e) {
      console.warn("Unable to load semesters:", e);
    }
  }

  async function loadSubjectsForSemester(courseId, semester) {
    setSubjectsLoading(true);
    try {
      const subData = await api.courseSubjectsBySemester(courseId, semester);
      setSubjects(Array.isArray(subData) ? subData : []);
    } catch (e) {
      setSubjects([]);
    } finally {
      setSubjectsLoading(false);
    }
  }

  async function switchSemester(sem) {
    setActiveSemester(sem);
    setSelectedSubjectId("");
    setSelectedSubject(null);
    await loadSubjectsForSemester(selectedCourse, sem);
  }

  function selectSubject(subject) {
    setSelectedSubjectId(subject.id);
    setSelectedSubject(subject);
  }

  async function handleCourseChange(courseId) {
    setSelectedCourse(courseId);
    loadLessons(courseId);
    await loadSemestersAndSubjects(courseId);
  }

  async function addLesson(e) {
    e.preventDefault();
    if (!selectedSubjectId) return alert("Select a subject first");
    try {
      setSaving(true);
      const subjectLessons = lessons.filter(l => Number(l.subject?.id) === Number(selectedSubjectId));
      await api.instructorAddLesson(selectedSubjectId, {
        ...form,
        lessonOrder: subjectLessons.length + 1,
        durationMinutes: Number(form.durationMinutes)
      });
      setShowForm(false);
      setForm({ title: "", description: "", content: "", durationMinutes: 30, lessonOrder: 1 });
      loadLessons(selectedCourse);
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  }

  // Filter lessons by selected subject
  const filteredLessons = selectedSubject
    ? lessons.filter(l => Number(l.subject?.id) === Number(selectedSubjectId))
    : lessons;

  // Group lessons by subject for display when no subject is selected
  const groupedBySubject = {};
  lessons.forEach(l => {
    const subName = l.subject?.subjectName || l.subjectName || "Unassigned";
    const subId = l.subject?.id || "unassigned";
    if (!groupedBySubject[subId]) groupedBySubject[subId] = { name: subName, lessons: [] };
    groupedBySubject[subId].lessons.push(l);
  });

  return (
    <div className="inst-page">
      <div className="inst-page-header">
        <div>
          <h1>📖 Manage Lessons</h1>
          <p>Add and organize lessons for your courses by semester and subject.</p>
        </div>
        <button className="inst-btn primary" onClick={() => setShowForm(true)} disabled={!selectedSubjectId}>+ Add Lesson</button>
      </div>

      <div className="inst-filter-bar">
        <label>Select Course:</label>
        <select value={selectedCourse} onChange={e => handleCourseChange(e.target.value)}>
          <option value="">Choose a course</option>
          {courses.map(c => <option key={c.id} value={c.id}>{c.title || c.courseName}</option>)}
        </select>
      </div>

      {/* Semester Tabs */}
      {totalSemesters > 0 && (
        <div className="semester-filter-row" style={{ marginBottom: 16 }}>
          <span className="semester-filter-label">Semesters:</span>
          <div className="semester-filter-tabs">
            {Array.from({ length: totalSemesters }, (_, i) => i + 1).map(sem => (
              <button
                key={sem}
                className={`semester-tab ${Number(activeSemester) === Number(sem) ? "active" : ""}`}
                onClick={() => switchSemester(sem)}
              >
                Sem {sem}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Subjects for Active Semester */}
      {activeSemester && (
        <div className="inst-section" style={{ marginBottom: 16 }}>
          <h3 style={{ margin: '0 0 10px' }}>📘 Semester {activeSemester} Subjects</h3>
          {subjectsLoading ? (
            <p>Loading subjects...</p>
          ) : subjects.length === 0 ? (
            <div className="inst-empty">No subjects in this semester yet.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
              {subjects.map(sub => {
                const subLessonCount = lessons.filter(l => Number(l.subject?.id) === Number(sub.id)).length;
                return (
                  <button
                    key={sub.id}
                    onClick={() => selectSubject(sub)}
                    style={{
                      padding: '14px 16px',
                      border: `2px solid ${Number(selectedSubjectId) === Number(sub.id) ? '#2563eb' : '#e2e8f0'}`,
                      borderRadius: 12,
                      background: Number(selectedSubjectId) === Number(sub.id) ? '#eff6ff' : '#fff',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <strong>{sub.subjectName}</strong>
                    <br />
                    <small style={{ color: '#64748b' }}>{sub.subjectCode || ''} · {subLessonCount} lessons</small>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {showForm && (
        <form className="inst-form card" onSubmit={addLesson} style={{ marginBottom: 20 }}>
          <h3>Add New Lesson {selectedSubject ? `to ${selectedSubject.subjectName}` : ""}</h3>
          {!selectedSubjectId && <p className="inst-warning">⚠️ Select a subject from the semester above first.</p>}
          <div className="inst-form-group">
            <label>Title *</label>
            <input required placeholder="e.g. Introduction to Variables" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="inst-form-group">
            <label>Description</label>
            <input placeholder="Brief description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="inst-form-group">
            <label>Content (Markdown)</label>
            <textarea rows={5} placeholder="Write lesson content..." value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} />
          </div>
          <div className="inst-form-group">
            <label>Duration (minutes)</label>
            <input type="number" min={1} value={form.durationMinutes} onChange={e => setForm({ ...form, durationMinutes: e.target.value })} />
          </div>
          <div className="inst-form-actions">
            <button type="button" className="inst-btn secondary" onClick={() => setShowForm(false)}>Cancel</button>
            <button type="submit" className="inst-btn primary" disabled={saving || !selectedSubjectId}>{saving ? "Adding..." : "Add Lesson"}</button>
          </div>
        </form>
      )}

      <div className="inst-section">
        {!selectedCourse ? (
          <div className="inst-empty">Select a course to view its lessons.</div>
        ) : selectedSubject ? (
          /* Lessons for selected subject */
          filteredLessons.length === 0 ? (
            <div className="inst-empty">No lessons in {selectedSubject.subjectName} yet.</div>
          ) : (
            <div className="inst-lesson-list">
              {filteredLessons.sort((a, b) => (a.lessonOrder || 0) - (b.lessonOrder || 0)).map((l, i) => (
                <div key={l.id} className="inst-lesson-row card">
                  <div className="inst-lesson-number">{i + 1}</div>
                  <div className="inst-lesson-info">
                    <strong>{l.title}</strong>
                    <span>{l.description || "No description"} · {l.durationMinutes || 0} min</span>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : activeSemester ? (
          /* All lessons grouped by subject for active semester */
          subjects.length === 0 ? (
            <div className="inst-empty">Select a subject above to view its lessons.</div>
          ) : (
            subjects.map(sub => {
              const subLessons = lessons.filter(l => Number(l.subject?.id) === Number(sub.id));
              if (subLessons.length === 0) return null;
              return (
                <div key={sub.id} style={{ marginBottom: 16 }}>
                  <h4 style={{ margin: '0 0 8px' }}>{sub.subjectName} ({subLessons.length} lessons)</h4>
                  <div className="inst-lesson-list">
                    {subLessons.sort((a, b) => (a.lessonOrder || 0) - (b.lessonOrder || 0)).map((l, i) => (
                      <div key={l.id} className="inst-lesson-row card">
                        <div className="inst-lesson-number">{i + 1}</div>
                        <div className="inst-lesson-info">
                          <strong>{l.title}</strong>
                          <span>{l.description || "No description"} · {l.durationMinutes || 0} min</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )
        ) : (
          <div className="inst-empty">Select a course to view its lessons.</div>
        )}
      </div>
    </div>
  );
}
