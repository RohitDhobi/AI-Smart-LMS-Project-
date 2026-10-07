import React, { useEffect, useState } from "react";
import { api } from "../../api";
import InstructorPage from "./InstructorPage";

// =====================================================
// EXAM APPROVAL WORKFLOW (INSTRUCTOR SIDE)
//
// DRAFT ──submit──> PENDING_HOD_APPROVAL ──HOD──> APPROVED ──publish──> PUBLISHED
//                        │                          │
//                        └──HOD reject──> REJECTED ─┘ (edit + resubmit)
//
// The backend re-checks every transition - this file only decides which
// buttons to show for the status the server reported.
// =====================================================

const STATUS_LABELS = {
  DRAFT: "Draft",
  PENDING_HOD_APPROVAL: "Pending HOD Approval",
  REJECTED: "Rejected",
  APPROVED: "Approved",
  PUBLISHED: "Published",
  COMPLETED: "Completed",
  SCHEDULED: "Scheduled",
};

function statusLabel(status) {
  return STATUS_LABELS[status] || status || "Draft";
}

function formatDateTime(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString([], {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const EMPTY_FORM = {
  title: "",
  description: "",
  duration: 60,
  totalMarks: 70,
  courseId: "",
  subjectId: "",
  examDate: "",
  url: "",
  type: "in-person",
};

export default function InstructorExams() {
  const [exams, setExams] = useState([]);
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null); // exam being edited
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [paperView, setPaperView] = useState(null);

  let viewPaper = null;
  try {
    viewPaper = paperView?.questionPaper ? JSON.parse(paperView.questionPaper) : null;
  } catch { viewPaper = null; }

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [e, c] = await Promise.all([
        api.myExams().catch(() => []),
        api.instructorCourses().catch(() => api.courses().catch(() => [])),
      ]);
      setExams(Array.isArray(e) ? e : []);
      setCourses(Array.isArray(c) ? c : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  // Subjects of the picked course (exam belongs to a subject/course).
  useEffect(() => {
    if (!form.courseId) { setSubjects([]); return; }
    let alive = true;
    api.courseSubjects(form.courseId)
      .then((s) => { if (alive) setSubjects(Array.isArray(s) ? s : []); })
      .catch(() => { if (alive) setSubjects([]); });
    return () => { alive = false; };
  }, [form.courseId]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError("");
    setShowForm(true);
  }

  function openEdit(exam) {
    setEditing(exam);
    setError("");
    setForm({
      title: exam.title || "",
      description: exam.description || "",
      duration: exam.durationMinutes || exam.duration || 60,
      totalMarks: exam.totalMarks || 70,
      courseId: exam.courseId ? String(exam.courseId) : "",
      subjectId: exam.subjectId ? String(exam.subjectId) : "",
      examDate: exam.startTime ? String(exam.startTime).slice(0, 16) : "",
      url: exam.url || "",
      type: exam.type || "in-person",
    });
    setShowForm(true);
  }

  function handleCancel() {
    setShowForm(false);
    setEditing(null);
    setForm(EMPTY_FORM);
    setError("");
  }

  function buildBody() {
    const subject = subjects.find((s) => String(s.id) === String(form.subjectId));
    return {
      title: form.title.trim(),
      description: form.description.trim(),
      durationMinutes: Number(form.duration) || 60,
      totalMarks: Number(form.totalMarks) || 100,
      passingMarks: Math.max(1, Math.round((Number(form.totalMarks) || 100) * 0.4)),
      startTime: form.examDate ? new Date(form.examDate).toISOString() : null,
      course: form.courseId ? { id: Number(form.courseId) } : undefined,
      subjectId: form.subjectId ? Number(form.subjectId) : undefined,
      subjectName: subject ? subject.subjectName || subject.name : undefined,
      url: form.url || undefined,
      type: form.type,
    };
  }

  // [Save Draft] - create (always starts DRAFT server-side) or save edits.
  async function handleSaveDraft(e) {
    e?.preventDefault?.();
    try {
      setSaving(true);
      setError("");
      if (editing) {
        await api.updateExam(editing.id, { ...buildBody(), status: editing.status });
        setNotice("Draft saved.");
      } else {
        await api.instructorCreateExam(buildBody());
        setNotice("Exam saved as draft. Add a question paper, then submit for HOD approval.");
      }
      handleCancel();
      loadData();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  // [Submit for HOD Approval] / [Resubmit for HOD Approval]
  async function handleSubmitForApproval(e) {
    e?.preventDefault?.();
    try {
      setSaving(true);
      setError("");
      let id = editing?.id;
      if (editing) {
        await api.updateExam(editing.id, { ...buildBody(), status: editing.status });
      } else {
        const created = await api.instructorCreateExam(buildBody());
        id = created?.id;
      }
      if (id) {
        await api.submitExamForApproval(id);
        setNotice("Submitted for HOD approval. You will see the decision here.");
      }
      handleCancel();
      loadData();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  // Direct table action: submit an existing draft/rejected exam.
  async function actionSubmit(exam) {
    try {
      setError("");
      await api.submitExamForApproval(exam.id);
      setNotice(`"${exam.title}" submitted for HOD approval.`);
      loadData();
    } catch (err) { setError(err.message); }
  }

  // [Publish Exam] - only shown for APPROVED; backend returns 403 otherwise.
  async function actionPublish(exam) {
    try {
      setError("");
      await api.publishExam(exam.id);
      setNotice(`"${exam.title}" published - students can now see it.`);
      loadData();
    } catch (err) { setError(err.message); }
  }

  async function actionDelete(exam) {
    const ok = window.confirm(`Delete "${exam.title}"? This cannot be undone.`);
    if (!ok) return;
    try {
      setError("");
      await api.deleteExam(exam.id);
      setNotice(`Deleted "${exam.title}".`);
      loadData();
    } catch (err) { setError(err.message); }
  }

  // Which buttons does this status get?
  function renderActions(exam) {
    const s = exam.status || "DRAFT";
    const btn = (label, cls, onClick) => (
      <button key={label} className={`inst-btn ${cls}`} style={{ fontSize: 13, padding: "6px 12px" }}
        onClick={onClick}>{label}</button>
    );

    switch (s) {
      case "DRAFT":
        return [
          btn("Edit", "secondary", () => openEdit(exam)),
          btn("Submit", "primary", () => actionSubmit(exam)),
          btn("Delete", "secondary", () => actionDelete(exam)),
        ];
      case "PENDING_HOD_APPROVAL":
        return [
          btn("View", "secondary", () => setPaperView(exam)),
        ];
      case "REJECTED":
        return [
          btn("Edit", "secondary", () => openEdit(exam)),
          btn("Resubmit", "primary", () => actionSubmit(exam)),
        ];
      case "APPROVED":
        return [
          btn("View", "secondary", () => setPaperView(exam)),
          btn("Publish", "primary", () => actionPublish(exam)),
        ];
      default:
        return [btn("View", "secondary", () => setPaperView(exam))];
    }
  }

  function statusBadge(exam) {
    const s = exam.status || "DRAFT";
    return (
      <span className={`inst-status-badge exam-status-${s.toLowerCase()}`}>
        {statusLabel(s)}
      </span>
    );
  }

  return (
    <InstructorPage icon="🎓" title="My Exams" subtitle="Create exams and submit them to your HOD for approval.">
      <div style={{ marginBottom: 16, display: "flex", gap: 10, alignItems: "center" }}>
        <button className="inst-btn primary" onClick={openCreate}>+ Create Exam</button>
      </div>

      {error && <div className="error" style={{ marginBottom: 14 }}>{error}</div>}
      {notice && <div className="notice" style={{ marginBottom: 14 }}>{notice}</div>}

      {/* ---------------- CREATE / EDIT FORM ---------------- */}
      {showForm && (
        <form className="inst-form card" onSubmit={handleSubmitForApproval} style={{ marginBottom: 20 }}>
          <h3>{editing ? `Edit Exam${editing.status === "REJECTED" ? " (Rejected)" : ""}` : "Create Exam"}</h3>

          {editing?.status === "REJECTED" && (
            <div className="error" style={{ marginBottom: 12 }}>
              <strong>HOD Feedback:</strong> {editing.rejectionReason || "No reason recorded."}
            </div>
          )}

          <div className="inst-form-group">
            <label>Exam Title *</label>
            <input required placeholder="e.g. Mid Semester Examination"
              value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          </div>

          <div className="inst-form-group">
            <label>Description</label>
            <textarea rows={2} placeholder="Exam description..."
              value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>

          {/* Course - only subjects/courses assigned by the HOD can be picked
              (the backend rejects anything else with 403). */}
          <div className="inst-form-row">
            <div className="inst-form-group">
              <label>Course / Subject *</label>
              <select required value={form.courseId}
                onChange={e => setForm({ ...form, courseId: e.target.value, subjectId: "" })}>
                <option value="" disabled>Select a course…</option>
                {courses.map(c => (
                  <option key={c.id} value={String(c.id)}>{c.title || c.courseName}</option>
                ))}
              </select>
              {courses.length === 0 && (
                <small style={{ fontSize: 12, color: "#94a3b8", marginTop: 6, display: "block" }}>
                  No courses assigned - ask your HOD to assign one.
                </small>
              )}
            </div>

            {subjects.length > 0 && (
              <div className="inst-form-group">
                <label>Subject</label>
                <select value={form.subjectId}
                  onChange={e => setForm({ ...form, subjectId: e.target.value })}>
                  <option value="">Course level (all subjects)</option>
                  {subjects.map(s => (
                    <option key={s.id} value={String(s.id)}>{s.subjectName || s.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="inst-form-row">
            <div className="inst-form-group">
              <label>Date &amp; Time</label>
              <input type="datetime-local" value={form.examDate}
                onChange={e => setForm({ ...form, examDate: e.target.value })} />
            </div>
            <div className="inst-form-group">
              <label>Duration (minutes)</label>
              <input type="number" min={1} value={form.duration}
                onChange={e => setForm({ ...form, duration: e.target.value })} />
            </div>
            <div className="inst-form-group">
              <label>Maximum Marks</label>
              <input type="number" min={1} value={form.totalMarks}
                onChange={e => setForm({ ...form, totalMarks: e.target.value })} />
            </div>
          </div>

          <div className="inst-form-row">
            <div className="inst-form-group">
              <label>Exam Type</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                <option value="in-person">In-Person</option>
                <option value="online">Online</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>
            {form.type === "online" && (
              <div className="inst-form-group">
                <label>🔗 Exam URL / Link</label>
                <input type="url" placeholder="https://..."
                  value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} />
              </div>
            )}
          </div>

          <div className="inst-form-actions">
            <button type="button" className="inst-btn secondary" onClick={handleCancel}>Cancel</button>
            <button type="button" className="inst-btn secondary" disabled={saving}
              onClick={handleSaveDraft}>
              {saving ? "Saving..." : "Save Draft"}
            </button>
            <button type="submit" className="inst-btn primary" disabled={saving}>
              {saving ? "Submitting..." : editing?.status === "REJECTED" ? "Resubmit for HOD Approval" : "Submit for HOD Approval"}
            </button>
          </div>

          <p style={{ fontSize: 12.5, color: "#94a3b8", marginTop: 10 }}>
            Exams must be approved by your HOD before you can publish them to students.
          </p>
        </form>
      )}

      {/* ---------------- MY EXAMS TABLE ---------------- */}
      {exams.length === 0 ? (
        <div className="inst-empty">
          <div className="inst-empty-icon">🎓</div>
          <h3>No exams yet</h3>
          <p>Create your first exam and submit it for HOD approval.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Exam Name</th>
                  <th>Subject</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {exams.map(e => (
                  <React.Fragment key={e.id}>
                    <tr>
                      <td>
                        <strong>{e.title}</strong>
                        {e.startTime && (
                          <div style={{ fontSize: 12, color: "#94a3b8" }}>
                            📅 {formatDateTime(e.startTime)}
                          </div>
                        )}
                      </td>
                      <td>{e.subjectName || e.courseName || "—"}</td>
                      <td>{statusBadge(e)}</td>
                      <td>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {renderActions(e)}
                        </div>
                      </td>
                    </tr>

                    {/* Approval / rejection details */}
                    {(e.status === "REJECTED" || e.status === "APPROVED" || e.status === "PENDING_HOD_APPROVAL") && (
                      <tr>
                        <td colSpan={4} style={{ whiteSpace: "normal", background: "var(--surface-soft)", fontSize: 13 }}>
                          {e.status === "REJECTED" && (
                            <div>
                              <strong style={{ color: "#dc2626" }}>HOD Feedback:</strong>{" "}
                              {e.rejectionReason || "No reason recorded."}
                            </div>
                          )}
                          {e.status === "APPROVED" && (
                            <div style={{ color: "#16a34a" }}>
                              ✓ Exam approved by HOD
                              {e.approvedByName ? <> — Approved By: <strong>{e.approvedByName}</strong></> : null}
                              {e.approvedAt ? <> — Approved Date: {formatDateTime(e.approvedAt)}</> : null}
                            </div>
                          )}
                          {e.status === "PENDING_HOD_APPROVAL" && (
                            <div style={{ color: "#b45309" }}>
                              ⏳ Waiting for HOD review
                              {e.submittedAt ? ` — submitted ${formatDateTime(e.submittedAt)}` : ""}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Question Paper Viewer (same renderer as before) */}
      {paperView && (
        <div className="qb-modal-overlay" onClick={() => setPaperView(null)}>
          <div className="qb-modal" style={{ maxWidth: 780, padding: 0 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottom: "1px solid var(--border)" }}>
              <h3 style={{ margin: 0 }}>📄 {paperView.title}</h3>
              <button className="qb-cancel-btn" onClick={() => setPaperView(null)}>✕ Close</button>
            </div>
            {viewPaper && Array.isArray(viewPaper.sections) ? (
              <div className="paper-preview" style={{ margin: 16, boxShadow: "none", border: "1px solid var(--border)" }}>
                <h1>{viewPaper.title}</h1>
                <h2>{viewPaper.subject}</h2>
                <div className="paper-meta">
                  <p><strong>Duration:</strong> {viewPaper.duration} &nbsp;&nbsp;|&nbsp;&nbsp; <strong>Maximum Marks:</strong> {viewPaper.totalMarks} &nbsp;&nbsp;|&nbsp;&nbsp; <strong>Difficulty:</strong> {viewPaper.difficulty}</p>
                </div>
                {viewPaper.instructions && (
                  <p className="paper-section-instructions"><em>{viewPaper.instructions}</em></p>
                )}
                {viewPaper.sections.map((sec, si) => (
                  <div key={si} className="paper-section">
                    <h3>{sec.name} &nbsp; <span className="paper-section-marks">({sec.total} marks)</span></h3>
                    {sec.instructions && <p className="paper-section-instructions"><em>{sec.instructions}</em></p>}
                    {(sec.questions || []).map((q, qi) => (
                      <div key={qi} className="paper-q">
                        <span className="paper-q-num">Q{q.num}.</span>
                        <span>
                          {q.text}
                          {q.type === "mcq" && Array.isArray(q.options) && (
                            <div className="paper-mcq-options">
                              {q.options.map((opt, oi) => <span key={oi}>({'ABCD'[oi] || oi + 1}) {opt}</span>)}
                            </div>
                          )}
                          <em style={{ fontSize: 12, color: "#666" }}>({q.marks} mark{q.marks !== 1 ? "s" : ""})</em>
                        </span>
                        {q.orChoice && <div className="paper-or">OR &nbsp; {q.orChoice}</div>}
                      </div>
                    ))}
                  </div>
                ))}
                <div className="paper-total-footer">
                  <p>TOTAL: {viewPaper.totalMarks} MARKS &nbsp;&nbsp;|&nbsp;&nbsp; {viewPaper.totalQuestions} Questions</p>
                </div>
              </div>
            ) : (
              <p style={{ padding: 20, color: "var(--text-secondary)" }}>
                {paperView.questionPaper
                  ? "Question paper preview is unavailable. Re-upload the paper from AI Tools."
                  : "No question paper attached yet. Create one from AI Tools."}
              </p>
            )}
          </div>
        </div>
      )}
    </InstructorPage>
  );
}
