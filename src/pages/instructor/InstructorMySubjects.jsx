import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";
import { BookOpen, GraduationCap, Lock, Eye, ShieldCheck } from "lucide-react";

/**
 * "My Subjects" - the subjects and courses the HOD has assigned to the
 * logged-in instructor.
 *
 * Everything the platform offers stays visible (spec: an instructor can see
 * ALL courses), but only the rows listed here are manageable. The backend
 * re-checks every write with HTTP 403, so this view is guidance, not security.
 */
export default function InstructorMySubjects() {
  const [data, setData] = useState(null);
  const [allCourses, setAllCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      setLoading(true);
      setError("");
      const [mine, courses] = await Promise.all([
        api.instructorMySubjects().catch(() => null),
        api.instructorCourses().catch(() => []),
      ]);
      if (mine) setData(mine);
      setAllCourses(Array.isArray(courses) ? courses : []);
    } catch (e) {
      setError(e.message || "Unable to load your subjects.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="inst-loading">Loading your subjects...</div>;
  if (error) return <div className="error">{error}</div>;

  const assignedCourses = data?.courses || [];
  const assignedSubjects = data?.subjects || [];
  const assignedCourseIds = new Set(assignedCourses.map((c) => Number(c.id)));
  const total = data?.totalAssigned ?? 0;

  // Every course stays visible; ones without an assignment are view-only.
  const viewOnlyCourses = allCourses.filter((c) => !assignedCourseIds.has(Number(c.id)));

  return (
    <div className="inst-page">
      <div className="inst-page-header">
        <div>
          <h1>📚 My Subjects</h1>
          <p>
            Subjects and courses assigned to you by your HOD. You have full
            management access on these; everything else is view-only.
          </p>
        </div>
        <Link to="/instructor/courses" className="inst-btn inst-btn-secondary">
          Browse All Courses
        </Link>
      </div>

      {/* Summary */}
      <div className="inst-info-grid card" style={{ marginTop: 4 }}>
        <div className="inst-info-item">
          <span className="inst-info-label">Assigned Courses</span>
          <strong>{assignedCourses.length}</strong>
        </div>
        <div className="inst-info-item">
          <span className="inst-info-label">Assigned Subjects</span>
          <strong>{assignedSubjects.length}</strong>
        </div>
        <div className="inst-info-item">
          <span className="inst-info-label">Total Assignments</span>
          <strong>{total}</strong>
        </div>
        <div className="inst-info-item">
          <span className="inst-info-label">View-Only Courses</span>
          <strong>{viewOnlyCourses.length}</strong>
        </div>
      </div>

      {/* Assigned courses */}
      <div className="inst-section">
        <div className="inst-section-header">
          <h2><ShieldCheck size={18} /> Assigned Courses (Full Access)</h2>
        </div>

        {assignedCourses.length === 0 ? (
          <div className="inst-empty">
            <div className="inst-empty-icon">📭</div>
            <h3>No courses assigned yet</h3>
            <p>Ask your HOD to assign a course or subject to you from the Instructor Assignment page.</p>
          </div>
        ) : (
          <div className="inst-courses-grid">
            {assignedCourses.map((c) => (
              <Link key={c.id} to={`/instructor/courses/${c.id}`} className="inst-course-card card">
                <div className="inst-course-card-header">
                  <div className="inst-course-card-icon">📘</div>
                  <span className="inst-badge">Manage</span>
                </div>
                <h3>{c.title || c.courseName}</h3>
                <p>{c.description?.slice(0, 110)}</p>
                <div className="inst-course-card-meta">
                  <span>📂 {c.category || "General"}</span>
                  <span>📖 {c.subjectCount ?? 0} subjects</span>
                </div>
                <div className="inst-course-card-footer">
                  <span className="inst-link">Open Course →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Assigned subjects */}
      {assignedSubjects.length > 0 && (
        <div className="inst-section">
          <div className="inst-section-header">
            <h2><GraduationCap size={18} /> Assigned Subjects (Full Access)</h2>
          </div>
          <div className="inst-courses-grid">
            {assignedSubjects.map((s) => (
              <Link
                key={s.id}
                to={`/instructor/courses/${s.courseId}`}
                className="inst-course-card card"
              >
                <div className="inst-course-card-header">
                  <div className="inst-course-card-icon">📖</div>
                  <span className="inst-badge">Subject</span>
                </div>
                <h3>{s.subjectName}</h3>
                <p>{s.description || s.courseName}</p>
                <div className="inst-course-card-meta">
                  <span>🏛️ {s.courseName || "—"}</span>
                  <span>🗓️ Semester {s.semester ?? "—"}</span>
                </div>
                <div className="inst-course-card-footer">
                  <span className="inst-link">Open Course →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* View-only courses */}
      <div className="inst-section">
        <div className="inst-section-header">
          <h2><Eye size={18} /> Other Courses (View Only)</h2>
        </div>

        {viewOnlyCourses.length === 0 ? (
          <div className="inst-empty">
            <div className="inst-empty-icon">✅</div>
            <h3>You can manage every course</h3>
            <p>There are no view-only courses right now.</p>
          </div>
        ) : (
          <div className="inst-courses-grid">
            {viewOnlyCourses.map((c) => (
              <div key={c.id} className="inst-course-card card" style={{ opacity: 0.85 }}>
                <div className="inst-course-card-header">
                  <div className="inst-course-card-icon"><Lock size={18} /></div>
                  <span className="inst-badge">View Only</span>
                </div>
                <h3>{c.title || c.courseName}</h3>
                <p>{c.description?.slice(0, 110)}</p>
                <div className="inst-course-card-meta">
                  <span>📂 {c.category || "General"}</span>
                  <span>👨‍🏫 {c.instructor || "—"}</span>
                </div>
                <div className="inst-course-card-footer">
                  <Link to={`/instructor/courses/${c.id}`} className="inst-link">
                    View Details →
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
