import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";
import { Loading, Empty, Page } from "../../ui";

export default function AdminAIInsights() {
  const [recommendations, setRecommendations] = useState([]);
  const [weakTopics, setWeakTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [rec, weak] = await Promise.all([
        api.recommendations().catch(() => []),
        api.weakTopics().catch(() => []),
      ]);
      setRecommendations(Array.isArray(rec) ? rec : []);
      setWeakTopics(Array.isArray(weak) ? weak : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  if (loading) return <Loading />;

  return (
    <Page title="✨ AI Insights" subtitle="AI-generated learning recommendations and insights.">
      <div className="admin-quick-links" style={{ marginBottom: 20 }}>
        <Link className="primary button-link" to="/admin">← Back to Dashboard</Link>
      </div>

      <div className="admin-two-col">
        <div className="card">
          <h3 style={{ margin: "0 0 12px" }}>🎯 Recommendations</h3>
          {recommendations.length === 0 ? (
            <Empty text="No recommendations available yet." />
          ) : (
            <div className="result-list">
              {recommendations.map((r, i) => (
                <div key={i} className="result-row">
                  <div className="result-info">
                    <span>{r.title || r.courseTitle || `Recommendation ${i + 1}`}</span>
                    <strong>{r.reason || r.category || ""}</strong>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h3 style={{ margin: "0 0 12px" }}>⚠️ Weak Topics</h3>
          {weakTopics.length === 0 ? (
            <Empty text="No weak topics identified yet." />
          ) : (
            <div className="result-list">
              {weakTopics.map((t, i) => (
                <div key={i} className="result-row">
                  <div className="result-info">
                    <span>{t.topic || t.title || `Topic ${i + 1}`}</span>
                    <strong>{t.count ? `${t.count} struggles` : ""}</strong>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Page>
  );
}
