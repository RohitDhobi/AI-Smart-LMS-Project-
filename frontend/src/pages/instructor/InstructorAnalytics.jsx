import React, { useState, useEffect } from "react";
import { getStoredUser } from "../../ui";
import { api } from "../../api";
import InstructorPage from "./InstructorPage";

const TABS = ["Course Analytics", "Student Analytics", "Performance", "Weak Topics", "Reports"];

export default function InstructorAnalytics() {
  const user = getStoredUser();
  const [activeTab, setActiveTab] = useState(0);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.instructorCourses().catch(() => api.courses().catch(() => []))
      .then((data) => { setCourses(Array.isArray(data) ? data : data.content || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user]);

  const stats = [
    { icon: "📚", label: "Active Courses", value: courses.length || 0, color: "#3b82f6" },
    { icon: "👨‍🎓", label: "Total Students", value: "156", color: "#10b981" },
    { icon: "📝", label: "Avg. Completion", value: "78%", color: "#f59e0b" },
    { icon: "⭐", label: "Avg. Rating", value: "4.6", color: "#8b5cf6" },
  ];

  const weakTopics = [
    { topic: "Arrays & Loops", course: "Java Programming", students: 45, avgScore: 52 },
    { topic: "CSS Flexbox", course: "Web Development", students: 38, avgScore: 58 },
    { topic: "SQL Joins", course: "Database Systems", students: 30, avgScore: 61 },
    { topic: "Recursion", course: "Data Structures", students: 25, avgScore: 48 },
  ];

  return (
    <InstructorPage icon="📈" title="Analytics & Reports" subtitle="Track course performance and student progress">
      <div className="inst-content">
        {/* Tabs */}
        <div className="inst-tabs">
          {TABS.map((tab, i) => (
            <button
              key={tab}
              className={`inst-tab ${activeTab === i ? "active" : ""}`}
              onClick={() => setActiveTab(i)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Stats Overview */}
        <div className="inst-stats-grid">
          {stats.map((s) => (
            <div key={s.label} className="inst-stat-card">
              <div className="inst-stat-icon" style={{ background: `${s.color}15`, color: s.color }}>
                {s.icon}
              </div>
              <div className="inst-stat-info">
                <strong>{s.value}</strong>
                <span>{s.label}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 3 && (
          <div className="inst-card">
            <h3>⚠️ Weak Topics Requiring Attention</h3>
            <div className="inst-table-wrap">
              <table className="inst-table">
                <thead>
                  <tr>
                    <th>Topic</th>
                    <th>Course</th>
                    <th>Students</th>
                    <th>Avg. Score</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {weakTopics.map((t, i) => (
                    <tr key={i}>
                      <td><strong>{t.topic}</strong></td>
                      <td>{t.course}</td>
                      <td>{t.students}</td>
                      <td>
                        <div className="inst-grade-bar">
                          <div
                            className="inst-grade-fill"
                            style={{
                              width: `${t.avgScore}%`,
                              background: t.avgScore < 50 ? "#ef4444" : t.avgScore < 65 ? "#f59e0b" : "#10b981",
                            }}
                          />
                        </div>
                        <small>{t.avgScore}%</small>
                      </td>
                      <td>
                        <button className="inst-btn inst-btn-sm inst-btn-primary">Review</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 2 && (
          <div className="inst-card">
            <h3>📊 Performance Trends</h3>
            <div className="inst-chart-placeholder">
              <div className="inst-chart-bars">
                {[65, 72, 68, 80, 75, 82, 78, 85, 79, 88, 83, 90].map((h, i) => (
                  <div key={i} className="inst-chart-bar" style={{ height: `${h}%` }}>
                    <span>{h}%</span>
                  </div>
                ))}
              </div>
              <div className="inst-chart-labels">
                {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m) => (
                  <span key={m}>{m}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {(activeTab === 0 || activeTab === 1) && (
          <div className="inst-card">
            <h3>{activeTab === 0 ? "📚 Course Performance" : "👨‍🎓 Student Analytics"}</h3>
            {loading ? (
              <p className="inst-loading">Loading...</p>
            ) : courses.length === 0 ? (
              <p className="inst-empty-text">No data available yet.</p>
            ) : (
              <div className="inst-course-list">
                {courses.map((c) => (
                  <div key={c.id} className="inst-course-row">
                    <div>
                      <strong>{c.title || c.name}</strong>
                      <small>{c.studentCount || 0} students enrolled</small>
                    </div>
                    <div className="inst-course-metrics">
                      <span className="inst-metric">📊 {Math.floor(70 + Math.random() * 25)}%</span>
                      <span className="inst-metric">⭐ {(4 + Math.random()).toFixed(1)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 4 && (
          <div className="inst-card">
            <h3>📋 Available Reports</h3>
            <div className="inst-report-grid">
              {[
                { icon: "📊", title: "Course Summary", desc: "Overview of all courses" },
                { icon: "👨‍🎓", title: "Student Progress", desc: "Individual student tracking" },
                { icon: "📝", title: "Assessment Results", desc: "Quizzes, assignments, exams" },
                { icon: "📈", title: "Performance Trends", desc: "Monthly/weekly trends" },
                { icon: "⚠️", title: "At-Risk Students", desc: "Students needing attention" },
                { icon: "🏆", title: "Top Performers", desc: "Highest scoring students" },
              ].map((r) => (
                <div key={r.title} className="inst-report-card">
                  <span className="inst-report-icon">{r.icon}</span>
                  <div>
                    <strong>{r.title}</strong>
                    <small>{r.desc}</small>
                  </div>
                  <button className="inst-btn inst-btn-sm inst-btn-outline">Export</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </InstructorPage>
  );
}
