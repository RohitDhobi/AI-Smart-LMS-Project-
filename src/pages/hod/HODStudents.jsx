import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../../api";
import { Mail, Phone, ChevronLeft } from "lucide-react";

export default function HODStudents() {
  const { id } = useParams();
  const navigate = useNavigate();

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

  // ---------------- Detail view (/hod/students/:id) ----------------
  if (id) {
    const student = students.find((s) => Number(s.id) === Number(id));

    if (loading) {
      return (
        <div className="page hod-students">
          <div className="inst-loading">Loading student...</div>
        </div>
      );
    }

    if (error && !student) {
      return (
        <div className="page hod-students">
          <div className="error">{error}</div>
          <button className="back-link" onClick={() => navigate("/hod/students")}>
            <ChevronLeft size={14} /> Back to Students
          </button>
        </div>
      );
    }

    if (!student) {
      return (
        <div className="page hod-students">
          <div className="card hod-empty">
            <div className="empty-icon">🔍</div>
            <h3>Student not found</h3>
            <p>The requested student does not exist or was removed.</p>
            <Link to="/hod/students" className="inst-btn inst-btn-secondary">
              ← Back to Students
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="page hod-students">
        <div className="page-heading">
          <button className="back-link" onClick={() => navigate("/hod/students")}>
            <ChevronLeft size={14} /> Back to Students
          </button>
          <h1>{student.name}</h1>
          <p>Student profile and course enrollment.</p>
        </div>

        <div className="hod-actions">
          <span className={`status-badge status-${student.active !== false ? "active" : "inactive"}`}>
            {student.active !== false ? "Active" : "Inactive"}
          </span>
          <span className={`status-badge role-${student.role?.toLowerCase() || "student"}`}>
            {student.role || "Student"}
          </span>
        </div>

        <div className="card">
          <div className="card-header">
            <h2>👤 Student Details</h2>
          </div>
          <div className="hod-table-wrap">
            <table className="hod-table">
              <tbody>
                <tr>
                  <td><strong>Full Name</strong></td>
                  <td>{student.name || "—"}</td>
                </tr>
                <tr>
                  <td><strong>Email</strong></td>
                  <td>
                    <span className="hod-inline-icon"><Mail size={14} /></span>
                    {student.email || "—"}
                  </td>
                </tr>
                <tr>
                  <td><strong>Phone</strong></td>
                  <td>
                    {student.phone ? (
                      <>
                        <span className="hod-inline-icon"><Phone size={14} /></span>
                        {student.phone}
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
                <tr>
                  <td><strong>Role</strong></td>
                  <td>{student.role || "Student"}</td>
                </tr>
                <tr>
                  <td><strong>Status</strong></td>
                  <td>
                    <span className={`status-badge status-${student.active !== false ? "active" : "inactive"}`}>
                      {student.active !== false ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td><strong>Enrolled Course</strong></td>
                  <td>
                    {student.courseId ? (
                      <Link to={`/hod/courses/${student.courseId}`} className="link-link">
                        {student.courseName || `Course #${student.courseId}`}
                      </Link>
                    ) : (
                      <span className="hod-sub">Not enrolled</span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ---------------- List view (/hod/students) ----------------
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
                  <td>
                    <div className="hod-actions-cell">
                      <Link to={`/hod/students/${s.id}`} className="inst-btn inst-btn-small">
                        Details
                      </Link>
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
