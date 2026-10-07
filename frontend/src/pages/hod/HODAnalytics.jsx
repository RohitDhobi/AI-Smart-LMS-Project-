import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";
import { BarChart3, BookOpen, Users, GraduationCap, TrendingUp } from "lucide-react";

/**
 * HOD Analytics - course performance and platform overview.
 * Built from the same HOD endpoints as the dashboard so no extra backend
 * surface is needed, and styled with the existing HOD design system.
 */
export default function HODAnalytics() {
  const [stats, setStats] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError("");
      const [dash, courseList] = await Promise.all([
        api.hodDashboard().catch(() => null),
        api.hodCourses().catch(() => []),
      ]);
      if (dash) setStats(dash);
      setCourses(Array.isArray(courseList) ? courseList : []);
    } catch (e) {
      setError(e.message || "Unable to load analytics.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="inst-loading">Loading analytics...</div>;
  if (error) return <div className="error">{error}</div>;

  const totalCourses = stats?.totalCourses ?? 0;
  const totalSubjects = stats?.totalSubjects ?? 0;
  const totalInstructors = stats?.totalInstructors ?? 0;
  const totalStudents = stats?.totalStudents ?? 0;
  const totalEnrolled = stats?.totalStudentsEnrolled ?? 0;
  const activeAssignments = stats?.totalActiveAssignments ?? 0;

  const overview = [
    { icon: BookOpen, label: "Total Courses", value: totalCourses, bg: "#eff6ff", color: "#2563eb" },
    { icon: GraduationCap, label: "Total Subjects", value: totalSubjects, bg: "#f0fdf4", color: "#16a34a" },
    { icon: Users, label: "Instructors", value: totalInstructors, bg: "#fffbeb", color: "#f59e0b" },
    { icon: Users, label: "Students", value: totalStudents, bg: "#f5f3ff", color: "#7c3aed" },
    { icon: TrendingUp, label: "Enrollments", value: totalEnrolled, bg: "#fdf2f8", color: "#db2777" },
    { icon: BarChart3, label: "Active Assignments", value: activeAssignments, bg: "#ecfeff", color: "#0891b2" },
  ];

  return (
    <div className="page hod-dashboard">
      <div className="page-heading">
        <h1>Analytics</h1>
        <p>Course performance and staffing coverage across the department.</p>
      </div>

      <div className="hod-actions">
        <button className="inst-btn inst-btn-secondary" onClick={loadData}>Refresh</button>
        <Link to="/hod/assignments" className="inst-btn inst-btn-secondary">Instructor Assignment</Link>
      </div>

      {/* Overview stats */}
      <div className="hod-stats-grid">
        {overview.map((s) => (
          <div key={s.label} className="hod-stat-card" style={{ borderTop: `4px solid ${s.color}` }}>
            <div className="hod-stat-icon" style={{ background: s.bg, color: s.color }}>
              <s.icon size={20} />
            </div>
            <div className="hod-stat-info">
              <strong className="hod-stat-value">{s.value}</strong>
              <span className="hod-stat-label">{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Per-course coverage */}
      <div className="card">
        <div className="card-header">
          <h2>📊 Course Performance</h2>
          <Link to="/hod/courses" className="card-link">View All →</Link>
        </div>

        {courses.length === 0 ? (
          <div className="hod-empty">
            <div className="empty-icon">📊</div>
            <p>No courses to analyse yet.</p>
          </div>
        ) : (
          <div className="hod-table-wrap">
            <table className="hod-table">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Subjects</th>
                  <th>Students</th>
                  <th>Assigned Instructors</th>
                  <th>Coverage</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((c) => {
                  const assigned = Number(c.assignedInstructors || 0);
                  const covered = assigned > 0;
                  return (
                    <tr key={c.id}>
                      <td>
                        <strong>{c.title || c.courseName}</strong>
                        <span className="hod-sub">{c.courseCode}</span>
                      </td>
                      <td>{c.subjectCount ?? 0}</td>
                      <td>{c.studentCount ?? 0}</td>
                      <td>{assigned}</td>
                      <td>
                        <span className={`status-badge ${covered ? "status-active" : "status-pending"}`}>
                          {covered ? "Covered" : "Unassigned"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
