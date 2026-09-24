import React, { useEffect, useState } from "react";
import { CommandPalette } from "./components/CommandPalette";
import { ToastProvider } from "./components/Toast";

import {
  Routes,
  Route,
  Navigate,
  Link,
  useLocation,
  useNavigate
} from "react-router-dom";

import { api } from "./api";

import {
  getTheme,
  applyTheme,
  touchStreak,
  getGamification
} from "./gamification";

import {
  getStoredUser,
  Page,
  Protected
} from "./ui";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Courses from "./pages/Courses";
import Quizzes from "./pages/Quizzes";
import Leaderboard from "./pages/Leaderboard";
import CourseDetails from "./pages/CourseDetails";
import StudentLearning from "./pages/StudentLearning";
import QuizHistory from "./pages/QuizHistory";
import Wishlist from "./pages/Wishlist";
import Analytics from "./pages/Analytics";
import Certificates from "./pages/Certificates";
import Notifications from "./pages/Notifications";
import AIAssistant from "./pages/AIAssistant";
import Profile from "./pages/Profile";
import StudentSettings from "./pages/StudentSettings";
import CampusTour from "./pages/CampusTour";
const Stats3D = React.lazy(() => import("./pages/three/Stats3D"));
const Badges3D = React.lazy(() => import("./pages/three/Badges3D"));
const CourseCards3D = React.lazy(() => import("./pages/three/CourseCards3D"));
const Classroom3D = React.lazy(() => import("./pages/three/Classroom3D"));
import LearningPath from "./pages/LearningPath";
import AdminDashboard from "./pages/AdminDashboard";
import AdminCourseManagement from "./pages/AdminCourseManagement";
import AdminTeachers from "./pages/AdminTeachers";
import AdminStudents from "./pages/AdminStudents";
import AdminLayout from "./components/admin/AdminLayout";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminRoles from "./pages/admin/AdminRoles";
import AdminSubjects from "./pages/admin/AdminSubjects";
import AdminLessons from "./pages/admin/AdminLessons";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminResources from "./pages/admin/AdminResources";
import AdminQuizzes from "./pages/admin/AdminQuizzes";
import AdminExams from "./pages/admin/AdminExams";
import AdminAssignments from "./pages/admin/AdminAssignments";
import AdminResults from "./pages/admin/AdminResults";
import AdminProgress from "./pages/admin/AdminProgress";
import AdminCertificates from "./pages/admin/AdminCertificates";
import AdminLeaderboard from "./pages/admin/AdminLeaderboard";
import AdminAnnouncements from "./pages/admin/AdminAnnouncements";
import AdminDiscussions from "./pages/admin/AdminDiscussions";
import AdminAIAssistant from "./pages/admin/AdminAIAssistant";
import AdminAIAnalytics from "./pages/admin/AdminAIAnalytics";
import AdminAIInsights from "./pages/admin/AdminAIInsights";
import AdminReports from "./pages/admin/AdminReports";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminAuditLogs from "./pages/admin/AdminAuditLogs";
import AdminSemesters from "./pages/admin/AdminSemesters";
import SubjectLearning from "./pages/SubjectLearning";
import InstructorDashboard from "./pages/InstructorDashboard";
import InstructorLayout from "./pages/instructor/InstructorLayout";
import InstructorCourses from "./pages/instructor/InstructorCourses";
import InstructorCourseCreate from "./pages/instructor/InstructorCourseCreate";
import InstructorCourseDetails from "./pages/instructor/InstructorCourseDetails";
import InstructorLessons from "./pages/instructor/InstructorLessons";
import InstructorStudents from "./pages/instructor/InstructorStudents";
import InstructorAssignments from "./pages/instructor/InstructorAssignments";
import InstructorQuizzes from "./pages/instructor/InstructorQuizzes";
import InstructorExams from "./pages/instructor/InstructorExams";
import InstructorAttendance from "./pages/instructor/InstructorAttendance";
import InstructorGradeBook from "./pages/instructor/InstructorGradeBook";
import InstructorAnalytics from "./pages/instructor/InstructorAnalytics";
import InstructorAnnouncements from "./pages/instructor/InstructorAnnouncements";
import InstructorDiscussions from "./pages/instructor/InstructorDiscussions";
import InstructorAITools from "./pages/instructor/InstructorAITools";
import InstructorCertificates from "./pages/instructor/InstructorCertificates";
import InstructorCalendar from "./pages/instructor/InstructorCalendar";
import InstructorSettings from "./pages/instructor/InstructorSettings";
import InstructorResources from "./pages/instructor/InstructorResources";
import InstructorCodingPractice from "./pages/instructor/InstructorCodingPractice";
import InstructorPage from "./pages/instructor/InstructorPage";
import Assignments from "./pages/Assignments";
import Attendance from "./pages/Attendance";
import Discussions from "./pages/Discussions";
import Exams from "./pages/Exams";
import StaffLogin from "./pages/StaffLogin";
import StudentLayout from "./components/student/StudentLayout";
import CodingArena from "./pages/CodingArena";
import CodingPlayground from "./pages/CodingPlayground";
import AdminCodingManagement from "./pages/admin/AdminCodingManagement";
import HODLayout from "./components/hod/HODLayout";
import HODDashboard from "./pages/hod/HODDashboard";
import HODAssignments from "./pages/hod/HODAssignments";
import HODCoursesSubjects from "./pages/hod/HODCoursesSubjects";
import HODStudents from "./pages/hod/HODStudents";
import HODQuestions from "./pages/hod/HODQuestions";
import HODExams from "./pages/hod/HODExams";
import HODAnnouncements from "./pages/hod/HODAnnouncements";
import HODSettings from "./pages/hod/HODSettings";
import HODSubjects from "./pages/hod/HODCoursesSubjects";

