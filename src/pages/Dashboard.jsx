import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { getGamification, getWeeklyActivity } from "../gamification";
import { getStoredUser, Loading } from "../ui";

function Dashboard() {

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [courseData, setCourseData] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [weakTopics, setWeakTopics] = useState([]);
  const [quizScore, setQuizScore] = useState(null);

  // AI Tutor chat state
  const [aiInput, setAiInput] = useState("");
  const [aiMessages, setAiMessages] = useState([
    {
      role: "assistant",
      text: "Hi Priya! 👋 I'm your AI learning assistant. What would you like to learn today?"
    }
  ]);
  const [aiLoading, setAiLoading] = useState(false);

  const user = getStoredUser();
  let game = { xp: 0, level: 1, streak: 0, achievements: 0 };
  let weekly = [];
  try { game = getGamification(); } catch (e) { console.error('gamification error:', e); }
  try { weekly = getWeeklyActivity(); } catch (e) { console.error('weekly error:', e); }
  const firstName = (user?.name || "Student").split(" ")[0];

  // Fetch dashboard data
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const result = await api.dashboard();
        if (!cancelled) setData(result);
      } catch (e) {
        if (!cancelled) setError(e.message || "Unable to load dashboard.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // Fetch subjects
  useEffect(() => {
    let cancelled = false;
    api.mySubjects()
      .then(r => { if (!cancelled) setCourseData(r); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Fetch quiz attempts for average score
  useEffect(() => {
    api.quizAttempts()
      .then(r => {
        const attempts = Array.isArray(r) ? r : [];
        if (attempts.length > 0) {
          const avg = attempts.reduce((sum, a) => sum + (a.percentage || a.score || 0), 0) / attempts.length;
          setQuizScore(Math.round(avg));
        }
      })
      .catch(() => {});
  }, []);

  // Fetch notifications
  useEffect(() => {
    api.notifications()
      .then(r => setNotifications(Array.isArray(r) ? r.slice(0, 3) : []))
      .catch(() => {});
  }, []);

  // Fetch weak topics
  useEffect(() => {
    api.weakTopics()
      .then(r => setWeakTopics(Array.isArray(r) ? r.slice(0, 3) : []))
      .catch(() => {});
  }, []);

  // Fetch AI recommendations
  useEffect(() => {
    api.recommendations()
      .then(r => setRecommendations(Array.isArray(r) ? r.slice(0, 3) : []))
      .catch(() => {});
  }, []);

  // Handle AI chat submit
  async function handleAiChat(e) {
    e.preventDefault();
    if (!aiInput.trim() || aiLoading) return;

    const question = aiInput.trim();
    setAiInput("");
    setAiMessages(prev => [...prev, { role: "user", text: question }]);
    setAiLoading(true);

    try {
      const res = await api.studyAssistant(question);
      const answer = res?.answer || res?.response || res?.message || "I'm sorry, I couldn't process that question.";
      setAiMessages(prev => [...prev, { role: "assistant", text: answer }]);
    } catch {
      setAiMessages(prev => [...prev, { role: "assistant", text: "Sorry, I'm having trouble right now. Please try again." }]);
    } finally {
      setAiLoading(false);
    }
  }

  // ── Derived data from REAL API responses ──
  const enrolled = data?.enrolledCourses ?? 0;
  const completed = data?.completedCourses ?? 0;
  const inProgress = data?.inProgressCourses ?? 0;
  const courseCode = courseData?.courseCode || user?.courseCode || "";
  const courseName = courseData?.courseName || "";
  const overallProgress = Math.round(courseData?.overallProgress || 0);
  const subjects = courseData?.subjects || [];
  const backendQuizScore = data?.averageQuizScore;
  const displayQuizScore = quizScore ?? (backendQuizScore != null ? Math.round(backendQuizScore) : null);

  // Course list from API subjects
  const courseList = subjects.slice(0, 3).map(s => ({
    name: s.subjectName || s.name || "Subject",
    pct: Math.round(s.progressPercentage || 0),
    status: s.status || "NOT_STARTED"
  }));

  // Course list from dashboard courses (fallback if no subjects)
  const dashCourses = (data?.courses || []).slice(0, 3).map(c => ({
    name: c.title || c.name || "Course",
    pct: Math.round(c.progressPercentage || 0),
    status: c.completed ? "COMPLETED" : "IN_PROGRESS"
  }));

  const displayCourses = courseList.length > 0 ? courseList : dashCourses;

  // Notifications from API
  const notifList = notifications.map(n => ({
    title: n.title || n.message || "Notification",
    time: formatTimeAgo(n.createdAt),
    type: n.type || ""
  }));

  // Recommendations from API
  const recList = recommendations.map(r => ({
    title: r.title || r.topic || r.name || "Recommendation",
    desc: r.description || r.reason || "",
    action: r.action || "Start Learning",
    link: r.link || "/ai-assistant"
  }));

  // Weak topics from API
  const weakList = weakTopics.map(w => ({
    name: w.topic || w.name || w.subjectName || "Topic",
    score: Math.round(w.score || w.percentage || w.progressPercentage || 0),
    priority: (w.score || w.percentage || 50) < 50 ? "High" : "Medium"
  }));

  // Fallback weak topics from subjects with low progress
  const displayWeak = weakList.length > 0 ? weakList :
    subjects.filter(s => (s.progressPercentage || 0) < 80).slice(0, 3).map(s => ({
      name: s.subjectName || s.name || "Subject",
      score: Math.round(s.progressPercentage || 0),
      priority: (s.progressPercentage || 0) < 60 ? "High" : "Medium"
    }));

  if (loading) return <Loading />;

  // Icon colors for courses
  const courseIcons = ["📘", "☕", "🗄️", "🐍", "🌐", "🤖"];

  return (
    <div className="page dash-v2">

      {/* ── WELCOME ── */}
      <div className="dash-v2-welcome">
        <div className="dash-v2-welcome-text">
          <h1>👋 Hello, {firstName}! 👋</h1>
          <h2>Welcome to AI Smart Learning Management System</h2>
          <p>Your personalized AI-powered learning journey</p>
        </div>
        <Link to="/ai-assistant" className="dash-v2-ai-banner">
          <div className="dash-v2-ai-banner-icon">🤖</div>
          <div className="dash-v2-ai-banner-info">
            <strong>AI Tutor</strong>
            <span>Ask anything, get instant answers!</span>
          </div>
          <span className="dash-v2-ai-banner-btn">Chat with AI Tutor →</span>
        </Link>
      </div>

      {/* ── STAT CARDS ── */}
      <div className="dash-v2-stats">
        <Link to="/courses" className="dash-v2-stat-card dash-v2-stat-link">
          <div className="dash-v2-stat-icon blue">📚</div>
          <div className="dash-v2-stat-info">
            <span className="dash-v2-stat-label">Courses Enrolled</span>
            <strong className="dash-v2-stat-value">{enrolled}</strong>
            {courseCode && <span className="dash-v2-stat-sub">{courseCode}{courseName ? ` — ${courseName}` : ""}</span>}
            <span className="dash-v2-stat-change up">▲ {inProgress} in progress</span>
          </div>
        </Link>
        <Link to="/analytics" className="dash-v2-stat-card dash-v2-stat-link">
          <div className="dash-v2-stat-icon green">✅</div>
          <div className="dash-v2-stat-info">
            <span className="dash-v2-stat-label">Lessons Completed</span>
            <strong className="dash-v2-stat-value">{overallProgress}%</strong>
            <span className="dash-v2-stat-change up">{completed} courses completed</span>
          </div>
        </Link>
        <Link to="/quizzes" className="dash-v2-stat-card dash-v2-stat-link">
          <div className="dash-v2-stat-icon purple">🏆</div>
          <div className="dash-v2-stat-info">
            <span className="dash-v2-stat-label">Quiz Score</span>
            <strong className="dash-v2-stat-value">{displayQuizScore != null ? `${displayQuizScore}%` : "—"}</strong>
            <span className="dash-v2-stat-change up">Average across all quizzes</span>
          </div>
        </Link>
        <Link to="/analytics" className="dash-v2-stat-card dash-v2-stat-link">
          <div className="dash-v2-stat-icon orange">🔥</div>
          <div className="dash-v2-stat-info">
            <span className="dash-v2-stat-label">Learning Streak</span>
            <strong className="dash-v2-stat-value">{game?.streak || 0} Days</strong>
            <span className="dash-v2-stat-change up">Keep it up!</span>
          </div>
        </Link>
      </div>

      {/* ── MIDDLE ROW ── */}
      <div className="dash-v2-mid">

        {/* My Learning Progress */}
        <div className="card dash-v2-progress">
          <div className="dash-v2-card-head">
            <h3>📊 My Learning Progress</h3>
            <Link to="/analytics">View Details →</Link>
          </div>
          <div className="dash-v2-progress-body">
            <div className="dash-v2-donut-wrap">
              <div className="dash-v2-donut">
                <svg viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#e8edf3" strokeWidth="12" />
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#22c55e" strokeWidth="12"
                    strokeDasharray={`${overallProgress * 3.14} ${314 - overallProgress * 3.14}`}
                    strokeDashoffset="78.5" strokeLinecap="round" />
                </svg>
                <div className="dash-v2-donut-center">
                  <strong>{overallProgress}%</strong>
                  <span>Overall Progress</span>
                </div>
              </div>
            </div>
            <div className="dash-v2-progress-bars">
              {displayCourses.length > 0 ? displayCourses.map((c, i) => (
                <div className="dash-v2-progress-row" key={i}>
                  <span className="dash-v2-progress-name">{c.name}</span>
                  <div className="dash-v2-progress-bar">
                    <span style={{ width: `${c.pct}%` }}></span>
                  </div>
                  <strong className="dash-v2-progress-pct">{c.pct}%</strong>
                </div>
              )) : (
                <p className="dash-v2-empty">Enroll in courses to see your progress here.</p>
              )}
            </div>
          </div>
        </div>

        {/* AI Tutor Chat */}
        <div className="card dash-v2-ai-chat">
          <div className="dash-v2-card-head">
            <h3>🤖 AI Tutor</h3>
            <span className="dash-v2-online">● Online</span>
          </div>
          <div className="dash-v2-chat-messages">
            {aiMessages.map((msg, i) => (
              <div className={`dash-v2-chat-msg ${msg.role}`} key={i}>
                {msg.role === "assistant" && <span className="dash-v2-chat-avatar">🤖</span>}
                <div className="dash-v2-chat-bubble">{msg.text}</div>
              </div>
            ))}
            {aiLoading && (
              <div className="dash-v2-chat-msg assistant">
                <span className="dash-v2-chat-avatar">🤖</span>
                <div className="dash-v2-chat-bubble">Thinking...</div>
              </div>
            )}
          </div>
          <form className="dash-v2-chat-input" onSubmit={handleAiChat}>
            <input
              value={aiInput}
              onChange={e => setAiInput(e.target.value)}
              placeholder="Ask anything..."
              disabled={aiLoading}
            />
            <button type="submit" disabled={aiLoading || !aiInput.trim()}>➤</button>
          </form>
        </div>

        {/* Weak Topics */}
        <div className="card dash-v2-weak">
          <div className="dash-v2-card-head">
            <h3>⚠️ Weak Topics</h3>
            <Link to="/analytics">View All</Link>
          </div>
          <div className="dash-v2-weak-list">
            {displayWeak.length > 0 ? displayWeak.map((w, i) => (
              <div className="dash-v2-weak-item" key={i}>
                <span className="dash-v2-weak-num">{i + 1}</span>
                <div className="dash-v2-weak-info">
                  <strong>{w.name}</strong>
                  <span>Score: {w.score}%</span>
                  <div className="dash-v2-weak-bar">
                    <span style={{ width: `${w.score}%` }} className={w.score < 50 ? "low" : w.score < 70 ? "mid" : "high"}></span>
                  </div>
                </div>
                <span className={`dash-v2-weak-badge ${w.priority.toLowerCase()}`}>
                  {w.priority} Priority
                </span>
              </div>
            )) : (
              <p className="dash-v2-empty">No weak topics found. Great job! 🎉</p>
            )}
          </div>
        </div>

      </div>

      {/* ── BOTTOM ROW ── */}
      <div className="dash-v2-bottom">

        {/* My Courses */}
        <div className="card dash-v2-courses">
          <div className="dash-v2-card-head">
            <h3>📚 My Courses</h3>
            <Link to="/courses">View All</Link>
          </div>
          <div className="dash-v2-course-list">
            {displayCourses.length > 0 ? displayCourses.map((c, i) => (
              <div className="dash-v2-course-item" key={i}>
                <span className="dash-v2-course-icon">{courseIcons[i % courseIcons.length]}</span>
                <div className="dash-v2-course-info">
                  <strong>{c.name}</strong>
                  <div className="dash-v2-course-meta">
                    <span className="dash-v2-course-status">
                      {c.status === "COMPLETED" ? "Completed" : "In Progress"}
                    </span>
                    <div className="dash-v2-course-bar"><span style={{ width: `${c.pct}%` }}></span></div>
                    <strong>{c.pct}%</strong>
                  </div>
                </div>
              </div>
            )) : (
              <p className="dash-v2-empty">No courses yet. Start learning! 📚</p>
            )}
          </div>
        </div>

        {/* Upcoming Schedule */}
        <div className="card dash-v2-schedule">
          <div className="dash-v2-card-head">
            <h3>📅 Upcoming Schedule</h3>
            <Link to="/notifications">View All</Link>
          </div>
          <div className="dash-v2-schedule-list">
            <ScheduleItems />
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="card dash-v2-recs">
          <div className="dash-v2-card-head">
            <h3>✨ AI Recommendations</h3>
            <Link to="/ai-assistant">View All</Link>
          </div>
          <div className="dash-v2-rec-list">
            {recList.length > 0 ? recList.map((r, i) => (
              <div className="dash-v2-rec-item" key={i}>
                <div className="dash-v2-rec-info">
                  <strong>{r.title}</strong>
                  <span>{r.desc}</span>
                </div>
                <Link to={r.link} className="dash-v2-rec-btn">{r.action}</Link>
              </div>
            )) : (
              <p className="dash-v2-empty">No recommendations yet. Keep learning!</p>
            )}
          </div>
        </div>

        {/* Notifications */}
        <div className="card dash-v2-notifs">
          <div className="dash-v2-card-head">
            <h3>🔔 Notifications</h3>
            <Link to="/notifications">View All</Link>
          </div>
          <div className="dash-v2-notif-list">
            {notifList.length > 0 ? notifList.map((n, i) => (
              <div className="dash-v2-notif-item" key={i}>
                <span className="dash-v2-notif-dot"></span>
                <div>
                  <strong>{n.title}</strong>
                  <span>{n.time}</span>
                </div>
              </div>
            )) : (
              <p className="dash-v2-empty">No notifications yet.</p>
            )}
          </div>
        </div>

      </div>

      {/* ── FOOTER ── */}
      <footer className="dash-v2-footer">
        <p>© 2024 AI Smart Learning Management System | Powered by React + Spring Boot + Java 21 + MySQL + Python (FastAPI) | Made with ❤️ for Better Learning | <span>Version 1.0.0</span></p>
      </footer>

    </div>
  );
}

// ── Schedule Items ──
function ScheduleItems() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    Promise.all([
      api.quizzes().catch(() => []),
      api.assignments().catch(() => [])
    ]).then(([quizRes, assignRes]) => {
      const quizzes = Array.isArray(quizRes) ? quizRes.slice(0, 2) : [];
      const assigns = Array.isArray(assignRes) ? assignRes.slice(0, 2) : [];
      const combined = [
        ...quizzes.map(q => ({
          icon: "📝",
          title: q.title || q.name || "Quiz",
          time: q.dueDate || q.scheduledDate || ""
        })),
        ...assigns.map(a => ({
          icon: "📋",
          title: a.title || a.name || "Assignment",
          time: a.dueDate || a.scheduledDate || ""
        }))
      ].slice(0, 3);

      if (combined.length === 0) {
        setItems([
          { icon: "📚", title: "Continue your courses", time: "Start anytime" },
          { icon: "🤖", title: "Ask AI Tutor for help", time: "Always available" },
          { icon: "📝", title: "Take a practice quiz", time: "At your pace" }
        ]);
      } else {
        setItems(combined);
      }
    }).catch(() => {
      setItems([
        { icon: "📚", title: "Continue your courses", time: "Start anytime" },
        { icon: "🤖", title: "Ask AI Tutor for help", time: "Always available" },
        { icon: "📝", title: "Take a practice quiz", time: "At your pace" }
      ]);
    });
  }, []);

  return items.map((item, i) => (
    <div className="dash-v2-schedule-item" key={i}>
      <span className="dash-v2-schedule-icon">{item.icon}</span>
      <div>
        <strong>{item.title}</strong>
        <span>{item.time ? formatTimeAgo(item.time) || item.time : ""}</span>
      </div>
    </div>
  ));
}

// ── Utility ──
function formatTimeAgo(dateStr) {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffSec < 60) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    return date.toLocaleDateString();
  } catch {
    return dateStr;
  }
}

export default Dashboard;
