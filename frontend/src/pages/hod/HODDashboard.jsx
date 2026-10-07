import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";
import { getStoredUser } from "../../ui";
import { LayoutDashboard, BookOpen, Users, GraduationCap, BarChart3, ClipboardList, TrendingUp, Clock, ChevronRight } from "lucide-react";

export default function HODDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const data = await api.hodDashboard().catch(() => null);
      if (data) setStats(data);
    } catch (e) {
      setError(e.message || "Unable to load dashboard.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="inst-loading">Loading dashboard...</div>;
  if (error) return <div className="error">{error}</div>;

  const totalCourses = stats?.totalCourses ?? 0;
  const totalSubjects = stats?.totalSubjects ?? 0;
  const totalInstructors = stats?.totalInstructors ?? 0;
  const totalStudents = stats?.totalStudents ?? 0;
  const totalAssignments = stats?.totalAssignments ?? 0;
  const totalExams = stats?.totalExams ?? 0;
  const totalQuizzes = stats?.totalQuizzes ?? 0;
  const totalStudentsEnrolled = stats?.totalStudentsEnrolled ?? 0;
  const totalActiveAssignments = stats?.totalActiveAssignments ?? 0;
  const pendingAssignments = stats?.pendingAssignments ?? 0;

  const statCards = [
    { icon: "📚", label: "Total Courses", value: totalCourses, color: "#2563eb", bg: "#eff6ff", iconC: BookOpen },
    { icon: "📖", label: "Total Subjects", value: totalSubjects, color: "#16a34a", bg: "#f0fdf4", iconC: GraduationCap },
    { icon: "👨‍🏫", label: "Total Instructors", value: totalInstructors, color: "#f59e0b", bg: "#fffbeb", iconC: Users },
    { icon: "👨‍🎓", label: "Total Students", value: totalStudents, color: "#7c3aed", bg: "#f5f3ff", iconC: Users },
  ];

  return (
    <div className="page hod-dashboard">
      <div className="page-heading">
        <h1>HOD Dashboard</h1>
        <p>Head of Department overview — courses, instructors, students, performance & pending activities.</p>
      </div>

      {/* Stats Grid */}
      <div className="hod-stats-grid">
        {statCards.map((s) => (
          <div key={s.label} className="hod-stat-card" style={{ borderTop: `4px solid ${s.color}` }}>
            <div className="hod-stat-icon" style={{ background: s.bg, color: s.color }}>
              <s.iconC size={20} />
            </div>
            <div className="hod-stat-info">
              <strong className="hod-stat-value">{s.value}</strong>
              <span className="hod-stat-label">{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="hod-grid">
        {/* Left Column */}
        <div className="hod-col">
          {/* Course Performance */}
          <div className="card">
            <div className="card-header">
              <h2>📊 Course Performance</h2>
              <Link to="/hod/courses" className="card-link">View All →</Link>
            </div>
            <div className="hod-perf-list">
              <div className="hod-perf-row">
                <span className="hod-perf-icon">📘</span>
                <div className="hod-perf-info">
                  <strong>Total Courses</strong>
                  <span>{totalCourses} active</span>
                </div>
                <span className="hod-perf-value">{totalCourses}</span>
              </div>
              <div className="hod-perf-row">
                <span className="hod-perf-icon">📚</span>
                <div className="hod-perf-info">
                  <strong>Total Subjects</strong>
                  <span>{totalSubjects} across all courses</span>
                </div>
                <span className="hod-perf-value">{totalSubjects}</span>
              </div>
              <div className="hod-perf-row">
                <span className="hod-perf-icon">👨‍🏫</span>
                <div className="hod-perf-info">
                  <strong>Instructors</strong>
                  <span>{totalInstructors} assigned</span>
                </div>
                <span className="hod-perf-value">{totalInstructors}</span>
              </div>
              <div className="hod-perf-row">
                <span className="hod-perf-icon">👨‍🎓</span>
                <div className="hod-perf-info">
                  <strong>Students Enrolled</strong>
                  <span>{totalStudentsEnrolled} total</span>
                </div>
                <span className="hod-perf-value">{totalStudentsEnrolled}</span>
              </div>
            </div>
          </div>

          {/* Pending Activities */}
          <div className="card">
            <div className="card-header">
              <h2>⏳ Pending Activities</h2>
            </div>
            <div className="hod-pending-list">
              <div className="hod-pending-item">
                <span className="pending-icon">📋</span>
                <div className="pending-info">
                  <strong>{totalActiveAssignments}</strong>
                  <span>Active assignments</span>
                </div>
                <span className="pending-badge">ACTIVE</span>
              </div>
              <div className="hod-pending-item">
                <span className="pending-icon">⏳</span>
                <div className="pending-info">
                  <strong>{pendingAssignments}</strong>
                  <span>Pending assignments</span>
                </div>
                <span className="pending-badge pending-badge-warn">PENDING</span>
              </div>
              <div className="hod-pending-item">
                <span className="pending-icon">🧪</span>
                <div className="pending-info">
                  <strong>{totalQuizzes}</strong>
                  <span>Quizzes</span>
                </div>
                <span className="pending-badge">QUIZZES</span>
              </div>
              <div className="hod-pending-item">
                <span className="pending-icon">📝</span>
                <div className="pending-info">
                  <strong>{totalExams}</strong>
                  <span>Exams</span>
                </div>
                <span className="pending-badge">EXAMS</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="hod-col">
          {/* Quick Actions */}
          <div className="card">
            <div className="card-header">
              <h2>⚡ Quick Actions</h2>
            </div>
            <div className="hod-quick-actions">
              <Link to="/hod/assignments" className="hod-action-card">
                <span className="action-icon">👥</span>
                <strong>Assign Instructor</strong>
                <p>Manage instructor assignments</p>
              </Link>
              <Link to="/hod/courses" className="hod-action-card">
                <span className="action-icon">📚</span>
                <strong>Manage Courses</strong>
                <p>View & manage courses</p>
              </Link>
              <Link to="/hod/students" className="hod-action-card">
                <span className="action-icon">👨‍🎓</span>
                <strong>View Students</strong>
                <p>Browse enrolled students</p>
              </Link>
              <Link to="/hod/assignments" className="hod-action-card">
                <span className="action-icon">📝</span>
                <strong>Instructor Assignment</strong>
                <p>Assign instructors to subjects</p>
              </Link>
              <Link to="/hod/exams" className="hod-action-card">
                <span className="action-icon">🧪</span>
                <strong>Exams</strong>
                <p>Create & manage exams</p>
              </Link>
              <Link to="/hod/announcements" className="hod-action-card">
                <span className="action-icon">📢</span>
                <strong>Announcements</strong>
                <p>Post announcements</p>
              </Link>
            </div>
          </div>

          {/* Recent Assignments Preview */}
          <div className="card">
            <div className="card-header">
              <h2>📋 Recent Assignments</h2>
              <Link to="/hod/assignments" className="card-link">View All →</Link>
            </div>
            <div className="hod-empty">
              <div className="empty-icon">📋</div>
              <p>No assignments yet.</p>
              <p>Use the Instructor Assignment page to assign instructors to subjects/courses.</p>
              <Link to="/hod/assignments" className="inst-btn primary">Assign Instructor →</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
