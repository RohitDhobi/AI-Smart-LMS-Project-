import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";
import { getStoredUser } from "../../ui";
import { Users, GraduationCap, Mail, Phone, ChevronRight } from "lucide-react";

export default function HODStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => { loadStudents(); }, []);

  async function loadStudents() {
    try {
      setLoading(true);
      setError("");
      const data = await api.hodStudents().catch(() => []);
      setStudents(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Unable to load students.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page hod-students">
      <div className="page-heading">
        <h1>Students</h1>
        <p>Browse all enrolled students and their course assignments.</p>
      </div>

      <div className="hod-actions">
        <button className="inst-btn inst-btn-secondary" onClick={loadStudents}>Refresh</button>
      </div>

      {error && <div className="error">{error}</div>}

      {loading ? (
        <div className="inst-loading">Loading students...</div>
      ) : students.length === 0 ? (
        <div className="card hod-empty">
          <div className="empty-icon">👨‍🎓</div>
          <h3>No students found</h3>
          <p>Students will appear here once they enroll in courses.</p>
        </div>
      ) : (
        <div className="hod-table-wrap">
          <table className="hod-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Email</th>
                <th>Course</th>
                <th>Role</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id}>
                  <td>
                    <strong>{s.name}</strong>
                    <span className="hod-sub">{s.role || "No role"}</span>
                  </td>
                  <td>
                    {s.email}
                    {s.phone && <span className="hod-sub">📞 {s.phone}</span>}
                  </td>
                  <td>
                    {s.courseName ? (
                      <>
                        <Link to={`/courses/${s.courseId}`} className="link-link">{s.courseName}</Link>
                        <span className="hod-sub">#CS{s.courseId}</span>
                      </>
                    ) : (
                      <span className="hod-sub">Not enrolled</span>
                    )}
                  </td>
                  <td>
                    <span className={`status-badge role-${s.role?.toLowerCase() || "student"}`}>
                      {s.role || "Student"}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge status-${s.active !== false ? "active" : "inactive"}`}>
                      {s.active !== false ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="hod-actions-cell">
                    <Link to={`/hod/students/${s.id}`} className="inst-btn inst-btn-small">
                      <ChevronRight size={14} /> Details
                    </Link>
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
