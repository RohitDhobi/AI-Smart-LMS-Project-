import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";
import { Loading, Empty, Page } from "../../ui";

export default function AdminCategories() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCategory, setNewCategory] = useState("");

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      setLoading(true);
      const c = await api.adminCourses().catch(() => api.courses());
      setCourses(Array.isArray(c) ? c : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  // Extract unique categories from courses
  const categoryMap = {};
  courses.forEach((c) => {
    const cat = c.category || "Uncategorized";
    if (!categoryMap[cat]) categoryMap[cat] = { name: cat, count: 0, courses: [] };
    categoryMap[cat].count++;
    categoryMap[cat].courses.push(c.title);
  });
  const categories = Object.values(categoryMap).sort((a, b) => b.count - a.count);

  if (loading) return <Loading />;

  return (
    <Page title="📂 Categories" subtitle="Manage course categories.">
      <div className="admin-quick-links" style={{ marginBottom: 20 }}>
        <Link className="primary button-link" to="/admin">← Back to Dashboard</Link>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ margin: "0 0 12px" }}>Category Statistics</h3>
        <div className="analytics-stats">
          <div className="card analytics-stat tint-blue">
            <span className="analytics-stat-icon">📂</span>
            <div className="analytics-stat-text">
              <strong>{categories.length}</strong>
              <span>Categories</span>
            </div>
          </div>
          <div className="card analytics-stat tint-green">
            <span className="analytics-stat-icon">📚</span>
            <div className="analytics-stat-text">
              <strong>{courses.length}</strong>
              <span>Total Courses</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="dash-panel-head">
          <h3>All Categories ({categories.length})</h3>
        </div>
        {categories.length === 0 ? <Empty text="No categories found." /> : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>Category</th><th>Courses</th><th>Course Names</th></tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat.name}>
                    <td><strong>{cat.name}</strong></td>
                    <td>{cat.count}</td>
                    <td style={{ maxWidth: 400, overflow: "hidden", textOverflow: "ellipsis" }}>
                      {cat.courses.join(", ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Page>
  );
}
