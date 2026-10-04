import React, { useEffect, useMemo, useState } from "react";
import { api } from "../../api";
import { Pencil, Trash2, PlusCircle, RefreshCw, X } from "lucide-react";

/**
 * HOD - Instructor Assignment (spec section 3)
 *
 * Table:  Subject | Course | Semester | Academic Year | Assigned Instructor | Status | Action
 *
 * Filters: free-text search + Course / Semester / Academic Year / Instructor
 * dropdowns. The assignment form lets the HOD pick
 * Course + Semester + Academic Year + Subject + Instructor.
 *
 * Backed by the real /api/hod/* endpoints. The backend independently
 * enforces these assignments with HTTP 403, so hiding buttons here is a
 * convenience only - never the security boundary.
 */
export default function HODAssignments() {
  const [rows, setRows] = useState([]);            // subject-level rows
  const [instructors, setInstructors] = useState([]);
  const [courses, setCourses] = useState([]);
  const [semesters, setSemesters] = useState([]);  // {id, semesterNumber, courseId}
  const [years, setYears] = useState([]);          // {id, yearName, active}
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");

  // Search filters: Course / Semester / Academic Year / Instructor
  const [filters, setFilters] = useState({
    courseId: "",
    semester: "",
    academicYearId: "",
    instructorId: "",
  });

  // Modal state: { mode: "assign" | "change" | "create", row? }
  const [modal, setModal] = useState(null);

  // Shared assignment form state
  const [form, setForm] = useState({
    instructorId: "",
    courseId: "",
    subjectId: "",
    semesterId: "",
    academicYearId: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    try {
      setLoading(true);
      setError("");
      setNotice("");

      const [subjectList, instructorList, courseList, semesterList, yearList] =
        await Promise.all([
          api.hodSubjects().catch(() => []),
          api.hodInstructors().catch(() => []),
          api.hodCourses().catch(() => []),
          api.hodSemesters().catch(() => []),
          api.hodAcademicYears().catch(() => []),
        ]);

      setRows(Array.isArray(subjectList) ? subjectList : []);
      setInstructors(Array.isArray(instructorList) ? instructorList : []);
      setCourses(Array.isArray(courseList) ? courseList : []);
      setSemesters(Array.isArray(semesterList) ? semesterList : []);
      setYears(Array.isArray(yearList) ? yearList : []);

    } catch (e) {
      setError(e.message || "Unable to load assignments.");
    } finally {
      setLoading(false);
    }
  }

  // ---------------------------------------------------------------
  // Filters
  // ---------------------------------------------------------------

  const semesterOptions = useMemo(() => {
    const numbers = [
      ...new Set(rows.map((r) => Number(r.semester)).filter((n) => n > 0)),
    ];
    return numbers.sort((a, b) => a - b);
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return rows.filter((r) => {
      if (filters.courseId && Number(r.courseId) !== Number(filters.courseId)) {
        return false;
      }
      if (filters.semester && Number(r.semester) !== Number(filters.semester)) {
        return false;
      }
      if (
        filters.academicYearId &&
        Number(r.academicYearId) !== Number(filters.academicYearId)
      ) {
        return false;
      }
      if (
        filters.instructorId &&
        Number(r.assignedInstructorId) !== Number(filters.instructorId)
      ) {
        return false;
      }
      if (!q) return true;

      return (
        (r.subjectName || "").toLowerCase().includes(q) ||
        (r.courseName || "").toLowerCase().includes(q) ||
        (r.assignedInstructor || "").toLowerCase().includes(q) ||
        (r.academicYear || "").toLowerCase().includes(q) ||
        (r.semester ? `sem ${r.semester}`.includes(q) : false)
      );
    });
  }, [rows, search, filters]);

  const hasFilters =
    Boolean(search.trim()) ||
    Boolean(
      filters.courseId ||
        filters.semester ||
        filters.academicYearId ||
        filters.instructorId
    );

  function clearFilters() {
    setSearch("");
    setFilters({ courseId: "", semester: "", academicYearId: "", instructorId: "" });
  }

  // ---------------------------------------------------------------
  // Assignment form helpers
  // ---------------------------------------------------------------

  function semestersForCourse(courseId) {
    if (!courseId) return semesters;
    return semesters.filter((s) => Number(s.courseId) === Number(courseId));
  }

  function semesterIdFor(row) {
    if (row.assignmentSemesterId) return String(row.assignmentSemesterId);
    const match = semesters.find(
      (s) =>
        Number(s.courseId) === Number(row.courseId) &&
        Number(s.semesterNumber) === Number(row.semester)
    );
    return match ? String(match.id) : "";
  }

  const activeYearId = () => {
    const active = years.find((y) => y.active);
    return active ? String(active.id) : "";
  };

  function openAssign(row) {
    setModal({ mode: "assign", row });
    setForm({
      instructorId: "",
      courseId: String(row.courseId ?? ""),
      subjectId: String(row.id),
      semesterId: semesterIdFor(row),
      academicYearId: row.academicYearId
        ? String(row.academicYearId)
        : activeYearId(),
    });
  }

  function openChange(row) {
    setModal({ mode: "change", row });
    setForm({
      instructorId: row.assignedInstructorId
        ? String(row.assignedInstructorId)
        : "",
      courseId: String(row.courseId ?? ""),
      subjectId: String(row.id),
      semesterId: semesterIdFor(row),
      academicYearId: row.academicYearId
        ? String(row.academicYearId)
        : activeYearId(),
    });
  }

  function openCreate() {
    setModal({ mode: "create" });
    setForm({
      instructorId: "",
      courseId: "",
      subjectId: "",
      semesterId: "",
      academicYearId: activeYearId(),
    });
  }

  function closeModal() {
    setModal(null);
    setForm({ instructorId: "", courseId: "", subjectId: "", semesterId: "", academicYearId: "" });
  }

  function setField(name, value) {
    setForm((f) => {
      const next = { ...f, [name]: value };

      // Cascading resets: picking a course/semester re-scopes subject + semester.
      if (name === "courseId") {
        if (f.semesterId) next.semesterId = "";
        next.subjectId = "";
      }
      if (name === "semesterId" && modal && modal.mode === "create") {
        next.subjectId = "";
      }

      return next;
    });
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!modal) return;

    const isCreate = modal.mode === "create";

    if (!form.instructorId) {
      setError("Select an instructor first.");
      return;
    }

    const courseId = isCreate ? form.courseId : modal.row.courseId;
    const subjectId = isCreate ? form.subjectId : modal.row.id;

    if (!courseId) {
      setError("Select a course first.");
      return;
    }
    if (!subjectId) {
      setError("Select a subject first.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const body = {
        instructorId: Number(form.instructorId),
        courseId: Number(courseId),
        subjectId: Number(subjectId),
        semesterId: form.semesterId ? Number(form.semesterId) : null,
        academicYearId: form.academicYearId ? Number(form.academicYearId) : null,
      };

      const instructorName =
        instructors.find((i) => Number(i.id) === body.instructorId)?.name ||
        "That instructor";

      let savedMsg = "";

      if (isCreate) {
        await api.hodCreateAssignment(body);
        const subject = rows.find((r) => Number(r.id) === body.subjectId);
        savedMsg = `Assigned ${instructorName} to ${
          subject?.subjectName || "the subject"
        }.`;
      } else if (modal.mode === "assign") {
        await api.hodCreateAssignment(body);
        savedMsg = `Assigned ${modal.row.subjectName} successfully.`;
      } else {
        const list = await fetchAssignments();
        const subjectRow = findSubjectRow(list, modal.row);
        const courseRow = findCourseRow(list, modal.row);

        if (subjectRow && Number(subjectRow.instructorId) === body.instructorId) {
          savedMsg = `${instructorName} is already assigned to ${modal.row.subjectName}.`;
        } else if (subjectRow) {
          // Subject-level row exists: swap the instructor on that row.
          await api.hodUpdateAssignment(subjectRow.id, body);
          savedMsg = `Updated instructor for ${modal.row.subjectName}.`;
        } else if (courseRow && Number(courseRow.instructorId) === body.instructorId) {
          savedMsg = `${instructorName} is already assigned to ${modal.row.subjectName}.`;
        } else {
          // No subject-level row yet (or only a course-wide one): create a row
          // scoped to THIS subject so every other subject of the course keeps
          // its current instructor.
          await api.hodCreateAssignment(body);
          savedMsg = `Updated instructor for ${modal.row.subjectName}.`;
        }
      }

      closeModal();
      await loadAll();
      // loadAll() clears the notice, so show the confirmation afterwards.
      setNotice(savedMsg);

    } catch (err) {
      setError(err.message || "Failed to save assignment.");
    } finally {
      setSaving(false);
    }
  }

  async function fetchAssignments() {
    const all = await api.hodAssignments().catch(() => []);
    return Array.isArray(all) ? all : [];
  }

  // Assignment row that belongs to exactly this subject.
  function findSubjectRow(list, row) {
    return (
      list.find(
        (a) => a.subjectId != null && Number(a.subjectId) === Number(row.id)
      ) || null
    );
  }

  // Course-wide row that covers this subject (subjectId empty).
  function findCourseRow(list, row) {
    return (
      list.find(
        (a) =>
          (a.subjectId == null || Number(a.subjectId) === 0) &&
          Number(a.courseId) === Number(row.courseId)
      ) || null
    );
  }

  async function handleRemove(row) {
    const who = row.assignedInstructor || "this instructor";

    setError("");
    const list = await fetchAssignments();
    const subjectRow = findSubjectRow(list, row);
    const courseRow = findCourseRow(list, row);
    const target = subjectRow || courseRow;

    if (!target && !row.assignedInstructorId) return;

    const scopeNote = subjectRow
      ? `They will no longer be able to manage "${row.subjectName}".`
      : `They are only assigned course-wide, so this removes them from EVERY subject in "${row.courseName}".`;

    const ok = window.confirm(
      `Remove ${who} from "${row.subjectName}"?\n\n${scopeNote}`
    );
    if (!ok) return;

    try {
      if (target) {
        await api.hodRemoveAssignmentById(target.id);
      } else {
        await api.hodRemoveAssignment(row.assignedInstructorId, row.id);
      }

      const msg = `Removed ${who} from ${row.subjectName}.`;
      await loadAll();
      setNotice(msg);
    } catch (err) {
      setError(err.message || "Failed to remove assignment.");
    }
  }

  // ---------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------

  const createSubjects = useMemo(() => {
    if (!form.courseId) return [];
    return rows.filter(
      (r) =>
        Number(r.courseId) === Number(form.courseId) &&
        (!form.semesterId || Number(r.semester) === Number(
          semesters.find((s) => Number(s.id) === Number(form.semesterId))
            ?.semesterNumber
        ))
    );
  }, [rows, form.courseId, form.semesterId, semesters]);

  return (
    <div className="page hod-assignments">
      <div className="page-heading">
        <h1>Instructor Assignment</h1>
        <p>Assign instructors to courses/subjects and manage their access.</p>
      </div>

      {/* Filters: text search + Course / Semester / Academic Year / Instructor */}
      <div className="hod-filters">
        <input
          className="hod-input hod-filter-search"
          placeholder="🔍 Search by subject, course or instructor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="hod-input hod-filter-select"
          value={filters.courseId}
          onChange={(e) => setFilters((f) => ({ ...f, courseId: e.target.value }))}
          aria-label="Filter by course"
        >
          <option value="">All Courses</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.courseCode || c.courseName || c.title}
            </option>
          ))}
        </select>

        <select
          className="hod-input hod-filter-select"
          value={filters.semester}
          onChange={(e) => setFilters((f) => ({ ...f, semester: e.target.value }))}
          aria-label="Filter by semester"
        >
          <option value="">All Semesters</option>
          {semesterOptions.map((n) => (
            <option key={n} value={n}>
              Semester {n}
            </option>
          ))}
        </select>

        <select
          className="hod-input hod-filter-select"
          value={filters.academicYearId}
          onChange={(e) =>
            setFilters((f) => ({ ...f, academicYearId: e.target.value }))
          }
          aria-label="Filter by academic year"
        >
          <option value="">All Academic Years</option>
          {years.map((y) => (
            <option key={y.id} value={y.id}>
              {y.yearName}
            </option>
          ))}
        </select>

        <select
          className="hod-input hod-filter-select"
          value={filters.instructorId}
          onChange={(e) =>
            setFilters((f) => ({ ...f, instructorId: e.target.value }))
          }
          aria-label="Filter by instructor"
        >
          <option value="">All Instructors</option>
          {instructors.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name}
            </option>
          ))}
        </select>

        {hasFilters && (
          <button
            type="button"
            className="inst-btn inst-btn-small"
            onClick={clearFilters}
            title="Clear all filters"
          >
            <X size={13} /> Clear
          </button>
        )}
      </div>

      {/* Action Buttons */}
      <div className="hod-actions">
        <button className="inst-btn inst-btn-primary" onClick={openCreate}>
          <PlusCircle size={15} /> New Assignment
        </button>
        <button className="inst-btn inst-btn-secondary" onClick={loadAll}>
          <RefreshCw size={15} /> Refresh
        </button>
        <span className="hod-sub" style={{ marginTop: 0 }}>
          {filtered.length} subject{filtered.length === 1 ? "" : "s"} · {instructors.length} instructor
          {instructors.length === 1 ? "" : "s"}
        </span>
      </div>

      {error && <div className="error">{error}</div>}
      {notice && <div className="notice">{notice}</div>}

      {loading ? (
        <div className="inst-loading">Loading assignments...</div>
      ) : filtered.length === 0 ? (
        <div className="card hod-empty">
          <div className="empty-icon">👥</div>
          <h3>No subjects found</h3>
          <p>
            {hasFilters
              ? "No subjects match the current filters."
              : "Subjects will appear here once courses are created."}
          </p>
        </div>
      ) : (
        <div className="hod-table-wrap">
          <table className="hod-table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Course</th>
                <th>Semester</th>
                <th>Academic Year</th>
                <th>Assigned Instructor</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const assigned = Boolean(row.assignedInstructor);
                return (
                  <tr key={row.id}>
                    <td>
                      <strong>{row.subjectName || "Unnamed"}</strong>
                      {row.subjectCode && (
                        <span className="hod-sub">{row.subjectCode}</span>
                      )}
                    </td>
                    <td>
                      <span>{row.courseName || "No course"}</span>
                    </td>
                    <td>
                      {row.semester ? (
                        <span>Semester {row.semester}</span>
                      ) : (
                        <span className="hod-sub" style={{ marginTop: 0 }}>—</span>
                      )}
                    </td>
                    <td>
                      {row.academicYear ? (
                        <span>{row.academicYear}</span>
                      ) : (
                        <span className="hod-sub" style={{ marginTop: 0 }}>—</span>
                      )}
                    </td>
                    <td>
                      {assigned ? (
                        <span>{row.assignedInstructor}</span>
                      ) : (
                        <span className="hod-sub" style={{ marginTop: 0 }}>Not Assigned</span>
                      )}
                    </td>
                    <td>
                      <span className={`status-badge ${assigned ? "status-active" : ""}`}>
                        {assigned ? "Active" : "-"}
                      </span>
                    </td>
                    <td className="hod-actions-cell">
                      <div className="hod-actions-cell">
                        {assigned ? (
                          <>
                            <button
                              className="inst-btn inst-btn-small"
                              onClick={() => openChange(row)}
                            >
                              <Pencil size={13} /> Change
                            </button>
                            <button
                              className="inst-btn inst-btn-small inst-btn-danger"
                              onClick={() => handleRemove(row)}
                            >
                              <Trash2 size={13} /> Remove
                            </button>
                          </>
                        ) : (
                          <button
                            className="inst-btn inst-btn-small inst-btn-primary"
                            onClick={() => openAssign(row)}
                          >
                            <PlusCircle size={13} /> Assign
                          </button>
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

      {/* Assign / Change / Create modal */}
      {modal && (
        <div className="inst-modal-overlay" onClick={closeModal}>
          <div className="inst-modal" onClick={(e) => e.stopPropagation()}>
            <h2>
              {modal.mode === "assign"
                ? "Assign Instructor"
                : modal.mode === "change"
                ? "Change Instructor"
                : "New Assignment"}
            </h2>

            {modal.mode !== "create" ? (
              <p>
                <strong>{modal.row.subjectName}</strong>
                <br />
                <span className="hod-sub" style={{ marginTop: 2 }}>
                  {modal.row.courseName} | Sem {modal.row.semester || "?"} |{" "}
                  {modal.row.academicYear || "—"}
                </span>
              </p>
            ) : (
              <p>
                <span className="hod-sub" style={{ marginTop: 0 }}>
                  Pick a course, semester, academic year, subject and instructor.
                </span>
              </p>
            )}

            <form onSubmit={handleSave}>
              {modal.mode === "create" && (
                <>
                  <div className="inst-form-group" style={{ marginTop: 14 }}>
                    <label>Course</label>
                    <select
                      className="inst-select"
                      value={form.courseId}
                      onChange={(e) => setField("courseId", e.target.value)}
                      required
                    >
                      <option value="">Select a course...</option>
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.courseCode ? `${c.courseCode} — ` : ""}
                          {c.courseName || c.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="inst-form-group" style={{ marginTop: 14 }}>
                    <label>Semester</label>
                    <select
                      className="inst-select"
                      value={form.semesterId}
                      onChange={(e) => setField("semesterId", e.target.value)}
                    >
                      <option value="">Any semester</option>
                      {semestersForCourse(form.courseId).map((s) => (
                        <option key={s.id} value={s.id}>
                          Semester {s.semesterNumber}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {modal.mode !== "create" && (
                <div className="inst-form-group" style={{ marginTop: 14 }}>
                  <label>Semester</label>
                  <select
                    className="inst-select"
                    value={form.semesterId}
                    onChange={(e) => setField("semesterId", e.target.value)}
                  >
                    <option value="">Any semester</option>
                    {semestersForCourse(modal.row.courseId).map((s) => (
                      <option key={s.id} value={s.id}>
                        Semester {s.semesterNumber}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="inst-form-group" style={{ marginTop: 14 }}>
                <label>Academic Year</label>
                <select
                  className="inst-select"
                  value={form.academicYearId}
                  onChange={(e) => setField("academicYearId", e.target.value)}
                >
                  <option value="">Any academic year</option>
                  {years.map((y) => (
                    <option key={y.id} value={y.id}>
                      {y.yearName}
                      {y.active ? " (current)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              {modal.mode === "create" && (
                <div className="inst-form-group" style={{ marginTop: 14 }}>
                  <label>Subject</label>
                  <select
                    className="inst-select"
                    value={form.subjectId}
                    onChange={(e) => setField("subjectId", e.target.value)}
                    required
                    disabled={!form.courseId}
                  >
                    <option value="">
                      {form.courseId
                        ? "Select a subject..."
                        : "Select a course first..."}
                    </option>
                    {createSubjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.subjectName} — Sem {s.semester}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="inst-form-group" style={{ marginTop: 14 }}>
                <label>Instructor</label>
                <select
                  className="inst-select"
                  value={form.instructorId}
                  onChange={(e) => setField("instructorId", e.target.value)}
                  required
                >
                  <option value="">Select an instructor...</option>
                  {instructors.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} — {i.assignedCourses} assigned
                    </option>
                  ))}
                </select>
              </div>

              <div className="inst-modal-actions">
                <button
                  type="button"
                  className="inst-btn inst-btn-secondary"
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inst-btn inst-btn-primary"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : modal.mode === "change"
                    ? "Save Changes"
                    : "Assign"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
