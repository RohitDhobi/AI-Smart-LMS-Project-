import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";
import { Loading, Page } from "../../ui";

export default function AdminReports() {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      setLoading(true);
      const r = await api.adminReports().catch(() => null);
      setReports(r);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  if (loading) return <Loading />;

  const reportCards = [
    { icon: "🏅", label: "Avg Quiz Score", value: Number(reports?.averageQuizScore || 0).toFixed(1) + "%", tint: "blue" },
    { icon: "✅", label: "Lessons Completed", value: reports?.completedLessons ?? 0, tint: "green" },
    { icon: "📈", label: "Progress Records", value: reports?.totalProgressRecords ?? 0, tint: "orange" },
    { icon: "⭐", label: "Reviews", value: reports?.totalReviews ?? 0, tint: "purple" },
    { icon: "🏆", label: "Certificates", value: reports?.totalCertificates ?? 0, tint: "green" },
    { icon: "📝", label: "Enrollments", value: reports?.totalEnrollments ?? 0, tint: "blue" },
  ];

  return (
    <Page title="📊 Reports" subtitle="Platform-wide reports and statistics.">
      <div className="admin-quick-links" style={{ marginBottom: 20 }}>
        <Link className="primary button-link" to="/admin">← Back to Dashboard</Link>
      </div>

      <div className="analytics-stats">
        {reportCards.map((s) => (
          <div key={s.label} className={`card analytics-stat tint-${s.tint}`}>
            <span className="analytics-stat-icon">{s.icon}</span>
            <div className="analytics-stat-text">
              <strong>{s.value}</strong>
              <span>{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h3 style={{ margin: "0 0 12px" }}>Report Summary</h3>
        <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>
          This page displays key metrics from your LMS platform. Data is fetched in real-time from the backend.
          Use the Analytics page for more detailed charts and visualizations.
        </p>
      </div>
    </Page>
  );
}
