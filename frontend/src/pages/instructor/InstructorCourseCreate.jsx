import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api";

export default function InstructorCourseCreate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    difficulty: "BEGINNER",
    price: 0,
    duration: "",
  });

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");
      await api.instructorCreateCourse(form);
      navigate("/instructor/courses");
    } catch (err) {
      setError(err.message || "Failed to create course");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="inst-page">
      <div className="inst-page-header">
        <div>
          <h1>➕ Create Course</h1>
          <p>Set up a new course for your students.</p>
        </div>
      </div>

      {error && <div className="inst-error">{error}</div>}

      <form className="inst-form card" onSubmit={handleSubmit}>
        <div className="inst-form-group">
          <label>Course Title *</label>
          <input
            required
            placeholder="e.g. Java Programming"
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
          />
        </div>

        <div className="inst-form-group">
          <label>Description *</label>
          <textarea
            required
            rows={4}
            placeholder="What will students learn?"
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <div className="inst-form-row">
          <div className="inst-form-group">
            <label>Category</label>
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              <option value="">Select category</option>
              <option value="Programming">Programming</option>
              <option value="Data Science">Data Science</option>
              <option value="Business">Business</option>
              <option value="Design">Design</option>
              <option value="General">General</option>
            </select>
          </div>

          <div className="inst-form-group">
            <label>Difficulty</label>
            <select value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })}>
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
            </select>
          </div>
        </div>

        <div className="inst-form-row">
          <div className="inst-form-group">
            <label>Price (₹)</label>
            <input type="number" min={0} value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} />
          </div>

          <div className="inst-form-group">
            <label>Duration</label>
            <input placeholder="e.g. 12 weeks" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} />
          </div>
        </div>

        <div className="inst-form-actions">
          <button type="button" className="inst-btn secondary" onClick={() => navigate(-1)}>Cancel</button>
          <button type="submit" className="inst-btn primary" disabled={loading}>
            {loading ? "Creating..." : "Create Course"}
          </button>
        </div>
      </form>
    </div>
  );
}
