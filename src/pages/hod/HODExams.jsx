import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { api } from "../../api";
import {
  FileQuestion, PlusCircle, GraduationCap, Trash2, ChevronLeft, Save, Pencil
} from "lucide-react";

/**
 * HOD - Exams
 *
 * Routes (all rendered by this file):
 *   /hod/exams        -> list
 *   /hod/exams/new    -> create form
 *   /hod/exams/:id    -> manage one exam (details + question paper + delete)
 *
 * Previously the create/manage routes pointed at the list component, so the
 * "Create Exam" and "Manage" buttons only changed the URL while the screen
 * stayed exactly the same.
 */
export default function HODExams() {
  const { id } = useParams();
  const location = useLocation();

  // NOTE: the app declares `exams/new` as a LITERAL route (not `exams/:id`),
  // so useParams() is empty for the create page - match on the pathname.
  if (location.pathname.endsWith("/new")) return <ExamCreate />;
  if (id) return <ExamManage examId={id} />;
  return <ExamList />;
}

// =====================================================
// LIST VIEW
// =====================================================

function ExamList() {
  const location = useLocation();
  const navigate = useNavigate();

  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(location.state?.notice || "");

  useEffect(() => { loadExams(); }, []);

  // The notice is passed in via navigation state (create/delete from the
  // other views). Clear it from history so it doesn't reappear on refresh.
  useEffect(() => {
    if (location.state?.notice) {
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadExams() {
    try {
      setLoading(true);
      setError("");
      const data = await api.hodExams().catch(() => []);
      setExams(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Unable to load exams.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(exam) {
    const name = exam.title || exam.name || "this exam";
    const ok = window.confirm(`Delete "${name}"? This cannot be undone.`);
    if (!ok) return;

    try {
      setError("");
      await api.deleteExam(exam.id);
      await loadExams();
      setNotice(`Deleted "${name}".`);
    } catch (err) {
      setError(err.message || "Failed to delete exam.");
    }
  }

  return (
    <div className="page hod-exams">
      <div className="page-heading">
        <h1>Exams</h1>
        <p>Create exams, manage question papers, and track exam performance.</p>
      </div>

      <div className="hod-actions">
        <Link to="/hod/exams/new" className="inst-btn inst-btn-primary">
          <PlusCircle size={16} /> Create Exam
        </Link>
        <Link to="/hod/questions" className="inst-btn inst-btn-secondary">
          <FileQuestion size={16} /> Manage Questions
        </Link>
        <button className="inst-btn inst-btn-secondary" onClick={loadExams}>Refresh</button>
      </div>

      {error && <div className="error">{error}</div>}
      {notice && <div className="notice">{notice}</div>}

      {loading ? (
        <div className="inst-loading">Loading exams...</div>
      ) : exams.length === 0 ? (
        <div className="card hod-empty">
          <div className="empty-icon">📝</div>
          <h3>No exams yet</h3>
          <p>Create your first exam to start managing question papers.</p>
          <Link to="/hod/exams/new" className="inst-btn primary">
            <PlusCircle size={16} /> Create Exam
          </Link>
        </div>
      ) : (
        <div className="hod-table-wrap">
          <table className="hod-table">
            <thead>
              <tr>
                <th>Exam Name</th>
                <th>Course</th>
                <th>Date</th>
                <th>Duration</th>
                <th>Questions</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {exams.map((e) => (
                <tr key={e.id}>
                  <td>
                    <strong>{e.title || e.name}</strong>
                    {e.description && <span className="hod-sub">{e.description}</span>}
                  </td>
                  <td>
                    {e.courseName ? <span className="hod-sub">{e.courseName}</span> : <span className="hod-sub">—</span>}
                  </td>
                  <td>
                    {e.date || e.endTime ? (
                      <span className="hod-sub">
                        {e.date
                          ? new Date(e.date).toLocaleString([], {
                              day: "2-digit", month: "short", year: "numeric",
                              hour: "2-digit", minute: "2-digit",
                            })
                          : "immediate"}
                        {e.endTime &&
                          ` → ${new Date(e.endTime).toLocaleString([], {
                            day: "2-digit", month: "short",
                            hour: "2-digit", minute: "2-digit",
                          })}`}
                      </span>
                    ) : (
                      <span className="hod-sub">— no slot —</span>
                    )}
                  </td>
                  <td>
                    <span className="hod-sub">{e.duration} mins</span>
                  </td>
                  <td>
                    <span className="hod-sub">{e.questionCount || 0}</span>
                  </td>
                  <td>
                    <span className={`status-badge status-${e.status?.toLowerCase() || "active"}`}>
                      {e.status || "Active"}
                    </span>
                  </td>
                  <td className="hod-actions-cell">
                    <div className="hod-actions-cell">
                      <Link to={`/hod/exams/${e.id}`} className="inst-btn inst-btn-small">
                        <GraduationCap size={14} /> Manage
                      </Link>
                      <button
                        className="inst-btn inst-btn-small danger"
                        onClick={() => handleDelete(e)}
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ---- schedule slot helpers --------------------------------------------

/** Pad to the two digits <input type="datetime-local"> expects. */
function pad2(n) {
  return String(n).padStart(2, "0");
}

/**
 * ISO string ("2026-09-28T09:00:00") -> value for datetime-local.
 * Returns "" for missing/unparseable values so the input renders empty.
 */
function toInputValue(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/** datetime-local value -> ISO string the backend can parse. */
function toIso(value) {
  if (!value) return null;
  return value.length === 16 ? `${value}:00` : value;
}

/** "2026-10-01T09:00" -> { date: "2026-10-01", time: "09:00" } */
function splitInput(value) {
  if (!value) return { date: "", time: "" };
  return {
    date: value.slice(0, 10),
    time: value.length >= 16 ? value.slice(11, 16) : "",
  };
}

/** Day + time pickers -> one "YYYY-MM-DDTHH:mm" slot value (midnight if no time). */
function joinDateTime(date, time) {
  if (!date) return "";
  return `${date}T${time || "00:00"}`;
}

/** The slot end implied by a start time + duration, when no end was picked. */
function deriveEnd(startValue, durationMinutes) {
  if (!startValue) return null;
  const start = new Date(startValue);
  if (Number.isNaN(start.getTime())) return null;
  const end = new Date(start.getTime() + (Number(durationMinutes) || 60) * 60000);
  return `${end.getFullYear()}-${pad2(end.getMonth() + 1)}-${pad2(end.getDate())}T${pad2(end.getHours())}:${pad2(end.getMinutes())}`;
}

/**
 * One side of the exam slot: a day picker + a time picker.
 *
 * Deliberately NOT a single <input type="datetime-local">: that widget only
 * reports a value once BOTH date and time are filled in, so picking a date
 * from the calendar (time still "--:--") silently left the form empty and
 * Save stayed disabled. Separate inputs each take effect immediately.
 */
function ScheduleField({ id, label, date, time, onDate, onTime, hint }) {
  return (
    <div className="inst-form-group" style={{ flex: "1 1 260px", minWidth: 240, marginBottom: 0 }}>
      <label htmlFor={`${id}-date`} style={{ marginBottom: 6 }}>
        {label}
      </label>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          id={`${id}-date`}
          className="inst-input"
          type="date"
          aria-label={`${label} — day`}
          style={{ flex: "1 1 auto", minWidth: 0 }}
          value={date}
          onChange={(e) => onDate(e.target.value)}
        />
        <input
          id={`${id}-time`}
          className="inst-input"
          type="time"
          aria-label={`${label} — time`}
          style={{ flex: "0 0 120px" }}
          value={time}
          onChange={(e) => onTime(e.target.value)}
        />
      </div>
      {hint && (
        <small style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4, display: "block" }}>
          {hint}
        </small>
      )}
    </div>
  );
}

/** Human-readable "Tue, 1 Oct 2026, 09:00" for a slot value. */
function formatSlot(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString([], {
    weekday: "short", day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// =====================================================
// CREATE VIEW (route: /hod/exams/new)
// =====================================================

const EMPTY_EXAM = {
  title: "",
  courseId: "",
  durationMinutes: 60,
  totalMarks: 100,
  passingMarks: 40,
  startTime: "",
  endTime: "",
  status: "SCHEDULED",
  description: "",
};

function ExamCreate() {
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY_EXAM);
  const [courses, setCourses] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.hodCourses()
      .then((data) => setCourses(Array.isArray(data) ? data : []))
      .catch(() => setCourses([]));
  }, []);

  function setField(name, value) {
    setForm((f) => ({ ...f, [name]: value }));
  }

  /** Update one half (day or time) of a slot field without losing the other. */
  function setSlot(field, part, value) {
    setForm((f) => {
      const current = splitInput(f[field]);
      const next = { ...current, [part]: value };
      return { ...f, [field]: joinDateTime(next.date, next.time) };
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.title.trim()) {
      setError("Exam name is required.");
      return;
    }
    if (!form.courseId) {
      setError("Pick the course this exam belongs to.");
      return;
    }
    if (form.startTime && form.endTime && form.endTime <= form.startTime) {
      setError("Closing time must be later than the opening time.");
      return;
    }

    // No explicit end? The slot then lasts exactly the exam duration.
    const endTime = form.endTime
      ? toIso(form.endTime)
      : deriveEnd(form.startTime, form.durationMinutes);

    const body = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      durationMinutes: Number(form.durationMinutes) || 60,
      totalMarks: Number(form.totalMarks) || 100,
      passingMarks: Number(form.passingMarks) || 40,
      status: form.status,
      startTime: toIso(form.startTime),
      endTime,
      course: { id: Number(form.courseId) },
    };

    try {
      setSaving(true);
      setError("");
      const created = await api.instructorCreateExam(body);
      navigate("/hod/exams", {
        state: { notice: `Exam "${body.title}" created.` },
      });
      return created;
    } catch (err) {
      setError(err.message || "Failed to create exam.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page hod-exams">
      <div className="page-heading">
        <button className="back-link" onClick={() => navigate("/hod/exams")}>
          <ChevronLeft size={14} /> Back to Exams
        </button>
        <h1>Create Exam</h1>
        <p>Schedule a new exam and attach it to one of your courses.</p>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="card">
        <form className="inst-form" onSubmit={handleSubmit}>
          <div className="inst-form-group">
            <label>Exam name *</label>
            <input
              className="inst-input"
              placeholder="e.g. Mid Semester Exam"
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
              required
            />
          </div>

          <div className="inst-form-group">
            <label>Course *</label>
            <select
              className="inst-select"
              value={form.courseId}
              onChange={(e) => setField("courseId", e.target.value)}
              required
            >
              <option value="">Select a course...</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title || c.courseName || `Course ${c.id}`}
                </option>
              ))}
            </select>
          </div>

          <div className="inst-form-row" style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <div className="inst-form-group" style={{ flex: 1, minWidth: 150 }}>
              <label>Duration (minutes)</label>
              <input
                className="inst-input"
                type="number"
                min="1"
                value={form.durationMinutes}
                onChange={(e) => setField("durationMinutes", e.target.value)}
              />
            </div>
            <div className="inst-form-group" style={{ flex: 1, minWidth: 150 }}>
              <label>Total marks</label>
              <input
                className="inst-input"
                type="number"
                min="1"
                value={form.totalMarks}
                onChange={(e) => setField("totalMarks", e.target.value)}
              />
            </div>
            <div className="inst-form-group" style={{ flex: 1, minWidth: 150 }}>
              <label>Passing marks</label>
              <input
                className="inst-input"
                type="number"
                min="0"
                value={form.passingMarks}
                onChange={(e) => setField("passingMarks", e.target.value)}
              />
            </div>
          </div>

          <div className="inst-form-row" style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <ScheduleField
              id="create-open"
              label="Opens (day & time)"
              {...splitInput(form.startTime)}
              onDate={(v) => setSlot("startTime", "date", v)}
              onTime={(v) => setSlot("startTime", "time", v)}
              hint="Leave both blank to keep the paper open all the time."
            />
            <ScheduleField
              id="create-close"
              label="Closes (day & time)"
              {...splitInput(form.endTime)}
              onDate={(v) => setSlot("endTime", "date", v)}
              onTime={(v) => setSlot("endTime", "time", v)}
              hint={`Leave blank to close ${form.durationMinutes || 60} minutes after opening.`}
            />
            <div className="inst-form-group" style={{ flex: "1 1 170px", minWidth: 170 }}>
              <label>Status</label>
              <select
                className="inst-select"
                value={form.status}
                onChange={(e) => setField("status", e.target.value)}
              >
                <option value="DRAFT">Draft</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="LIVE">Live</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </div>

          <div className="inst-form-group">
            <label>Description</label>
            <textarea
              className="inst-input"
              placeholder="Short description shown in the exam list..."
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
            />
          </div>

          <div className="inst-modal-actions">
            <button
              type="button"
              className="inst-btn inst-btn-secondary"
              onClick={() => navigate("/hod/exams")}
            >
              Cancel
            </button>
            <button type="submit" className="inst-btn inst-btn-primary" disabled={saving}>
              <PlusCircle size={15} /> {saving ? "Creating..." : "Create Exam"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =====================================================
// MANAGE VIEW (route: /hod/exams/:id)
// =====================================================

function ExamManage({ examId }) {
  const navigate = useNavigate();

  const [exam, setExam] = useState(null);
  const [meta, setMeta] = useState(null); // row from /hod/exams (course name etc.)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [notice, setNotice] = useState("");
  // Question editor: { mode: "add" | "edit", secIdx?, qIdx?, sectionNames, form }
  const [editor, setEditor] = useState(null);

  useEffect(() => { load(); }, [examId]);

  async function load() {
    try {
      setLoading(true);
      setError("");

      const [examData, list] = await Promise.all([
        api.exam(examId),
        api.hodExams().catch(() => []),
      ]);

      setExam(examData);
      setStatus(examData?.status || "SCHEDULED");
      setStartTime(toInputValue(examData?.startTime));
      setEndTime(toInputValue(examData?.endTime));
      setMeta(
        (Array.isArray(list) ? list : []).find(
          (e) => Number(e.id) === Number(examId)
        ) || null
      );
    } catch (e) {
      setError(e.message || "Unable to load this exam.");
    } finally {
      setLoading(false);
    }
  }

  /** Save status + the day/time slot the paper opens and closes in. */
  async function handleStatusSave() {
    if (!exam) return;
    if (startTime && endTime && endTime <= startTime) {
      setError("Closing time must be later than the opening time.");
      return;
    }
    try {
      setSaving(true);
      setError("");
      // updateExam replaces every field it reads, so send the exam back as-is
      // with the status and the new slot.
      await api.updateExam(exam.id, {
        ...exam,
        status,
        startTime: toIso(startTime),
        endTime: toIso(endTime),
      });
      await load();
      setNotice(
        startTime
          ? "Schedule saved — students can only open the paper inside this slot."
          : "Schedule saved. This exam has no slot, so its paper stays open."
      );
    } catch (err) {
      setError(err.message || "Failed to update the exam.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!exam) return;
    const name = exam.title || "this exam";
    const ok = window.confirm(`Delete "${name}"? This cannot be undone.`);
    if (!ok) return;

    try {
      setError("");
      await api.deleteExam(exam.id);
      navigate("/hod/exams", {
        state: { notice: `Deleted "${name}".` },
      });
    } catch (err) {
      setError(err.message || "Failed to delete exam.");
    }
  }

  const paper = parsePaper(exam?.questionPaper);

  /** Update one half (day or time) of a slot without losing the other. */
  function changeSlot(setter, current, part, value) {
    const next = { ...splitInput(current), [part]: value };
    setter(joinDateTime(next.date, next.time));
  }

  const slotDirty =
    status !== (exam?.status || "") ||
    startTime !== toInputValue(exam?.startTime) ||
    endTime !== toInputValue(exam?.endTime);

  const pendingStart = formatSlot(startTime);
  const pendingEnd = formatSlot(endTime);

  // ---------- question paper editing ------------------------------------

  /** Deep-copied, section-normalized paper we can safely mutate. */
  function currentPaper() {
    return ensureSections(
      clonePaper(parsePaper(exam?.questionPaper) || emptyPaper(exam))
    );
  }

  /**
   * Save the paper back onto the exam. PUT /exams/{id} replaces the fields it
   * reads, so the whole exam is sent with the new questionPaper only.
   */
  async function persistPaper(nextPaper, msg) {
    try {
      setError("");
      normalizePaper(nextPaper);
      await api.updateExam(exam.id, {
        ...exam,
        questionPaper: JSON.stringify(nextPaper),
      });
      await load();
      setNotice(msg);
      return true;
    } catch (err) {
      setError(err.message || "Failed to update the question paper.");
      return false;
    }
  }

  function openAddQuestion() {
    const p = currentPaper();
    const secIdx = 0;
    const sample = p.sections[secIdx]?.questions?.[0];
    setEditor({
      mode: "add",
      sectionNames: p.sections.map((s) => s.name || `Section ${secIdx + 1}`),
      form: {
        sectionIdx: secIdx,
        text: "",
        options: ["", "", "", ""],
        answer: "A",
        marks: sample?.marks ?? 1,
        type: sample?.type ?? "mcq",
      },
    });
  }

  function openEditQuestion(secIdx, qIdx) {
    const p = currentPaper();
    const q = p.sections[secIdx]?.questions?.[qIdx];
    if (!q) return;

    const options = [...(Array.isArray(q.options) ? q.options : [])];
    while (options.length < 4) options.push("");

    setEditor({
      mode: "edit",
      secIdx,
      qIdx,
      sectionNames: p.sections.map((s, i) => s.name || `Section ${i + 1}`),
      form: {
        sectionIdx: secIdx,
        text: q.text || q.question || "",
        options: options.slice(0, 4),
        answer: q.answer || "",
        marks: q.marks ?? 1,
        type: q.type || "mcq",
        orChoice: q.orChoice ?? null,
        source: q.source || "manual",
      },
    });
  }

  function deletePaperQuestion(secIdx, qIdx) {
    const p = currentPaper();
    const q = p.sections[secIdx]?.questions?.[qIdx];
    if (!q) return;

    const label = String(q.text || "this question").slice(0, 70);
    if (!window.confirm(`Delete "${label}"?`)) return;

    p.sections[secIdx].questions.splice(qIdx, 1);
    persistPaper(p, `Deleted "${label}${label.length >= 70 ? "..." : ""}" from the paper.`);
  }

  async function submitEditor(e) {
    e.preventDefault();
    if (!editor) return;

    const f = editor.form;
    if (!f.text.trim()) {
      setError("Question text is required.");
      return;
    }

    // Descriptive questions (2marker / 3marker ...) legitimately have no
    // options or fixed answer - only MCQs require them.
    const isMcq = String(f.type || "mcq").toLowerCase().startsWith("mcq");
    if (isMcq && (!String(f.options[0]).trim() || !String(f.options[1]).trim())) {
      setError("Options A and B are required for MCQ questions.");
      return;
    }
    if (isMcq && !f.answer) {
      setError("Pick the correct answer for this MCQ.");
      return;
    }

    const p = currentPaper();
    const hasOptions = f.options.some((o) => String(o).trim());
    const payload = {
      text: f.text.trim(),
      options: hasOptions
        ? f.options.map((o) => String(o).trim() || "-")
        : null,
      answer: f.answer ? f.answer : null,
      marks: Number(f.marks) || 1,
      type: f.type || "mcq",
      orChoice: f.orChoice ?? null,
      source: f.source || "manual",
    };

    let msg;
    if (editor.mode === "add") {
      p.sections[f.sectionIdx]?.questions.push(payload);
      msg = "Question added to the paper.";
    } else {
      const existing = p.sections[editor.secIdx]?.questions?.[editor.qIdx] || {};
      p.sections[editor.secIdx].questions[editor.qIdx] = {
        ...existing,
        ...payload,
      };
      msg = "Question updated.";
    }

    const ok = await persistPaper(p, msg);
    if (ok) setEditor(null);
  }

  function patchForm(patch) {
    setEditor((ed) => ({ ...ed, form: { ...ed.form, ...patch } }));
  }

  // MCQs need options + a fixed answer; descriptive questions do not.
  const editorIsMcq = editor
    ? String(editor.form.type || "mcq").toLowerCase().startsWith("mcq")
    : true;

  return (
    <div className="page hod-exams">
      <div className="page-heading">
        <button className="back-link" onClick={() => navigate("/hod/exams")}>
          <ChevronLeft size={14} /> Back to Exams
        </button>
        <h1>{loading ? "Exam" : exam?.title || "Exam"}</h1>
        <p>
          {meta?.courseName || "Course details unavailable"} · {exam?.durationMinutes ?? "—"} mins
        </p>
      </div>

      {error && <div className="error">{error}</div>}
      {notice && <div className="notice">{notice}</div>}

      {loading ? (
        <div className="inst-loading">Loading exam...</div>
      ) : !exam ? (
        <div className="card hod-empty">
          <div className="empty-icon">📝</div>
          <h3>Exam not found</h3>
          <p>It may have been deleted.</p>
          <Link to="/hod/exams" className="inst-btn primary">Back to Exams</Link>
        </div>
      ) : (
        <>
          {/* Summary + actions */}
          <div className="card">
            <div className="hod-actions" style={{ marginTop: 0 }}>
              <span className={`status-badge status-${(exam.status || "scheduled").toLowerCase()}`}>
                {exam.status || "SCHEDULED"}
              </span>
              <span className="hod-sub" style={{ marginTop: 0 }}>
                {questionsOf(paper).length || meta?.questionCount || 0} questions · {exam.totalMarks} marks
                (pass {exam.passingMarks}) · {exam.durationMinutes} mins
              </span>
              <div style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <select
                  className="inst-select"
                  style={{ width: 150 }}
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="DRAFT">Draft</option>
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="LIVE">Live</option>
                  <option value="COMPLETED">Completed</option>
                </select>
                <button
                  className="inst-btn inst-btn-small inst-btn-primary"
                  onClick={handleStatusSave}
                  disabled={saving || !slotDirty}
                >
                  <Save size={14} /> {saving ? "Saving..." : "Save"}
                </button>
                <button
                  className="inst-btn inst-btn-small inst-btn-danger"
                  onClick={handleDelete}
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>

            {/* The day/time slot the paper opens in */}
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 4 }}>
              <ScheduleField
                id="exam-open"
                label="Opens (day & time)"
                {...splitInput(startTime)}
                onDate={(v) => changeSlot(setStartTime, startTime, "date", v)}
                onTime={(v) => changeSlot(setStartTime, startTime, "time", v)}
                hint="Day the paper unlocks for students."
              />
              <ScheduleField
                id="exam-close"
                label="Closes (day & time)"
                {...splitInput(endTime)}
                onDate={(v) => changeSlot(setEndTime, endTime, "date", v)}
                onTime={(v) => changeSlot(setEndTime, endTime, "time", v)}
                hint={`Leave blank to close ${exam.durationMinutes || 60} minutes after opening.`}
              />
            </div>

            {exam.description && <p className="hod-sub">{exam.description}</p>}
            <p className="hod-sub" style={{ marginTop: 6 }}>
              {pendingStart || pendingEnd ? (
                <>
                  Paper opens <strong>{pendingStart || "immediately"}</strong>
                  {pendingEnd
                    ? <> and closes <strong>{pendingEnd}</strong></>
                    : startTime
                      ? <> and closes <strong>{exam.durationMinutes || 60} minutes later</strong></>
                      : null}
                  . Students cannot view it outside this slot.
                </>
              ) : (
                <>No day/time slot set — the paper stays open until you schedule one.</>
              )}
              {slotDirty && (
                <strong style={{ color: "var(--warning, #b45309)" }}> — unsaved, press Save.</strong>
              )}
            </p>
          </div>

          {/* Question paper */}
          <div className="page-heading" style={{ marginTop: 26, marginBottom: 12 }}>
            <h1 style={{ fontSize: 20 }}>Question Paper</h1>
            <p>
              {paper
                ? `${paper.title || exam.title} — ${paper.totalQuestions ?? paper.questionCount ?? questionsOf(paper).length} questions, difficulty ${paper.difficulty || "—"}`
                : "No question paper has been uploaded for this exam yet."}
            </p>
          </div>

          <div className="hod-actions" style={{ marginTop: 0 }}>
            <button className="inst-btn inst-btn-primary" onClick={openAddQuestion}>
              <PlusCircle size={15} /> Add Question
            </button>
            <span className="hod-sub" style={{ marginTop: 0 }}>
              {questionsOf(paper).length} question{questionsOf(paper).length === 1 ? "" : "s"} in this paper
            </span>
          </div>

          {!paper || questionsOf(paper).length === 0 ? (
            <div className="card hod-empty">
              <div className="empty-icon">📄</div>
              <h3>{paper ? "No questions in this paper yet" : "No question paper yet"}</h3>
              <p>
                {paper
                  ? "Add the first question to start building this paper."
                  : "Start an empty paper and add questions one by one."}
              </p>
              <button className="inst-btn primary" onClick={openAddQuestion}>
                <PlusCircle size={15} /> Add Question
              </button>
            </div>
          ) : (
            <div className="hod-table-wrap">
              <table className="hod-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Section</th>
                    <th>Question</th>
                    <th>Marks</th>
                    <th>Answer</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {ensureSections(clonePaper(paper)).sections.flatMap((s, secIdx) =>
                    (s.questions || []).map((q, qIdx) => (
                      <tr key={q.num ?? `${secIdx}-${qIdx}`}>
                        <td><span className="hod-sub">{q.num ?? "-"}</span></td>
                        <td><span className="hod-sub">{s.name || `Section ${secIdx + 1}`}</span></td>
                        <td><strong>{q.text || q.question || "—"}</strong></td>
                        <td><span className="hod-sub">{q.marks ?? 1}</span></td>
                        <td><span className="status-badge status-active">{q.answer || "—"}</span></td>
                        <td className="hod-actions-cell">
                          <div className="hod-actions-cell">
                            <button
                              className="inst-btn inst-btn-small"
                              onClick={() => openEditQuestion(secIdx, qIdx)}
                            >
                              <Pencil size={13} /> Edit
                            </button>
                            <button
                              className="inst-btn inst-btn-small inst-btn-danger"
                              onClick={() => deletePaperQuestion(secIdx, qIdx)}
                            >
                              <Trash2 size={13} /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Add / edit question dialog */}
          {editor && (
            <div className="inst-modal-overlay" onClick={() => setEditor(null)}>
              <div className="inst-modal" onClick={(e) => e.stopPropagation()}>
                <h2>{editor.mode === "add" ? "Add Question" : "Edit Question"}</h2>
                <p>
                  {editor.mode === "add"
                    ? `Adding to ${(editor.sectionNames || [])[editor.form.sectionIdx] || "the paper"}.`
                    : "Update the question, its options, answer or marks."}
                </p>

                <form onSubmit={submitEditor}>
                  {editor.mode === "add" && (
                    <div className="inst-form-group" style={{ marginTop: 14 }}>
                      <label>Section</label>
                      <select
                        className="inst-select"
                        value={editor.form.sectionIdx}
                        onChange={(e) => {
                          const idx = Number(e.target.value);
                          const sample = currentPaper().sections[idx]?.questions?.[0];
                          patchForm({
                            sectionIdx: idx,
                            ...(sample
                              ? { marks: sample.marks ?? 1, type: sample.type || "mcq" }
                              : {}),
                          });
                        }}
                      >
                        {(editor.sectionNames || []).map((name, i) => (
                          <option key={i} value={i}>{name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="inst-form-group">
                    <label>Question *</label>
                    <textarea
                      className="inst-textarea"
                      rows={3}
                      value={editor.form.text}
                      onChange={(e) => patchForm({ text: e.target.value })}
                      placeholder="e.g. What is an array in java?"
                      required
                    />
                  </div>

                  <div className="inst-form-row" style={{ display: "flex", gap: 14 }}>
                    <div className="inst-form-group" style={{ flex: 1 }}>
                      <label>Option A{editorIsMcq ? " *" : ""}</label>
                      <input
                        className="inst-input"
                        value={editor.form.options[0]}
                        onChange={(e) => patchForm({ options: editor.form.options.map((o, i) => (i === 0 ? e.target.value : o)) })}
                        required={editorIsMcq}
                      />
                    </div>
                    <div className="inst-form-group" style={{ flex: 1 }}>
                      <label>Option B{editorIsMcq ? " *" : ""}</label>
                      <input
                        className="inst-input"
                        value={editor.form.options[1]}
                        onChange={(e) => patchForm({ options: editor.form.options.map((o, i) => (i === 1 ? e.target.value : o)) })}
                        required={editorIsMcq}
                      />
                    </div>
                  </div>

                  <div className="inst-form-row" style={{ display: "flex", gap: 14 }}>
                    <div className="inst-form-group" style={{ flex: 1 }}>
                      <label>Option C</label>
                      <input
                        className="inst-input"
                        value={editor.form.options[2]}
                        onChange={(e) => patchForm({ options: editor.form.options.map((o, i) => (i === 2 ? e.target.value : o)) })}
                      />
                    </div>
                    <div className="inst-form-group" style={{ flex: 1 }}>
                      <label>Option D</label>
                      <input
                        className="inst-input"
                        value={editor.form.options[3]}
                        onChange={(e) => patchForm({ options: editor.form.options.map((o, i) => (i === 3 ? e.target.value : o)) })}
                      />
                    </div>
                  </div>

                  <div className="inst-form-row" style={{ display: "flex", gap: 14 }}>
                    <div className="inst-form-group" style={{ flex: 1 }}>
                      <label>Correct answer</label>
                      <select
                        className="inst-select"
                        value={editor.form.answer}
                        onChange={(e) => patchForm({ answer: e.target.value })}
                      >
                        <option value="">— (no answer)</option>
                        {editor.form.options.map((opt, i) => (
                          <option key={i} value={String.fromCharCode(65 + i)}>
                            {String.fromCharCode(65 + i)} — {opt || "(empty)"}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="inst-form-group" style={{ flex: 1 }}>
                      <label>Marks</label>
                      <input
                        className="inst-input"
                        type="number"
                        min="1"
                        value={editor.form.marks}
                        onChange={(e) => patchForm({ marks: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="inst-modal-actions">
                    <button
                      type="button"
                      className="inst-btn inst-btn-secondary"
                      onClick={() => setEditor(null)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="inst-btn inst-btn-primary">
                      <Save size={15} /> {editor.mode === "add" ? "Add Question" : "Save Changes"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ---- question paper helpers -------------------------------------------

/** Parse the AI-generated question paper JSON, tolerating bad payloads. */
function parsePaper(raw) {
  if (!raw) return null;
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

/** Flatten every section of a paper into one question list. */
function questionsOf(paper) {
  if (!paper) return [];
  if (Array.isArray(paper.questions)) return paper.questions;
  if (!Array.isArray(paper.sections)) return [];
  return paper.sections.flatMap((s) =>
    Array.isArray(s?.questions)
      ? s.questions.map((q) => ({ ...q, marks: q.marks ?? s.marksPerQuestion }))
      : []
  );
}

/** Deep copy a parsed paper so we never mutate React state directly. */
function clonePaper(p) {
  return JSON.parse(JSON.stringify(p));
}

/** Fresh, empty paper for an exam that has none yet. */
function emptyPaper(exam) {
  return {
    title: exam?.title || "Question Paper",
    sections: [{ name: "Section A", instructions: "", questions: [] }],
  };
}

/** Guarantee the sections/questions shape (legacy papers stored top-level questions). */
function ensureSections(p) {
  if (!Array.isArray(p.sections)) {
    p.sections = Array.isArray(p.questions) && p.questions.length
      ? [{ name: "Section A", instructions: "", questions: p.questions }]
      : [];
    delete p.questions;
  }
  if (p.sections.length === 0) {
    p.sections.push({ name: "Section A", instructions: "", questions: [] });
  }
  for (const s of p.sections) {
    if (!Array.isArray(s.questions)) s.questions = [];
  }
  return p;
}

/** Renumber questions and recompute section/paper totals after an edit. */
function normalizePaper(p) {
  ensureSections(p);
  let num = 0;
  let paperMarks = 0;
  for (const s of p.sections) {
    let sectionMarks = 0;
    for (const q of s.questions) {
      num += 1;
      q.num = num;
      q.marks = Number(q.marks) || 1;
      sectionMarks += q.marks;
    }
    s.total = sectionMarks;
    paperMarks += sectionMarks;
  }
  p.totalQuestions = num;
  p.totalMarks = paperMarks;
  return p;
}