// =====================================================
// LAYOUT
// =====================================================

function Layout({ children }) {

  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(getStoredUser());
  const [theme, setTheme] = useState(getTheme());
  const [game, setGame] = useState(() => touchStreak());
  const [menuOpen, setMenuOpen] = useState(false);
  const [role, setRole] = useState(user?.role || getStoredUser()?.role || null);
  const [headerSearch, setHeaderSearch] = useState("");
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  useEffect(() => {
    let cancelled = false;
    api.profile().then(profile => {
      if (!cancelled && profile?.role) setRole(profile.role);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    api.notifications().then(list => {
      const unread = Array.isArray(list) ? list.filter(n => !n.read).length : 0;
      setNotifCount(unread);
    }).catch(() => {});
  }, []);

  useEffect(() => { applyTheme(theme); }, [theme]);

  useEffect(() => {
    const refresh = () => setGame({ ...getGamification() });
    window.addEventListener("lms-gamification-update", refresh);
    return () => window.removeEventListener("lms-gamification-update", refresh);
  }, []);

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setRole(null);
    setUser(null);
    navigate("/login");
  }

  const isAdmin = role === "ADMIN";
  const isInstructor = role === "INSTRUCTOR" || isAdmin;

  // Redirect admin/teacher users to their own dashboards
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return; // Don't redirect if logged out
    if (isAdmin && location.pathname !== "/login") {
      navigate("/admin", { replace: true });
    } else if (role === "INSTRUCTOR" && location.pathname !== "/login") {
      navigate("/instructor", { replace: true });
    }
  }, [role, isAdmin]);

  const navItems = [
    { path: "/dashboard", icon: "🏠", label: "Dashboard" },
    { path: "/courses", icon: "📚", label: "My Courses" },
    { path: "/ai-assistant", icon: "🤖", label: "AI Tutor", badge: "New" },
    { path: "/assignments", icon: "📋", label: "Assignments" },
    { path: "/quizzes", icon: "❓", label: "Quizzes" },
    { path: "/exams", icon: "🎓", label: "Exams" },
    { path: "/analytics", icon: "📈", label: "Progress" },
    { path: "/certificates", icon: "🏆", label: "Certificates" },
    { path: "/discussions", icon: "👥", label: "Community" },
    { path: "/notifications", icon: "📅", label: "Calendar" },
    { path: "/campus-tour", icon: "🏫", label: "Campus Tour", badge: "3D" },
    { path: "/3d-stats", icon: "📊", label: "3D Stats", badge: "3D" },
    { path: "/3d-badges", icon: "🏆", label: "3D Badges", badge: "3D" },
    { path: "/3d-courses", icon: "📚", label: "3D Courses", badge: "3D" },
    { path: "/3d-classroom", icon: "🏫", label: "3D Classroom", badge: "3D" },
    { path: "/profile", icon: "👤", label: "Profile" },
    { path: "/settings", icon: "⚙️", label: "Settings" },
  ];

  function isActive(path) {
    if (path === "/courses") return location.pathname.startsWith("/courses");
    return location.pathname === path;
  }

  const firstName = (user?.name || "Student").split(" ")[0];

  return (
    <div className="app-layout">

      {/* =================================================
          SIDEBAR (dark navy)
      ================================================= */}
      <aside className="sidebar-v2">
        <div className="sidebar-v2-logo">
          <span className="sidebar-v2-logo-icon">📖</span>
          <div>
            <strong>AI Smart LMS</strong>
            <small>Learn Smarter • Grow Faster</small>
          </div>
        </div>

        <nav className="sidebar-v2-nav">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-v2-item ${isActive(item.path) ? "active" : ""}`}
            >
              <span className="sidebar-v2-item-icon">{item.icon}</span>
              <span className="sidebar-v2-item-label">{item.label}</span>
              {item.badge && <span className="sidebar-v2-badge">{item.badge}</span>}
            </Link>
          ))}
        </nav>

        <div className="sidebar-v2-status">
          <div className="sidebar-v2-status-title">AI Learning Status</div>
          <div className="sidebar-v2-status-row">
            <span className="sidebar-v2-status-dot"></span>
            <strong>Online</strong>
          </div>
          <span>Smart Learning Active</span>
        </div>

        <button className="sidebar-v2-logout" onClick={logout}>Logout</button>
      </aside>

      {/* =================================================
          MAIN
      ================================================= */}
      <main className="main-content-v2">

        {/* =================================================
            HEADER
        ================================================= */}
        <header className="header-v2">
          <button
            className="header-v2-menu"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? "✕" : "☰"}
          </button>

          <div className="header-v2-search">
            <span>🔍</span>
            <input
              value={headerSearch}
              onChange={e => setHeaderSearch(e.target.value)}
              placeholder="Search courses, resources, AI tutor..."
            />
          </div>

          <div className="header-v2-actions">
            <Link to="/notifications" className="header-v2-icon-btn">
              🔔
              {notifCount > 0 && <span className="header-v2-badge">{notifCount}</span>}
            </Link>
            <Link to="/discussions" className="header-v2-icon-btn">💬</Link>
            <Link to="/profile" className="header-v2-user">
              <div className="header-v2-avatar">
                {firstName[0] || "S"}
              </div>
              <div className="header-v2-user-text">
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <strong>{user?.name || user?.username || "Student"}</strong>
                  <span className={`role-badge ${role === "ADMIN" ? "role-admin" : role === "INSTRUCTOR" ? "role-instructor" : "role-student"}`} style={{ fontSize: 10, padding: "1px 7px" }}>
                    {role === "ADMIN" ? "Admin" : role === "INSTRUCTOR" ? "Instructor" : "Student"}
                  </span>
                </div>
                <small>{courseCode(user)}</small>
              </div>
            </Link>
          </div>
        </header>

        {/* Mobile nav overlay */}
        {menuOpen && (
          <div className="mobile-nav-overlay" onClick={() => setMenuOpen(false)}>
            <nav className="mobile-nav" onClick={e => e.stopPropagation()}>
              {navItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`mobile-nav-item ${isActive(item.path) ? "active" : ""}`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                  {item.badge && <span className="sidebar-v2-badge">{item.badge}</span>}
                </Link>
              ))}
              <button className="sidebar-v2-logout" onClick={logout}>Logout</button>
            </nav>
          </div>
        )}

        {children}
      </main>
    </div>
  );
}

function courseCode(user) {
  return user?.courseCode || "";
}

// =====================================================
// APP ROUTER
// =====================================================

function App() {
  return (
    <ToastProvider>
    <>
    <Routes>
      <Route
        path="/login"
        element={
          localStorage.getItem("token")
            ? <Navigate to="/dashboard" replace />
            : <Login />
        }
      />
      <Route
        path="/register"
        element={
          localStorage.getItem("token")
            ? <Navigate to="/dashboard" replace />
            : <Register />
        }
      />
      <Route
        path="/staff-login"
        element={
          localStorage.getItem("token")
            ? <Navigate to="/dashboard" replace />
            : <StaffLogin />
        }
      />

      {/* Instructor Panel — own layout, no student sidebar */}
      <Route
        path="/instructor"
        element={
          <Protected>
            <InstructorLayout />
          </Protected>
        }
      >
        <Route index element={<InstructorDashboard />} />
        <Route path="courses" element={<InstructorCourses />} />
        <Route path="courses/create" element={<InstructorCourseCreate />} />
        <Route path="courses/:id" element={<InstructorCourseDetails />} />
        <Route path="lessons" element={<InstructorLessons />} />
        <Route path="materials" element={<InstructorResources />} />
        <Route path="assignments" element={<InstructorAssignments />} />
        <Route path="coding" element={<InstructorCodingPractice />} />
        <Route path="quizzes" element={<InstructorQuizzes />} />
        <Route path="exams" element={<InstructorExams />} />
        <Route path="students" element={<InstructorStudents />} />
        <Route path="attendance" element={<InstructorAttendance />} />
        <Route path="grades" element={<InstructorGradeBook />} />
        <Route path="analytics" element={<InstructorAnalytics />} />
        <Route path="announcements" element={<InstructorAnnouncements />} />
        <Route path="discussions" element={<InstructorDiscussions />} />
        <Route path="ai-tools" element={<InstructorAITools />} />
        <Route path="certificates" element={<InstructorCertificates />} />
        <Route path="calendar" element={<InstructorCalendar />} />
        <Route path="settings" element={<InstructorSettings />} />
      </Route>

      {/* Student Routes — with student sidebar layout */}
      <Route
        path="/dashboard"
        element={<Protected><StudentLayout /></Protected>}
      >
        <Route index element={<Dashboard />} />
      </Route>
      <Route
        path="/coding"
        element={<Protected><StudentLayout /></Protected>}
      >
        <Route index element={<CodingArena />} />
        <Route path=":id" element={<CodingPlayground />} />
      </Route>
      <Route
        path="/courses"
        element={<Protected><StudentLayout /></Protected>}
      >
        <Route index element={<Courses />} />
        <Route path=":id/learn" element={<StudentLearning />} />
        <Route path=":id" element={<CourseDetails />} />
      </Route>
      <Route
        path="/quizzes"
        element={<Protected><StudentLayout /></Protected>}
      >
        <Route index element={<Quizzes />} />
      </Route>
      <Route
        path="/leaderboard"
        element={<Protected><StudentLayout /></Protected>}
      >
        <Route index element={<Leaderboard />} />
      </Route>
      <Route
        path="/wishlist"
        element={<Protected><StudentLayout /></Protected>}
      >
        <Route index element={<Wishlist />} />
      </Route>
      <Route
        path="/analytics"
        element={<Protected><StudentLayout /></Protected>}
      >
        <Route index element={<Analytics />} />
      </Route>
      <Route
        path="/certificates"
        element={<Protected><StudentLayout /></Protected>}
      >
        <Route index element={<Certificates />} />
      </Route>
      <Route
        path="/notifications"
        element={<Protected><StudentLayout /></Protected>}
      >
        <Route index element={<Notifications />} />
      </Route>
      <Route
        path="/ai-assistant"
        element={<Protected><StudentLayout /></Protected>}
      >
        <Route index element={<AIAssistant />} />
      </Route>
      <Route
        path="/learning-path"
        element={<Protected><StudentLayout /></Protected>}
      >
        <Route index element={<LearningPath />} />
      </Route>
      <Route
        path="/profile"
        element={<Protected><StudentLayout /></Protected>}
      >
        <Route index element={<Profile />} />
      </Route>
      <Route
        path="/settings"
        element={<Protected><StudentLayout /></Protected>}
      >
        <Route index element={<StudentSettings />} />
      </Route>
      <Route
        path="/campus-tour"
        element={<Protected><StudentLayout /></Protected>}
      >
        <Route index element={<CampusTour />} />
      </Route>
      <Route
        path="/3d-stats"
        element={<Protected><StudentLayout /></Protected>}
      >
        <Route index element={<React.Suspense fallback={<div style={{color:'#fff',textAlign:'center',padding:40}}>Loading 3D Stats...</div>}><Stats3D /></React.Suspense>} />
      </Route>
      <Route
        path="/3d-badges"
        element={<Protected><StudentLayout /></Protected>}
      >
        <Route index element={<React.Suspense fallback={<div style={{color:'#fff',textAlign:'center',padding:40}}>Loading 3D Badges...</div>}><Badges3D /></React.Suspense>} />
      </Route>
      <Route
        path="/3d-courses"
        element={<Protected><StudentLayout /></Protected>}
      >
        <Route index element={<React.Suspense fallback={<div style={{color:'#fff',textAlign:'center',padding:40}}>Loading 3D Courses...</div>}><CourseCards3D /></React.Suspense>} />
      </Route>
      <Route
        path="/3d-classroom"
        element={<Protected><StudentLayout /></Protected>}
      >
        <Route index element={<React.Suspense fallback={<div style={{color:'#fff',textAlign:'center',padding:40}}>Loading 3D Classroom...</div>}><Classroom3D /></React.Suspense>} />
      </Route>
      <Route
        path="/admin"
        element={<Protected><AdminLayout /></Protected>}
      >
        <Route index element={<AdminDashboard />} />
        <Route path="courses" element={<AdminCourseManagement />} />
        <Route path="teachers" element={<AdminTeachers />} />
        <Route path="students" element={<AdminStudents />} />
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="roles" element={<AdminRoles />} />
        <Route path="subjects" element={<AdminSubjects />} />
        <Route path="semesters" element={<AdminSemesters />} />
        <Route path="lessons" element={<AdminLessons />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="resources" element={<AdminResources />} />
        <Route path="quizzes" element={<AdminQuizzes />} />
        <Route path="exams" element={<AdminExams />} />
        <Route path="assignments" element={<AdminAssignments />} />
        <Route path="coding" element={<AdminCodingManagement />} />
        <Route path="results" element={<AdminResults />} />
        <Route path="progress" element={<AdminProgress />} />
        <Route path="certificates" element={<AdminCertificates />} />
        <Route path="leaderboard" element={<AdminLeaderboard />} />
        <Route path="announcements" element={<AdminAnnouncements />} />
        <Route path="discussions" element={<AdminDiscussions />} />
        <Route path="ai-assistant" element={<AdminAIAssistant />} />
        <Route path="ai-analytics" element={<AdminAIAnalytics />} />
        <Route path="ai-insights" element={<AdminAIInsights />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="audit-logs" element={<AdminAuditLogs />} />
      </Route>
      <Route
        path="/hod"
        element={<Protected><HODLayout />}</Protected>
      >
      <Route
        index element={<HODDashboard />} />
        <Route path="dashboard" element={<HODDashboard />} />
        <Route path="assignments" element={<HODAssignments />} />
        <Route path="assignments/new" element={<HODAssignments />} />
        <Route path="courses" element={<HODCoursesSubjects />} />
        <Route path="courses/new" element={<HODCoursesSubjects />} />
        <Route path="courses/:id" element={<HODCoursesSubjects />} />
        <Route path="subjects" element={<HODCoursesSubjects />} />
        <Route path="subjects/:id" element={<HODCoursesSubjects />} />
        <Route path="students" element={<HODStudents />} />
        <Route path="students/:id" element={<HODStudents />} />
        <Route path="questions" element={<HODQuestions />} />
        <Route path="questions/new" element={<HODQuestions />} />
        <Route path="questions/:id" element={<HODQuestions />} />
        <Route path="exams" element={<HODExams />} />
        <Route path="exams/new" element={<HODExams />} />
        <Route path="exams/:id" element={<HODExams />} />
        <Route path="announcements" element={<HODAnnouncements />} />
        <Route path="settings" element={<HODSettings />} />
      </Route>
      <Route
      <Route
        path="/exams"
        element={<Protected><StudentLayout /></Protected>}
      >
        <Route index element={<Exams />} />
      </Route>
      <Route
        path="/attendance"
        element={<Protected><StudentLayout /></Protected>}
      >
        <Route index element={<Attendance />} />
      </Route>
      <Route
        path="/discussions"
        element={<Protected><StudentLayout /></Protected>}
      >
        <Route index element={<Discussions />} />
      </Route>
      <Route
        path="/"
        element={<Protected><StudentLayout /></Protected>}
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
      </Route>
      <Route
        path="*"
        element={
          <Protected>
            <StudentLayout>
              <Page title="Page Not Found" subtitle="">
                <section className="card">
                  <h2>404</h2>
                  <p>The page you are looking for does not exist.</p>
                  <Link className="primary button-link" to="/dashboard">← Back to Dashboard</Link>
                </section>
              </Page>
            </StudentLayout>
          </Protected>
        }
      />
    </Routes>
    <CommandPalette />
    </>
    </ToastProvider>
  );
}

export default App;
