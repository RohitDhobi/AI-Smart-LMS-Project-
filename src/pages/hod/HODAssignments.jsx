import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";
import {
  Users, Pencil, Trash2, PlusCircle, RefreshCw, Search, X
} from "lucide-react";

/**
 * HOD - Instructor Assignment (spec section 3)
 *
 * Table:  Subject/Course | Assigned Instructor | Status | Action
 *
 * Backed by the real /api/hod/* endpoints. The backend independently
 * enforces these assignments with HTTP 403, so hiding buttons here is a
 * convenience only - never the security boundary.
 */
export default function HODAssignments() {
  const [rows, setRows] = useState([]);            // subject-level rows
  const [instructors, setInstructors] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");

  // Modal state: { mode: "assign" | "change", row }
  const [modal, setModal] = useState(null);
  const [selectedInstructor, setSelectedInstructor] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    try {
      setLoading(true);
      setError("");
      setNotice("");

      const [subjectList, instructorList, courseList] = await Promise.all([
        api.hodSubjects().catch(() => []),
        api.hodInstructors().catch(() => []),
        api.hodCourses().catch(() => []),
      ]);

      setRows(Array.isArray(subjectList) ? subjectList : []);
      setInstructors(Array.isArray(instructorList) ? instructorList : []);
      setCourses(Array.isArray(courseList) ? courseList : []);

    } catch (e) {
      setError(e.message || "Unable to load assignments.");
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        (r.subjectName || "").toLowerCase().includes(q) ||
        (r.courseName || "").toLowerCase().includes(q) ||
        (r.assignedInstructor || "").toLowerCase().includes(q)
    );
  }, [rows, search]);

  function openAssign(row) {
    setModal({ mode: "assign", row });
    setSelectedInstructor("");
  }

  function openChange(row) {
    setModal({ mode: "change", row });
    setSelectedInstructor(row.assignedInstructorId ? String(row.assignedInstructorId) : "");
  }

  function closeModal() {
    setModal(null);
    setSelectedInstructor("");
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!modal) return;
    if (!selectedInstructor) {
      setError("Select an instructor first.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const body = {
        instructorId: Number(selectedInstructor),
        courseId: modal.row.courseId,
        subjectId: modal.row.id,
      };

      if (modal.mode === "assign") {
        await api.hodCreateAssignment(body);
        setNotice(`Assigned ${modal.row.subjectName} successfully.`);
      } else {
        // Reuse the existing row when it already exists for this subject.
        const existing = await findExistingAssignment(modal.row);
        if (existing) {
          await api.hodUpdateAssignment(existing.id, body);
        } else {
          await api.hodCreateAssignment(body);
        }
        setNotice(`Updated instructor for ${modal.row.subjectName}.`);
      }

      closeModal();
      await loadAll();

    } catch (err) {
      setError(err.message || "Failed to save assignment.");
    } finally {
      setSaving(false);
    }
  }

  async function findExistingAssignment(row) {
    const all = await api.hodAssignments().catch(() => []);
    if (!Array.isArray(all)) return null;
    return (
      all.find((a) => Number(a.subjectId) === Number(row.id)) ||
      all.find(
        (a) =>
          Number(a.courseId) === Number(row.courseId) &&
          !a.subjectId
      ) ||
      null
    );
  }

  async function handleRemove(row) {
    const who = row.assignedInstructor || "this instructor";
    const ok = window.confirm(
      `Remove ${who} from "${row.subjectName}"?\n\nThey will no longer be able to manage this subject.`
    );
    if (!ok) return;

    try {
      setError("");
      const existing = await findExistingAssignment(row);

      if (existing) {
        await api.hodRemoveAssignmentById(existing.id);
      } else if (row.assignedInstructorId) {
        await api.hodRemoveAssignment(row.assignedInstructorId, row.id);
      } else {
        return;
      }

      setNotice(`Removed ${who} from ${row.subjectName}.`);
      await loadAll();
    } catch (err) {
      setError(err.message || "Failed to remove assignment.");
    }
  }

  return (
    <div className="page hod-assignments">
      <div className="page-heading">
        <h1>Instructor Assignment</h1>
        <p>Assign instructors to courses/subjects and manage their access.</p>
      </div>

      {/* Filters */}
      <div className="hod-filters">
        <input
          className="hod-input"
          placeholder="🔍 Search by subject, course or instructor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Action Buttons */}
      <div className="hod-actions">
        <button className="inst-btn inst-btn-primary" onClick={loadAll}>
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
          <p>Subjects will appear here once courses are created.</p>
        </div>
      ) : (
        <div className="hod-table-wrap">
          <table className="hod-table">
            <thead>
              <tr>
                <th>Subject / Course</th>
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
                      <span className="hod-sub">{row.courseName || "No course"}</span>
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
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Assign / Change modal */}
      {modal && (
        <div className="inst-modal-overlay" onClick={closeModal}>
          <div className="inst-modal" onClick={(e) => e.stopPropagation()}>
            <h2>
              {modal.mode === "assign" ? "Assign Instructor" : "Change Instructor"}
            </h2>
            <p>
              <strong>{modal.row.subjectName}</strong>
              <br />
              <span className="hod-sub" style={{ marginTop: 2 }}>
                {modal.row.courseName}
              </span>
            </p>

            <form onSubmit={handleSave}>
              <div className="inst-form-group" style={{ marginTop: 14 }}>
                <label>Instructor</label>
                <select
                  className="inst-select"
                  value={selectedInstructor}
                  onChange={(e) => setSelectedInstructor(e.target.value)}
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
                  {saving ? "Saving..." : modal.mode === "assign" ? "Assign" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
