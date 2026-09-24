import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";
import { getStoredUser } from "../../ui";
import {
  Users, Pencil, Trash2, PlusCircle, AlertCircle, Clock, CheckCircle, XCircle
} from "lucide-react";

export default function HODAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState(null); // single assignment detail
  const [editOpen, setEditOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);

  useEffect(() => { loadAssignments(); }, []);

  async function loadAssignments() {
    try {
      setLoading(true);
      setError("");
      const data = await api.hodAssignments().catch(() => []);
      setAssignments(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Unable to load assignments.");
    } finally {
      setLoading(false);
    }
  }

  const handleEdit = (a) => setView(a);
  const handleCloseEdit = () => setView(null);

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
          placeholder="🔍 Search by instructor or course..."
          defaultValue=""
        />
      </div>

      {/* Action Buttons */}
      <div className="hod-actions">
        <Link to="/hod/assignments/new" className="inst-btn inst-btn-primary">
          <PlusCircle size={16} /> Assign Instructor
        </Link>
        <button className="inst-btn inst-btn-secondary" onClick={loadAssignments}>
          Refresh
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {loading ? (
        <div className="inst-loading">Loading assignments...</div>
      ) : assignments.length === 0 ? (
        <div className="card hod-empty">
          <div className="empty-icon">👥</div>
          <h3>No instructor assignments yet</h3>
          <p>Assign instructors to courses/subjects to grant them access.</p>
          <Link to="/hod/assignments/new" className="inst-btn primary">
            <PlusCircle size={16} /> Assign Instructor
          </Link>
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
              {assignments.map((a) => (
                <tr key={a.id}>
                  <td>
                    <strong>{a.courseName || a.subjectName || "Unnamed"}</strong>
                    {a.subjectName && <span className="hod-sub">{a.subjectName}</span>}
                  </td>
                  <td>
                    {a.instructorName ? (
                      <span>
                        {a.instructorName}
                        {a.instructorEmail && <span className="hod-sub">{a.instructorEmail}</span>}
                      </span>
                    ) : (
                      <span className="hod-sub">Instructor removed</span>
                    )}
                  </td>
                  <td>
                    <span className={`status-badge status-${a.status?.toLowerCase() || "active"}`}>
                      {a.status || "ACTIVE"}
                    </span>
                  </td>
                  <td className="hod-actions-cell">
                    {a.status === "ACTIVE" ? (
                      <>
                        <button
                          className="inst-btn inst-btn-small"
                          onClick={() => handleEdit(a)}
                        >
                          <Pencil size={14} /> Change
                        </button>
                        <button
                          className="inst-btn inst-btn-small danger"
                          onClick={() => {}}
                        >
                          <Trash2 size={14} /> Remove
                        </button>
                      </>
                    ) : (
                      <span className="status-badge status-active">Re-activate</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Single Assignment Editor */}
      {view && (
        <div className="card hod-assign-edit">
          <div className="card-header">
            <h2>✏️ Edit Assignment</h2>
            <button className="card-link" onClick={handleCloseEdit}>✕</button>
          </div>
          <div className="hod-form">
            <div className="hod-form-row">
              <label>Instructor</label>
              <select className="hod-input">
                <option>Dr. Priya Sharma</option>
                <option>Dr. Amit Patel</option>
              </select>
            </div>
            <div className="hod-form-row">
              <label>Course / Subject</label>
              <select className="hod-input">
                <option>Java Programming</option>
                <option>Python</option>
                <option>DBMS</option>
              </select>
            </div>
            <div className="hod-form-row">
              <label>Status</label>
              <select className="hod-input">
                <option value="ACTIVE">Active</option>
                <option value="REMOVED">Removed</option>
              </select>
            </div>
            <div className="hod-form-actions">
              <button className="inst-btn" onClick={handleCloseEdit}>Save</button>
              <button className="inst-btn inst-btn-secondary" onClick={handleCloseEdit}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
