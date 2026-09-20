import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";

export default function InstructorDashboard() {
  const [stats, setStats] = useState(null);
  const [courses, setCourses] = useState([]);
  const [recentSubmissions, setRecentSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [dashData, coursesData] = await Promise.all([
        api.instructorDashboard().catch(() => null),
        api.instructorCourses().catch(() => api.courses().catch(() => [])),
      ]);
      setStats(dashData);
      setCourses(Array.isArray(coursesData) ? coursesData.slice(0, 4) : []);
      setRecentSubmissions([]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="inst-loading">Loading dashboard...</div>;
  }

  const statCards = [
    { icon: "📚", label: "My Courses", value: stats?.courses ?? courses.length, color: "#3b82f6", bg: "#eff6ff" },
    { icon: "👨‍🎓", label: "Students", value: stats?.students ?? 0, color: "#16a34a", bg: "#f0fdf4" },
    { icon: "📖", label: "Lessons", value: stats?.lessons ?? 0, color: "#f59e0b", bg: "#fffbeb" },
    { icon: "✅", label: "Approved", value: stats?.approvedCourses ?? 0, color: "#8b5cf6", bg: "#f5f3ff" },
  ];

  return (
    <div className="inst-page">
      <div className="inst-page-header">
        <div>
          <h1>📊 Dashboard</h1>
          <p>Welcome back! Here's your teaching overview.</p>
        </div>
        <Link to="/instructor/courses/create" className="inst-btn primary">
          + New Course
        </Link>
      </div>

      {/* Stats */}
      <div className="inst-stats-grid">
        {statCards.map((s) => (
          <div key={s.label} className="inst-stat-card" style={{ borderLeft: `4px solid ${s.color}` }}>
            <div className="inst-stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
            <div className="inst-stat-info">
              <strong>{s.value}</strong>
              <span>{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="inst-section">
        <h2>⚡ Quick Actions</h2>
        <div className="inst-quick-actions">
          <Link to="/instructor/courses/create" className="inst-action-card">
            <span>📚</span>
            <strong>Create Course</strong>
            <p>Add a new course</p>
          </Link>
          <Link to="/instructor/lessons" className="inst-action-card">
            <span>📖</span>
            <strong>Manage Lessons</strong>
            <p>Add or edit lessons</p>
          </Link>
          <Link to="/instructor/assignments" className="inst-action-card">
            <span>📝</span>
            <strong>Create Assignment</strong>
            <p>Give students work</p>
          </Link>
          <Link to="/instructor/quizzes" className="inst-action-card">
            <span>❓</span>
            <strong>Create Quiz</strong>
            <p>Test student knowledge</p>
          </Link>
          <Link to="/instructor/analytics" className="inst-action-card">
            <span>📈</span>
            <strong>View Analytics</strong>
            <p>Track performance</p>
          </Link>
          <Link to="/instructor/students" className="inst-action-card">
            <span>👨‍🎓</span>
            <strong>My Students</strong>
            <p>View enrolled students</p>
          </Link>
        </div>
      </div>

      {/* Recent Courses */}
      <div className="inst-section">
        <div className="inst-section-header">
          <h2>📚 Recent Courses</h2>
          <Link to="/instructor/courses" className="inst-link">View All →</Link>
        </div>
        {courses.length === 0 ? (
          <div className="inst-empty">No courses yet. Create your first course!</div>
        ) : (
          <div className="inst-course-list">
            {courses.map((c) => (
              <Link key={c.id} to={`/instructor/courses/${c.id}`} className="inst-course-row">
                <div className="inst-course-row-icon">📘</div>
                <div className="inst-course-row-info">
                  <strong>{c.title}</strong>
                  <span>{c.category || "General"} · {c.difficulty || "Beginner"}</span>
                </div>
                <span className="inst-course-row-arrow">→</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="inst-section">
        <h2>📋 Recent Activity</h2>
        <div className="inst-empty">
          No recent activity yet. Start by creating courses and lessons!
        </div>
      </div>
    </div>
  );
}
