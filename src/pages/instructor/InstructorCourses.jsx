import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";

export default function InstructorCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => { loadCourses(); }, []);

  async function loadCourses() {
    try {
      setLoading(true);
      const data = await api.instructorCourses().catch(() => api.adminCourses().catch(() => api.courses()));
      setCourses(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const filtered = courses.filter(c =>
    !search || c.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="inst-page">
      <div className="inst-page-header">
        <div>
          <h1>📚 My Courses</h1>
          <p>Manage and organize your courses.</p>
        </div>
        <Link to="/instructor/courses/create" className="inst-btn inst-btn-primary">+ Create Course</Link>
      </div>

      <div className="inst-filters">
        <input
          className="inst-input"
          placeholder="🔍 Search courses..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 300 }}
        />
      </div>

      {loading ? (
        <div className="inst-loading">Loading courses...</div>
      ) : filtered.length === 0 ? (
        <div className="inst-empty">
          <div className="inst-empty-icon">📚</div>
          <h3>No courses found</h3>
          <p>Create your first course to get started.</p>
          <Link to="/instructor/courses/create" className="inst-btn inst-btn-primary">+ Create Course</Link>
        </div>
      ) : (
        <div className="inst-courses-grid">
          {filtered.map(c => (
            <Link key={c.id} to={`/instructor/courses/${c.id}`} className="inst-course-card card">
              <div className="inst-course-card-header">
                <div className="inst-course-card-icon">📘</div>
                <span className="inst-badge">{c.difficulty || "Beginner"}</span>
              </div>
              <h3>{c.title}</h3>
              <p>{c.description?.slice(0, 100)}...</p>
              <div className="inst-course-card-meta">
                <span>📂 {c.category || "General"}</span>
                <span>👨‍🏫 {c.instructor || "You"}</span>
              </div>
              <div className="inst-course-card-footer">
                <span className="inst-price">{c.price ? `₹${c.price}` : "Free"}</span>
                <span className="inst-link">Manage →</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
