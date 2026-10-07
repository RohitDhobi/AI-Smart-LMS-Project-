import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";
import { Loading, Page } from "../../ui";

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadAnalytics();
  }, []);

  async function loadAnalytics() {
    try {
      setLoading(true);
      const [ana, rep] = await Promise.all([
        api.adminAnalytics().catch(() => null),
        api.adminReports().catch(() => null),
      ]);
      setAnalytics(ana);
      setReports(rep);
    } catch (e) {
      setError(e.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <Loading />;

  const stats = [
    { icon: "👥", label: "Total Users", value: analytics?.users ?? 0, tint: "blue", link: "/admin/students" },
    { icon: "📚", label: "Total Courses", value: analytics?.courses ?? 0, tint: "green", link: "/admin/courses" },
    { icon: "📝", label: "Enrollments", value: analytics?.enrollments ?? 0, tint: "orange", link: "/admin/students" },
    { icon: "🧠", label: "Quiz Attempts", value: analytics?.quizAttempts ?? 0, tint: "purple", link: "/admin/quizzes" },
  ];

  const reportStats = [
    { icon: "🏅", label: "Avg Quiz Score", value: Number(reports?.averageQuizScore || 0).toFixed(1) + "%", tint: "blue", link: "/admin/quizzes" },
    { icon: "✅", label: "Lessons Completed", value: reports?.completedLessons ?? 0, tint: "green", link: "/admin/lessons" },
    { icon: "📈", label: "Progress Records", value: reports?.totalProgressRecords ?? 0, tint: "orange", link: "/admin/progress" },
    { icon: "⭐", label: "Reviews", value: reports?.totalReviews ?? 0, tint: "purple", link: "/admin/courses" },
    { icon: "🏆", label: "Certificates", value: reports?.totalCertificates ?? 0, tint: "green", link: "/admin/certificates" },
  ];

  return (
    <Page title="📈 Analytics" subtitle="Platform-wide analytics and insights.">
      {error && <div className="error">{error}</div>}

      <div className="admin-quick-links" style={{ marginBottom: 20 }}>
        <Link className="primary button-link" to="/admin">← Back to Dashboard</Link>
      </div>

      <h3 style={{ marginBottom: 12 }}>Overview</h3>
      <div className="analytics-stats">
        {stats.map((s) => (
          <Link
            key={s.label}
            to={s.link}
            className={`card analytics-stat tint-${s.tint}`}
            style={{ textDecoration: "none" }}
          >
            <span className="analytics-stat-icon">{s.icon}</span>
            <div className="analytics-stat-text">
              <strong>{s.value}</strong>
              <span>{s.label}</span>
            </div>
          </Link>
        ))}
      </div>

      <h3 style={{ margin: "24px 0 12px" }}>Reports</h3>
      <div className="analytics-stats">
        {reportStats.map((s) => (
          <Link
            key={s.label}
            to={s.link}
            className={`card analytics-stat tint-${s.tint}`}
            style={{ textDecoration: "none" }}
          >
            <span className="analytics-stat-icon">{s.icon}</span>
            <div className="analytics-stat-text">
              <strong>{s.value}</strong>
              <span>{s.label}</span>
            </div>
          </Link>
        ))}
      </div>
    </Page>
  );
}
