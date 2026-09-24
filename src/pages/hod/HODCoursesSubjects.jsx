import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";
import { getStoredUser } from "../../ui";
import { BookOpen, GraduationCap, Users, PlusCircle, Pencil, Trash2 } from "lucide-react";

export default function HODCoursesSubjects() {
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError("");
      const [c, s] = await Promise.all([
        api.hodCourses().catch(() => []),
        api.hodSubjects().catch(() => []),
      ]);
      setCourses(Array.isArray(c) ? c : []);
      setSubjects(Array.isArray(s) ? s : []);
    } catch (e) {
      setError(e.message || "Unable to load data.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page hod-courses">
      <div className="page-heading">
        <h1>Courses & Subjects</h1>
        <p>View all courses/subjects, details, and assign instructors.</p>
      </div>

      <div className="hod-actions">
        <Link to="/hod/courses/new" className="inst-btn inst-btn-primary">
          <PlusCircle size={16} /> Add Course
        </Link>
        <button className="inst-btn inst-btn-secondary" onClick={loadData}>Refresh</button>
      </div>

      {error && <div className="error">{error}</div>}

      {/* COURSES */}
      <div className="card">
        <div className="card-header">
          <h2>📚 Courses</h2>
          <Link to="/hod/subjects" className="card-link">Manage Subjects →</Link>
        </div>
        {loading ? (
          <div className="inst-loading">Loading courses...</div>
        ) : courses.length === 0 ? (
          <div className="hod-empty">
            <div className="empty-icon">📚</div>
            <p>No courses found.</p>
          </div>
        ) : (
          <div className="hod-courses-grid">
            {courses.map((c) => (
              <div key={c.id} className="hod-course-card card">
                <div className="hod-course-card-header">
                  <div className="hod-course-icon">📘</div>
                  <span className="hod-badge">{c.difficulty || "Beginner"}</span>
                </div>
                <h3>{c.title || c.courseName}</h3>
                <p>{c.description?.slice(0, 100)}...</p>
                <div className="hod-course-meta">
                  <span>📂 {c.category || "General"}</span>
                  <span>👨‍🏫 {c.instructor || "No instructor"}</span>
                  <span>⭐ {c.studentCount || 0} students</span>
                </div>
                <div className="hod-course-footer">
                  <span className="hod-price">{c.price ? `₹${c.price}` : "Free"}</span>
                  <div className="hod-course-actions">
                    <Link to={`/hod/courses/${c.id}`} className="inst-btn inst-btn-small">
                      <Pencil size={12} /> View
                    </Link>
                    <button className="inst-btn inst-btn-small danger">
                      <Trash2 size={12} /> Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SUBJECTS */}
      <div className="card">
        <div className="card-header">
          <h2>📖 Subjects</h2>
          <Link to="/hod/subjects" className="card-link">Manage Subjects →</Link>
        </div>
        {loading ? (
          <div className="inst-loading">Loading subjects...</div>
        ) : subjects.length === 0 ? (
          <div className="hod-empty">
            <div className="empty-icon">📖</div>
            <p>No subjects found.</p>
          </div>
        ) : (
          <div className="hod-subjects-list">
            {subjects.map((s) => (
              <div key={s.id} className="hod-subject-row">
                <div className="hod-subject-icon">📚</div>
                <div className="hod-subject-info">
                  <strong>{s.subjectName}</strong>
                  <span>{s.courseName || "No course"} · Semester {s.semester}</span>
                </div>
                <div className="hod-subject-actions">
                  <Link to={`/hod/subjects/${s.id}`} className="inst-btn inst-btn-small">
                    <Pencil size={12} /> View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
