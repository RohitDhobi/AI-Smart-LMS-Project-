import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { api } from "../../api";
import {
  BookOpen, GraduationCap, PlusCircle, Pencil, ChevronLeft, Users
} from "lucide-react";

/**
 * HOD - Courses / Subjects (spec section 2)
 *
 *  - list every course and subject
 *  - open a course to see its details
 *  - jump into Instructor Assignment to assign / change / remove an instructor
 *
 * Deletion is deliberately not offered here: assigning an instructor is the
 * HOD action the spec asks for, and the backend owns destructive operations.
 */
export default function HODCoursesSubjects() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [detail, setDetail] = useState(null);
  const [detailSubjects, setDetailSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (id) loadDetail(id);
    else loadList();
  }, [id]);

  async function loadList() {
    try {
      setLoading(true);
      setError("");
      setDetail(null);
      const [c, s] = await Promise.all([
        api.hodCourses().catch(() => []),
        api.hodSubjects().catch(() => []),
      ]);
      setCourses(Array.isArray(c) ? c : []);
      setSubjects(Array.isArray(s) ? s : []);
    } catch (e) {
      setError(e.message || "Unable to load data.");
    } finally {
      setLoading(false);
    }
  }

  async function loadDetail(courseId) {
    try {
      setLoading(true);
      setError("");
      const [c, s] = await Promise.all([
        api.hodCourses().catch(() => []),
        api.hodSubjects().catch(() => []),
      ]);
      const all = Array.isArray(c) ? c : [];
      const allSubjects = Array.isArray(s) ? s : [];

      const found = all.find((x) => Number(x.id) === Number(courseId)) || null;
      setDetail(found);
      setDetailSubjects(
        allSubjects.filter((x) => Number(x.courseId) === Number(courseId))
      );
      setCourses(all);
      setSubjects(allSubjects);
    } catch (e) {
      setError(e.message || "Unable to load course details.");
    } finally {
      setLoading(false);
    }
  }

  // ---------------- Course detail view ----------------
  if (id && !loading) {
    if (error) return <div className="error">{error}</div>;
    if (!detail) {
      return (
        <div className="page hod-courses">
          <div className="inst-empty">
            <div className="inst-empty-icon">🔍</div>
            <h3>Course not found</h3>
            <Link to="/hod/courses" className="inst-btn inst-btn-secondary">
              ← Back to Courses
            </Link>
          </div>
        </div>
      );
    }

    const covered = Number(detail.assignedInstructors || 0) > 0;

    return (
      <div className="page hod-courses">
        <div className="page-heading">
          <button className="back-link" onClick={() => navigate("/hod/courses")}>
            <ChevronLeft size={14} /> Back to Courses
          </button>
          <h1>{detail.title || detail.courseName}</h1>
          <p>{detail.description}</p>
        </div>

        <div className="hod-actions">
          <Link to="/hod/assignments" className="inst-btn inst-btn-primary">
            <Users size={15} /> Assign Instructor
          </Link>
        </div>

        {error && <div className="error">{error}</div>}

        {/* Facts */}
        <div className="card">
          <div className="card-header">
            <h2>📘 Course Details</h2>
            <span className={`status-badge ${covered ? "status-active" : "status-pending"}`}>
              {covered ? "Instructor Assigned" : "No Instructor"}
            </span>
          </div>
          <div className="hod-table-wrap">
            <table className="hod-table">
              <tbody>
                <tr><td><strong>Course Code</strong></td><td>{detail.courseCode || "—"}</td></tr>
                <tr><td><strong>Category</strong></td><td>{detail.category || "General"}</td></tr>
                <tr><td><strong>Difficulty</strong></td><td>{detail.difficulty || "Beginner"}</td></tr>
                <tr><td><strong>Duration</strong></td><td>{detail.duration || "—"}</td></tr>
                <tr><td><strong>Price</strong></td><td>{detail.price ? `₹${detail.price}` : "Free"}</td></tr>
                <tr><td><strong>Subjects</strong></td><td>{detail.subjectCount ?? 0}</td></tr>
                <tr><td><strong>Students</strong></td><td>{detail.studentCount ?? 0}</td></tr>
                <tr>
                  <td><strong>Assigned Instructors</strong></td>
                  <td>{detail.assignedInstructors ?? 0}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Subjects in this course */}
        <div className="card">
          <div className="card-header">
            <h2>📖 Subjects ({detailSubjects.length})</h2>
            <Link to="/hod/assignments" className="card-link">Assign Instructors →</Link>
          </div>

          {detailSubjects.length === 0 ? (
            <div className="hod-empty">
              <div className="empty-icon">📖</div>
              <p>No subjects found in this course.</p>
            </div>
          ) : (
            <div className="hod-subjects-list">
              {detailSubjects.map((s) => (
                <div key={s.id} className="hod-subject-row">
                  <div className="hod-subject-icon">📚</div>
                  <div className="hod-subject-info">
                    <strong>{s.subjectName}</strong>
                    <span>
                      Semester {s.semester ?? "—"}
                      {s.assignedInstructor
                        ? ` · 👨‍🏫 ${s.assignedInstructor}`
                        : " · Not Assigned"}
                    </span>
                  </div>
                  <div className="hod-subject-actions">
                    <Link to="/hod/assignments" className="inst-btn inst-btn-small inst-btn-primary">
                      <Pencil size={12} /> {s.assignedInstructor ? "Change" : "Assign"}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ---------------- List view ----------------
  return (
    <div className="page hod-courses">
      <div className="page-heading">
        <h1>Courses & Subjects</h1>
        <p>View all courses/subjects, details, and assign instructors.</p>
      </div>

      <div className="hod-actions">
        <Link to="/hod/assignments" className="inst-btn inst-btn-primary">
          <Users size={15} /> Instructor Assignment
        </Link>
        <button className="inst-btn inst-btn-secondary" onClick={loadList}>Refresh</button>
      </div>

      {error && <div className="error">{error}</div>}

      {/* COURSES */}
      <div className="card">
        <div className="card-header">
          <h2>📚 Courses</h2>
          <Link to="/hod/subjects" className="card-link">Manage Subjects →</Link>
        </div>
        {loading ? (
          <div className="inst-loading">Loading courses...</div>
        ) : courses.length === 0 ? (
          <div className="hod-empty">
            <div className="empty-icon">📚</div>
            <p>No courses found.</p>
          </div>
        ) : (
          <div className="hod-courses-grid">
            {courses.map((c) => (
              <div key={c.id} className="hod-course-card card">
                <div className="hod-course-card-header">
                  <div className="hod-course-icon">📘</div>
                  <span className="hod-badge">{c.difficulty || "Beginner"}</span>
                </div>
                <h3>{c.title || c.courseName}</h3>
                <p>{c.description?.slice(0, 100)}...</p>
                <div className="hod-course-meta">
                  <span>📂 {c.category || "General"}</span>
                  <span>📖 {c.subjectCount ?? 0} subjects</span>
                  <span>⭐ {c.studentCount || 0} students</span>
                </div>
                <div className="hod-course-footer">
                  <span className="hod-price">{c.price ? `₹${c.price}` : "Free"}</span>
                  <div className="hod-course-actions">
                    <Link to={`/hod/courses/${c.id}`} className="inst-btn inst-btn-small">
                      <Pencil size={12} /> View
                    </Link>
                    <Link to="/hod/assignments" className="inst-btn inst-btn-small inst-btn-primary">
                      <Users size={12} /> Assign
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SUBJECTS */}
      <div className="card">
        <div className="card-header">
          <h2>📖 Subjects</h2>
          <Link to="/hod/assignments" className="card-link">Assign Instructors →</Link>
        </div>
        {loading ? (
          <div className="inst-loading">Loading subjects...</div>
        ) : subjects.length === 0 ? (
          <div className="hod-empty">
            <div className="empty-icon">📖</div>
            <p>No subjects found.</p>
          </div>
        ) : (
          <div className="hod-subjects-list">
            {subjects.map((s) => (
              <div key={s.id} className="hod-subject-row">
                <div className="hod-subject-icon">📚</div>
                <div className="hod-subject-info">
                  <strong>{s.subjectName}</strong>
                  <span>
                    {s.courseName || "No course"} · Semester {s.semester}
                    {s.assignedInstructor ? ` · 👨‍🏫 ${s.assignedInstructor}` : ""}
                  </span>
                </div>
                <div className="hod-subject-actions">
                  <Link to={`/hod/courses/${s.courseId}`} className="inst-btn inst-btn-small">
                    <Pencil size={12} /> View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
