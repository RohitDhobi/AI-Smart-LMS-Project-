import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";
import { Loading, Page } from "../../ui";

export default function AdminAIAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [ana, rep] = await Promise.all([
        api.adminAnalytics().catch(() => null),
        api.adminReports().catch(() => null),
      ]);
      setAnalytics({ ...ana, ...rep });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  if (loading) return <Loading />;

  const insights = [
    { icon: "📊", label: "Engagement Rate", value: analytics?.enrollments > 0 ? ((analytics.enrollments / (analytics.users || 1)) * 100).toFixed(1) + "%" : "0%", desc: "Students enrolled per user" },
    { icon: "🧠", label: "Quiz Participation", value: analytics?.quizAttempts || 0, desc: "Total quiz attempts" },
    { icon: "📈", label: "Completion Rate", value: analytics?.completedLessons > 0 ? ((analytics.completedLessons / (analytics.totalProgressRecords || 1)) * 100).toFixed(1) + "%" : "0%", desc: "Lessons completed vs started" },
    { icon: "⭐", label: "Review Rate", value: analytics?.totalReviews > 0 ? ((analytics.totalReviews / (analytics.enrollments || 1)) * 100).toFixed(1) + "%" : "0%", desc: "Students who left reviews" },
  ];

  return (
    <Page title="🧠 AI Analytics" subtitle="AI-powered insights about your platform.">
      <div className="admin-quick-links" style={{ marginBottom: 20 }}>
        <Link className="primary button-link" to="/admin">← Back to Dashboard</Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        {insights.map((item) => (
          <div key={item.label} className="card ai-stat-card">
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <span style={{ fontSize: 28 }}>{item.icon}</span>
              <div>
                <div className="ai-stat-value">{item.value}</div>
                <div className="ai-stat-label">{item.label}</div>
              </div>
            </div>
            <p className="ai-stat-desc">{item.desc}</p>
          </div>
        ))}
      </div>
    </Page>
  );
}
