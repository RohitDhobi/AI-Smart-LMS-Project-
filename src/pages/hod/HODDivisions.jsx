// =====================================================
// HOD DIVISIONS / SECTIONS (e.g. BCA Div A, B, C)
//
// Routes (see App.jsx):
//   /hod/divisions                -> list (all courses)
//   /hod/courses/:id/divisions    -> list (one course, mode="course")
//   /hod/divisions/new            -> create form
//   /hod/divisions/:id            -> edit form
//   /hod/divisions/:id/students   -> student allocator
// =====================================================

import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { api } from "../../api";
import {
  Layers,
  Plus,
  Trash2,
  Edit3,
  Users,
  ChevronLeft,
  Search,
} from "lucide-react";

export default function HODDivisions({ mode }) {
  const { id } = useParams();
  const location = useLocation();

  // /hod/courses/:id/divisions -> id is a COURSE id
  if (mode === "course") {
    return <DivisionList courseId={id} />;
  }

  if (!id) return <DivisionList courseId={null} />;
  if (id === "new") return <DivisionForm divisionId={null} />;
  if (location.pathname.endsWith("/students")) {
    return <StudentAllocator divisionId={id} />;
  }
  return <DivisionForm divisionId={id} />;
}

// =====================================================
// LIST VIEW
// =====================================================

function courseLabel(course) {
  if (!course) return "—";
  return (
    course.courseName ||
    course.courseCode ||
    course.title ||
    `Course #${course.id}`
  );
}

