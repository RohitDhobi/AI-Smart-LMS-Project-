import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { Loading, Empty, Page } from "../ui";

function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [reports, setReports] = useState(null);
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Create instructor form
  const [showInstructorForm, setShowInstructorForm] = useState(false);
  const [instructorForm, setInstructorForm] = useState({
    name: "", email: "", password: "", phone: "", bio: "",
  });
  const [instructorLoading, setInstructorLoading] = useState(false);
  const [instructorSuccess, setInstructorSuccess] = useState("");
  const [instructorError, setInstructorError] = useState("");

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    try {
      setLoading(true);
      setError("");
      const profile = await api.profile();
      if (profile?.role !== "ADMIN") {
        setError("Access denied. Admin role required.");
        return;
      }

      const [dash, ana, rep, userList, courseList, quizList, assignmentList] = await Promise.all([
        api.adminDashboard().catch(() => null),
        api.adminAnalytics().catch(() => null),
        api.adminReports().catch(() => null),
        api.adminUsers().catch(() => []),
        api.adminCourses().catch(() => api.courses().catch(() => [])),
        api.quizzes().catch(() => []),
        api.assignments().catch(() => []),
      ]);

      setStats(dash);
      setAnalytics(ana);
      setReports(rep);
      setUsers(Array.isArray(userList) ? userList : []);
      setCourses(Array.isArray(courseList) ? courseList : []);
      setQuizzes(Array.isArray(quizList) ? quizList : []);
      setAssignments(Array.isArray(assignmentList) ? assignmentList : []);
    } catch (e) {
      setError(e.message || "Unable to load admin dashboard.");
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(user) {
    try {
      setError("");
      await api.adminSetActive(user.id, !user.active);
      setUsers((current) =>
        current.map((item) =>
          Number(item.id) === Number(user.id) ? { ...item, active: !item.active } : item
        )
      );
    } catch (e) { setError(e.message || "Update failed."); }
  }

  async function removeUser(user) {
    if (!window.confirm(`Delete user "${user.name}" (${user.email})?`)) return;
    try {
      setError("");
      await api.adminDeleteUser(user.id);
      setUsers((current) => current.filter((item) => Number(item.id) !== Number(user.id)));
    } catch (e) { setError(e.message || "Delete failed."); }
  }

  async function handleCreateInstructor(e) {
    e.preventDefault();
    try {
      setInstructorLoading(true);
      setInstructorError("");
      setInstructorSuccess("");
      const result = await api.adminCreateInstructor(instructorForm);
      setUsers((current) => [...current, result]);
      setStats((current) =>
        current ? { ...current, instructors: (current.instructors || 0) + 1, totalUsers: (current.totalUsers || 0) + 1 } : current
      );
      setInstructorSuccess(`Instructor "${result.name}" created successfully!`);
      setInstructorForm({ name: "", email: "", password: "", phone: "", bio: "" });
      setTimeout(() => setInstructorSuccess(""), 5000);
    } catch (e) { setInstructorError(e.message || "Failed to create instructor."); }
    finally { setInstructorLoading(false); }
  }

  if (loading) return <Loading />;

  // Computed stats from real data
  const studentCount = users.filter((u) => u.role === "STUDENT").length;
  const instructorCount = users.filter((u) => u.role === "INSTRUCTOR").length;
  const activeUsers = users.filter((u) => u.active).length;

  // Main stat cards - clickable
  const statCards = [
    {
      icon: "👥", tint: "blue", label: "Total Users",
      value: stats?.totalUsers ?? analytics?.users ?? users.length,
      link: "/admin/students", desc: `${activeUsers} active`,
    },
    {
      icon: "👨‍🎓", tint: "green", label: "Students",
      value: stats?.students ?? studentCount,
      link: "/admin/students", desc: "Manage students",
    },
    {
      icon: "🧑‍🏫", tint: "orange", label: "Instructors",
      value: stats?.instructors ?? instructorCount,
      link: "/admin/teachers", desc: "Manage teachers",
    },
    {
      icon: "📚", tint: "purple", label: "Courses",
      value: stats?.courses ?? courses.length,
      link: "/admin/courses", desc: "Manage courses",
    },
    {
      icon: "📝", tint: "blue", label: "Enrollments",
      value: stats?.enrollments ?? analytics?.enrollments ?? 0,
      link: "/admin/progress", desc: "View progress",
    },
    {
      icon: "🧠", tint: "green", label: "Quizzes",
      value: stats?.quizAttempts ?? quizzes.length,
      link: "/admin/quizzes", desc: "Manage quizzes",
    },
  ];

  // Report cards - clickable
  const reportCards = [
    {
      icon: "🏅", tint: "blue", label: "Avg Quiz Score",
      value: Number(reports?.averageQuizScore || 0).toFixed(1) + "%",
      link: "/admin/results", desc: "View results",
    },
    {
      icon: "✅", tint: "green", label: "Lessons Done",
      value: reports?.completedLessons ?? 0,
      link: "/admin/lessons", desc: "View lessons",
    },
    {
      icon: "📈", tint: "orange", label: "Progress",
      value: reports?.totalProgressRecords ?? 0,
      link: "/admin/progress", desc: "Track progress",
    },
    {
      icon: "⭐", tint: "purple", label: "Reviews",
      value: reports?.totalReviews ?? 0,
      link: "/admin/courses", desc: "View courses",
    },
    {
      icon: "🏆", tint: "green", label: "Certificates",
      value: reports?.totalCertificates ?? 0,
      link: "/admin/certificates", desc: "View certificates",
    },
  ];

  // Quick actions
  const quickActions = [
    { icon: "📊", label: "Analytics", link: "/admin/analytics", tint: "blue" },
    { icon: "📋", label: "Assignments", link: "/admin/assignments", tint: "orange" },
    { icon: "💬", label: "Discussions", link: "/admin/discussions", tint: "purple" },
    { icon: "🤖", label: "AI Tools", link: "/admin/ai-assistant", tint: "green" },
    { icon: "⚙️", label: "Settings", link: "/admin/settings", tint: "blue" },
    { icon: "📜", label: "Audit Logs", link: "/admin/audit-logs", tint: "orange" },
  ];

  // Recent users
  const recentUsers = [...users].sort((a, b) => (b.id || 0) - (a.id || 0)).slice(0, 5);

  // Recent courses
  const recentCourses = [...courses].sort((a, b) => (b.id || 0) - (a.id || 0)).slice(0, 5);

  return (
    <Page title="Admin Dashboard" subtitle="Platform overview and management.">
      {error && <div className="error">{error}</div>}
      {instructorSuccess && <div className="notice">{instructorSuccess}</div>}

      {/* Quick Actions */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <button className="primary" onClick={() => setShowInstructorForm(!showInstructorForm)}>
          🧑‍🏫 {showInstructorForm ? "Close Form" : "Create Instructor"}
        </button>
        {quickActions.map((a) => (
          <Link
            key={a.label}
            to={a.link}
            className="secondary"
            style={{ textDecoration: "none", padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600 }}
          >
            {a.icon} {a.label}
          </Link>
        ))}
      </div>

      {/* Create Instructor Form */}
      {showInstructorForm && (
        <section className="card" style={{ marginBottom: 20, borderLeft: "3px solid #2563eb" }}>
          <h3 style={{ margin: "0 0 12px" }}>🧑‍🏫 Create Instructor Account</h3>
          {instructorError && <div className="error">{instructorError}</div>}
          <form onSubmit={handleCreateInstructor}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
              <input required value={instructorForm.name} onChange={(e) => setInstructorForm({ ...instructorForm, name: e.target.value })} placeholder="Full Name *" />
              <input type="email" required value={instructorForm.email} onChange={(e) => setInstructorForm({ ...instructorForm, email: e.target.value })} placeholder="Email *" />
              <input type="password" required minLength={6} value={instructorForm.password} onChange={(e) => setInstructorForm({ ...instructorForm, password: e.target.value })} placeholder="Password *" />
              <input value={instructorForm.phone} onChange={(e) => setInstructorForm({ ...instructorForm, phone: e.target.value })} placeholder="Phone (optional)" />
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <input value={instructorForm.bio} onChange={(e) => setInstructorForm({ ...instructorForm, bio: e.target.value })} placeholder="Bio (optional)" style={{ flex: 1 }} />
              <button className="primary" type="submit" disabled={instructorLoading}>
                {instructorLoading ? "Creating..." : "Create"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Main Stats - Clickable */}
      <div className="analytics-stats">
        {statCards.map((stat) => (
          <Link
            key={stat.label}
            to={stat.link}
            className={`card analytics-stat tint-${stat.tint}`}
            style={{ textDecoration: "none", color: "inherit", cursor: "pointer", transition: "transform 0.15s, box-shadow 0.15s" }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,0,0,0.1)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
          >
            <span className="analytics-stat-icon">{stat.icon}</span>
            <div className="analytics-stat-text">
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
              <small style={{ fontSize: 11, color: "#94a3b8" }}>{stat.desc}</small>
            </div>
          </Link>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="admin-two-col">
        {/* Recent Users */}
        <div className="card">
          <div className="dash-panel-head">
            <h3>Recent Users</h3>
            <Link to="/admin/students" style={{ fontSize: 13, fontWeight: 600 }}>View All →</Link>
          </div>
          {recentUsers.length === 0 ? (
            <Empty text="No users found." />
          ) : (
            <div className="result-list">
              {recentUsers.map((u) => (
                <div key={u.id} className="result-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <strong style={{ fontSize: 13 }}>{u.name}</strong>
                    <div style={{ fontSize: 12, color: "#94a3b8" }}>{u.email}</div>
                  </div>
                  <span className={`role-badge role-${String(u.role || "student").toLowerCase()}`} style={{ fontSize: 11 }}>
                    {u.role || "STUDENT"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Courses */}
        <div className="card">
          <div className="dash-panel-head">
            <h3>Recent Courses</h3>
            <Link to="/admin/courses" style={{ fontSize: 13, fontWeight: 600 }}>View All →</Link>
          </div>
          {recentCourses.length === 0 ? (
            <Empty text="No courses found." />
          ) : (
            <div className="result-list">
              {recentCourses.map((c) => (
                <div key={c.id} className="result-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <strong style={{ fontSize: 13 }}>{c.title}</strong>
                    <div style={{ fontSize: 12, color: "#94a3b8" }}>{c.category || "General"} • {c.difficulty || "Beginner"}</div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: c.status === "APPROVED" ? "#16a34a" : "#d97706" }}>
                    {c.status || "Active"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Report Stats - Clickable */}
      <h3 style={{ margin: "24px 0 12px" }}>Reports Overview</h3>
      <div className="analytics-stats">
        {reportCards.map((stat) => (
          <Link
            key={stat.label}
            to={stat.link}
            className={`card analytics-stat tint-${stat.tint}`}
            style={{ textDecoration: "none", color: "inherit", cursor: "pointer", transition: "transform 0.15s, box-shadow 0.15s" }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,0,0,0.1)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
          >
            <span className="analytics-stat-icon">{stat.icon}</span>
            <div className="analytics-stat-text">
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
              <small style={{ fontSize: 11, color: "#94a3b8" }}>{stat.desc}</small>
            </div>
          </Link>
        ))}
      </div>

      {/* Users Table */}
      <section className="card" style={{ marginTop: 20 }}>
        <div className="dash-panel-head">
          <h3>All Users</h3>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span>{users.length} total</span>
            <Link to="/admin/students" className="secondary small" style={{ textDecoration: "none", padding: "4px 10px", fontSize: 12, borderRadius: 6 }}>Students</Link>
            <Link to="/admin/teachers" className="secondary small" style={{ textDecoration: "none", padding: "4px 10px", fontSize: 12, borderRadius: 6 }}>Teachers</Link>
          </div>
        </div>
        {users.length === 0 ? (
          <Empty text="No users found." />
        ) : (
          <div className="mobile-cards">
            {users.slice(0, 10).map((user) => (
              <div key={user.id} className="mobile-user-card">
                <div className="mobile-user-card-header">
                  <div className="mobile-user-avatar">
                    {(user.name || "U")[0].toUpperCase()}
                  </div>
                  <div className="mobile-user-info">
                    <strong>{user.name}</strong>
                    <span>{user.email}</span>
                  </div>
                  <span className={`role-badge role-${String(user.role || "student").toLowerCase()}`}>
                    {user.role || "STUDENT"}
                  </span>
                </div>
                <div className="mobile-user-card-actions">
                  <span className={`mobile-user-status ${user.active ? "active" : "inactive"}`}>
                    {user.active ? "● Active" : "● Inactive"}
                  </span>
                  <div className="mobile-user-buttons">
                    <button className="secondary small" onClick={() => toggleActive(user)}>
                      {user.active ? "Deactivate" : "Activate"}
                    </button>
                    <button className="danger small" onClick={() => removeUser(user)}>Delete</button>
                  </div>
                </div>
              </div>
            ))}
            {users.length > 10 && (
              <Link to="/admin/students" className="mobile-view-all">
                View all {users.length} users →
              </Link>
            )}
          </div>
        )}
      </section>
    </Page>
  );
}

export default AdminDashboard;