function DivisionList({ courseId }) {
  const navigate = useNavigate();

  const [divisions, setDivisions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  async function load() {
    try {
      setLoading(true);
      setError("");
      const [divs, courseList] = await Promise.all([
        // deliberately not caught: a real API error has to reach the error
        // banner above the table instead of looking like "no divisions yet".
        api.hodDivisions(courseId),
        api.hodCourses().catch(() => []),
      ]);
      setDivisions(Array.isArray(divs) ? divs : []);
      setCourses(Array.isArray(courseList) ? courseList : []);
    } catch (e) {
      setError(e.message || "Unable to load divisions.");
    } finally {
      setLoading(false);
    }
  }

  const course = courseId
    ? courses.find((c) => String(c.id) === String(courseId))
    : null;

  async function handleDelete(division) {
    const label = `${division.name || "Division " + division.code}`;
    const ok = window.confirm(
      `Delete "${label}"? Students assigned to it will be unassigned. This cannot be undone.`
    );
    if (!ok) return;

    try {
      setError("");
      await api.hodDeleteDivision(division.id);
      await load();
    } catch (err) {
      setError(err.message || "Failed to delete division.");
    }
  }

  const createLink = courseId
    ? `/hod/divisions/new?courseId=${courseId}`
    : "/hod/divisions/new";

  return (
    <div className="page hod-divisions">
      <div className="page-heading">
        <h1>{course ? `${courseLabel(course)} — Divisions` : "Divisions / Sections"}</h1>
        <p>
          Create and manage divisions (Div A, Div B, ...) and allocate students
          to each class.
        </p>
      </div>

      <div className="hod-actions">
        <Link to={createLink} className="inst-btn inst-btn-primary">
          <Plus size={16} /> Create Division
        </Link>
        <button className="inst-btn inst-btn-secondary" onClick={load}>
          Refresh
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {divisions.some((d) => d.mock) && (
        <div className="notice">
          ⚠️ The backend is unreachable, so these are offline sample divisions.
          They cannot be edited or deleted until the server is back.
        </div>
      )}

      {loading ? (
        <div className="inst-loading">Loading divisions...</div>
      ) : divisions.length === 0 ? (
        <div className="card hod-empty">
          <div className="empty-icon">
            <Layers size={28} />
          </div>
          <h3>No divisions yet</h3>
          <p>Create your first division (e.g. "Division A") to start allocating students.</p>
          <Link to={createLink} className="inst-btn inst-btn-primary">
            <Plus size={16} /> Create Division
          </Link>
        </div>
      ) : (
        <div className="hod-table-wrap">
          <table className="hod-table">
            <thead>
              <tr>
                <th>Division</th>
                <th>Course</th>
                <th>Year / Sem</th>
                <th>Class In-charge</th>
                <th>Students</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {divisions.map((d) => {
                const capacity = Number(d.maxCapacity) || 60;
                const count = Number(d.studentCount) || 0;
                const pct = Math.min(100, Math.round((count / capacity) * 100));

                return (
                  <tr key={d.id}>
                    <td>
                      <strong>
                        {d.name || `Division ${d.code}`}
                      </strong>
                      {d.code && (
                        <span className="hod-sub">Code: {d.code}</span>
                      )}
                    </td>
                    <td>
                      <span className="hod-sub">{d.courseName || d.courseCode || "—"}</span>
                    </td>
                    <td>
                      <span className="hod-sub">
                        {d.academicYear || "—"}
                        {d.semester ? ` / Sem ${d.semester}` : ""}
                      </span>
                    </td>
                    <td>
                      <span className="hod-sub">{d.classTeacherName || "Not assigned"}</span>
                    </td>
                    <td>
                      <div className="hod-capacity">
                        <div className="hod-capacity-bar">
                          <div
                            className={`hod-capacity-fill${pct >= 100 ? " full" : ""}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="hod-sub">
                          {count} / {capacity}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="hod-actions-cell">
                        {d.mock ? (
                          <span className="status-badge status-pending">
                            Offline demo
                          </span>
                        ) : (
                          <>
                            <Link
                              to={`/hod/divisions/${d.id}`}
                              className="inst-btn inst-btn-small"
                            >
                              <Edit3 size={14} /> Edit
                            </Link>
                            <Link
                              to={`/hod/divisions/${d.id}/students`}
                              className="inst-btn inst-btn-small inst-btn-primary"
                            >
                              <Users size={14} /> Manage Students
                            </Link>
                            <button
                              className="inst-btn inst-btn-small danger"
                              onClick={() => handleDelete(d)}
                            >
                              <Trash2 size={14} /> Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// =====================================================
// CREATE / EDIT FORM
// =====================================================

const EMPTY_FORM = {
  name: "",
  code: "",
  courseId: "",
  academicYear: new Date().getFullYear(),
  semester: "",
  maxCapacity: 60,
  classTeacherId: "",
};

function DivisionForm({ divisionId }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isEdit = Boolean(divisionId);

  const [form, setForm] = useState(EMPTY_FORM);
  const [courses, setCourses] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  // True when an existing division could not be loaded (bad id / deleted).
  // The form must not render in that case, otherwise it silently shows stale
  // or offline sample data for a division that does not exist.
  const [loadFailed, setLoadFailed] = useState(false);

  // Preselect course when coming from "Create Division" on a course page.
  const presetCourseId = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("courseId") || "";
  }, [location.search]);

  useEffect(() => {
    if (isEdit) loadDivision();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [divisionId]);

  useEffect(() => {
    loadDropdowns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isEdit && presetCourseId) {
      setForm((f) => ({ ...f, courseId: presetCourseId }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetCourseId]);

  async function loadDivision() {
    try {
      setLoading(true);
      setError("");
      setLoadFailed(false);
      const d = await api.hodDivision(divisionId);
      setForm({
        name: d.name || "",
        code: d.code || "",
        courseId: d.courseId ?? "",
        academicYear: d.academicYear ?? new Date().getFullYear(),
        semester: d.semester ?? "",
        maxCapacity: d.maxCapacity ?? 60,
        classTeacherId: d.classTeacherId ?? "",
      });
    } catch (e) {
      setError(e.message || "Unable to load division.");
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  }

  async function loadDropdowns() {
    const [courseList, staff] = await Promise.all([
      api.hodCourses().catch(() => []),
      api.hodInstructors().catch(() => []),
    ]);
    setCourses(Array.isArray(courseList) ? courseList : []);
    setInstructors(Array.isArray(staff) ? staff : []);
  }

  function setField(name, value) {
    setForm((f) => ({ ...f, [name]: value }));
  }

  const backTo = form.courseId
    ? `/hod/courses/${form.courseId}/divisions`
    : "/hod/divisions";

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.name.trim()) {
      setError("Division name is required.");
      return;
    }
    if (!form.code.trim()) {
      setError("Division code (A, B, C ...) is required.");
      return;
    }
    if (!form.courseId) {
      setError("Pick the course this division belongs to.");
      return;
    }

    const body = {
      name: form.name.trim(),
      code: form.code.trim(),
      courseId: Number(form.courseId),
      academicYear: form.academicYear ? Number(form.academicYear) : null,
      semester: form.semester ? Number(form.semester) : null,
      maxCapacity: Number(form.maxCapacity) || 60,
      classTeacherId: form.classTeacherId
        ? Number(form.classTeacherId)
        : null,
    };

    try {
      setSaving(true);
      setError("");

      if (isEdit) {
        await api.hodUpdateDivision(divisionId, body);
      } else {
        await api.hodCreateDivision(body);
      }

      navigate(`/hod/courses/${body.courseId}/divisions`);
    } catch (err) {
      setError(
        err.message ||
          (isEdit ? "Failed to update division." : "Failed to create division.")
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="page hod-divisions">
        <div className="inst-loading">Loading division...</div>
      </div>
    );
  }

  if (isEdit && loadFailed) {
    return (
      <div className="page hod-divisions">
        <div className="page-heading">
          <button
            className="back-link"
            onClick={() => navigate("/hod/divisions")}
          >
            <ChevronLeft size={14} /> Back to Divisions
          </button>
          <h1>Division not found</h1>
          <p>
            We could not load division #{divisionId}. It may have been deleted,
            or the link points at an id that never existed.
          </p>
        </div>

        {error && <div className="error">{error}</div>}

        <div className="inst-empty">
          <div className="inst-empty-icon">🔍</div>
          <h3>There is nothing to edit</h3>
          <button
            className="inst-btn inst-btn-secondary"
            onClick={() => navigate("/hod/divisions")}
          >
            ← Back to Divisions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page hod-divisions">
      <div className="page-heading">
        <button className="back-link" onClick={() => navigate(backTo)}>
          <ChevronLeft size={14} /> Back to Divisions
        </button>
        <h1>{isEdit ? "Edit Division" : "Create Division"}</h1>
        <p>
          {isEdit
            ? "Update the division details, capacity, or class in-charge."
            : "Add a new division (e.g. Division A) to a course and assign a class in-charge."}
        </p>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="card">
        <form className="inst-form" onSubmit={handleSubmit}>
          <div className="inst-form-row">
            <div className="inst-form-group">
              <label>Division Name *</label>
              <input
                className="inst-input"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                placeholder="e.g. Division A"
                required
              />
            </div>
            <div className="inst-form-group">
              <label>Code *</label>
              <input
                className="inst-input"
                value={form.code}
                onChange={(e) => setField("code", e.target.value)}
                placeholder="e.g. A"
                maxLength={8}
                required
              />
            </div>
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
                  {courseLabel(c)}
                </option>
              ))}
            </select>
          </div>

          <div className="inst-form-row">
            <div className="inst-form-group">
              <label>Academic Year</label>
              <input
                className="inst-input"
                type="number"
                min={2000}
                max={2100}
                value={form.academicYear}
                onChange={(e) => setField("academicYear", e.target.value)}
              />
            </div>
            <div className="inst-form-group">
              <label>Semester</label>
              <select
                className="inst-select"
                value={form.semester}
                onChange={(e) => setField("semester", e.target.value)}
              >
                <option value="">Any / All</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <option key={n} value={n}>
                    Semester {n}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="inst-form-row">
            <div className="inst-form-group">
              <label>Max Capacity</label>
              <input
                className="inst-input"
                type="number"
                min={1}
                value={form.maxCapacity}
                onChange={(e) => setField("maxCapacity", e.target.value)}
              />
            </div>
            <div className="inst-form-group">
              <label>Faculty In-Charge</label>
              <select
                className="inst-select"
                value={form.classTeacherId}
                onChange={(e) => setField("classTeacherId", e.target.value)}
              >
                <option value="">Not assigned</option>
                {instructors.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name || t.email}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="inst-modal-actions">
            <button
              type="button"
              className="inst-btn inst-btn-secondary"
              onClick={() => navigate(backTo)}
            >
              Cancel
            </button>
            <button type="submit" className="inst-btn inst-btn-primary" disabled={saving}>
              {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Division"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =====================================================
// STUDENT ALLOCATOR (/hod/divisions/:id/students)
// =====================================================

function StudentAllocator({ divisionId }) {
  const navigate = useNavigate();

  const [division, setDivision] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loadFailed, setLoadFailed] = useState(false);
  const [notice, setNotice] = useState("");
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState({}); // { studentId: true }
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [divisionId]);

  async function load() {
    try {
      setLoading(true);
      setError("");
      setLoadFailed(false);
      const [div, list] = await Promise.all([
        api.hodDivision(divisionId),
        api.hodStudents().catch(() => []),
      ]);
      setDivision(div);
      setStudents(Array.isArray(list) ? list : []);
    } catch (e) {
      setError(e.message || "Unable to load division.");
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  }

  const courseStudents = useMemo(() => {
    if (!division) return [];
    return students.filter(
      (s) => division.courseId == null || String(s.courseId) === String(division.courseId)
    );
  }, [students, division]);

  const assigned = useMemo(
    () => courseStudents.filter((s) => String(s.divisionId) === String(divisionId)),
    [courseStudents, divisionId]
  );

  const unassigned = useMemo(
    () => courseStudents.filter((s) => !s.divisionId),
    [courseStudents]
  );

  const visible = (list) => {
    const q = filter.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (s) =>
        (s.name || "").toLowerCase().includes(q) ||
        (s.email || "").toLowerCase().includes(q)
    );
  };

  function toggle(id) {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else next[id] = true;
      return next;
    });
  }

  function toggleAll(list) {
    setSelected((prev) => {
      const next = { ...prev };
      const allOn = list.every((s) => next[s.id]);
      list.forEach((s) => {
        if (allOn) delete next[s.id];
        else next[s.id] = true;
      });
      return next;
    });
  }

  const selectedIds = Object.keys(selected).map(Number);

  async function handleAssign() {
    if (selectedIds.length === 0) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const res = await api.hodAssignStudentsToDivision(divisionId, selectedIds);
      const skipped = Array.isArray(res?.skipped) ? res.skipped : [];
      setNotice(
        `Assigned ${res?.assigned ?? 0} student(s).` +
          (skipped.length ? ` Skipped: ${skipped.join("; ")}` : "")
      );
      setSelected({});
      await load();
    } catch (err) {
      setError(err.message || "Failed to assign students.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove() {
    if (selectedIds.length === 0) return;
    const ok = window.confirm(
      `Remove ${selectedIds.length} student(s) from this division?`
    );
    if (!ok) return;

    setBusy(true);
    setError("");
    setNotice("");
    try {
      const res = await api.hodRemoveStudentsFromDivision(divisionId, selectedIds);
      setNotice(`Removed ${res?.removed ?? 0} student(s).`);
      setSelected({});
      await load();
    } catch (err) {
      setError(err.message || "Failed to remove students.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="page hod-divisions">
        <div className="inst-loading">Loading students...</div>
      </div>
    );
  }

  if (loadFailed && !division) {
    return (
      <div className="page hod-divisions">
        <div className="page-heading">
          <button
            className="back-link"
            onClick={() => navigate("/hod/divisions")}
          >
            <ChevronLeft size={14} /> Back to Divisions
          </button>
          <h1>Division not found</h1>
          <p>
            Students cannot be allocated because division #{divisionId} does not
            exist (it may have been deleted).
          </p>
        </div>

        {error && <div className="error">{error}</div>}

        <div className="inst-empty">
          <div className="inst-empty-icon">🔍</div>
          <h3>Nothing to manage here</h3>
          <button
            className="inst-btn inst-btn-secondary"
            onClick={() => navigate("/hod/divisions")}
          >
            ← Back to Divisions
          </button>
        </div>
      </div>
    );
  }

  const capacity = Number(division?.maxCapacity) || 60;
  const count = Number(division?.studentCount) || assigned.length;
  const full = count >= capacity;

  return (
    <div className="page hod-divisions">
      <div className="page-heading">
        <button
          className="back-link"
          onClick={() =>
            navigate(
              division?.courseId
                ? `/hod/courses/${division.courseId}/divisions`
                : "/hod/divisions"
            )
          }
        >
          <ChevronLeft size={14} /> Back to Divisions
        </button>
        <h1>
          Manage Students — {division?.name || `Division ${division?.code || ""}`}
        </h1>
        <p>
          {division?.courseName || "Course"} · {count} / {capacity} students
          {full ? " (full)" : ""}
        </p>
      </div>

      {error && <div className="error">{error}</div>}
      {notice && <div className="hod-notice">{notice}</div>}

      <div className="hod-actions">
        <div className="hod-student-filter">
          <Search size={14} />
          <input
            className="inst-input"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter by name or email..."
          />
        </div>
      </div>

      <div className="hod-division-columns">
        {/* -------- UNASSIGNED -------- */}
        <div className="card">
          <div className="hod-division-col-head">
            <h3>Unassigned students</h3>
            <span className="hod-sub">{visible(unassigned).length}</span>
          </div>

          {visible(unassigned).length === 0 ? (
            <p className="hod-sub">No unassigned students in this course.</p>
          ) : (
            <>
              <div className="hod-student-pick-head">
                <label>
                  <input
                    type="checkbox"
                    checked={
                      visible(unassigned).length > 0 &&
                      visible(unassigned).every((s) => selected[s.id])
                    }
                    onChange={() => toggleAll(visible(unassigned))}
                  />
                  Select all
                </label>
                <button
                  className="inst-btn inst-btn-small inst-btn-primary"
                  onClick={handleAssign}
                  disabled={busy || selectedIds.length === 0 || full}
                  title={full ? "Division is at full capacity" : undefined}
                >
                  <Plus size={14} /> Assign selected
                </button>
              </div>

              <div className="hod-student-pick-list">
                {visible(unassigned).map((s) => (
                  <label key={s.id} className="hod-student-row">
                    <input
                      type="checkbox"
                      checked={Boolean(selected[s.id])}
                      onChange={() => toggle(s.id)}
                    />
                    <span className="hod-student-name">{s.name}</span>
                    <span className="hod-sub">{s.email}</span>
                  </label>
                ))}
              </div>
            </>
          )}
        </div>

        {/* -------- ASSIGNED -------- */}
        <div className="card">
          <div className="hod-division-col-head">
            <h3>
              {division?.name || "This division"}
            </h3>
            <span className="hod-sub">
              {count} / {capacity}
            </span>
          </div>

          {visible(assigned).length === 0 ? (
            <p className="hod-sub">No students assigned yet.</p>
          ) : (
            <>
              <div className="hod-student-pick-head">
                <label>
                  <input
                    type="checkbox"
                    checked={
                      visible(assigned).length > 0 &&
                      visible(assigned).every((s) => selected[s.id])
                    }
                    onChange={() => toggleAll(visible(assigned))}
                  />
                  Select all
                </label>
                <button
                  className="inst-btn inst-btn-small danger"
                  onClick={handleRemove}
                  disabled={busy || selectedIds.length === 0}
                >
                  <Trash2 size={14} /> Remove selected
                </button>
              </div>

              <div className="hod-student-pick-list">
                {visible(assigned).map((s) => (
                  <label key={s.id} className="hod-student-row">
                    <input
                      type="checkbox"
                      checked={Boolean(selected[s.id])}
                      onChange={() => toggle(s.id)}
                    />
                    <span className="hod-student-name">{s.name}</span>
                    <span className="hod-sub">{s.email}</span>
                  </label>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
