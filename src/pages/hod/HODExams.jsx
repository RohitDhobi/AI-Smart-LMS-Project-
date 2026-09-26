import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";
import { getStoredUser } from "../../ui";
import { FileText, FileQuestion, PlusCircle, GraduationCap, Clock, Trash2, PlayCircle } from "lucide-react";

export default function HODExams() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => { loadExams(); }, []);

  async function loadExams() {
    try {
      setLoading(true);
      setError("");
      const data = await api.hodExams().catch(() => []);
      setExams(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Unable to load exams.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(exam) {
    const name = exam.title || exam.name || "this exam";
    const ok = window.confirm(`Delete "${name}"? This cannot be undone.`);
    if (!ok) return;

    try {
      setError("");
      await api.deleteExam(exam.id);
      await loadExams();
    } catch (err) {
      setError(err.message || "Failed to delete exam.");
    }
  }

  return (
    <div className="page hod-exams">
      <div className="page-heading">
        <h1>Exams</h1>
        <p>Create exams, manage question papers, and track exam performance.</p>
      </div>

      <div className="hod-actions">
        <Link to="/hod/exams/new" className="inst-btn inst-btn-primary">
          <PlusCircle size={16} /> Create Exam
        </Link>
        <Link to="/hod/questions" className="inst-btn inst-btn-secondary">
          <FileQuestion size={16} /> Manage Questions
        </Link>
        <button className="inst-btn inst-btn-secondary" onClick={loadExams}>Refresh</button>
      </div>

      {error && <div className="error">{error}</div>}

      {loading ? (
        <div className="inst-loading">Loading exams...</div>
      ) : exams.length === 0 ? (
        <div className="card hod-empty">
          <div className="empty-icon">📝</div>
          <h3>No exams yet</h3>
          <p>Create your first exam to start managing question papers.</p>
          <Link to="/hod/exams/new" className="inst-btn primary">
            <PlusCircle size={16} /> Create Exam
          </Link>
        </div>
      ) : (
        <div className="hod-table-wrap">
          <table className="hod-table">
            <thead>
              <tr>
                <th>Exam Name</th>
                <th>Course</th>
                <th>Date</th>
                <th>Duration</th>
                <th>Questions</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {exams.map((e) => (
                <tr key={e.id}>
                  <td>
                    <strong>{e.title || e.name}</strong>
                    {e.description && <span className="hod-sub">{e.description}</span>}
                  </td>
                  <td>
                    {e.courseName ? <span className="hod-sub">{e.courseName}</span> : <span className="hod-sub">—</span>}
                  </td>
                  <td>
                    {e.date ? <span className="hod-sub">{new Date(e.date).toLocaleDateString()}</span> : <span className="hod-sub">—</span>}
                  </td>
                  <td>
                    <span className="hod-sub">{e.duration} mins</span>
                  </td>
                  <td>
                    <span className="hod-sub">{e.questionCount || 0}</span>
                  </td>
                  <td>
                    <span className={`status-badge status-${e.status?.toLowerCase() || "active"}`}>
                      {e.status || "Active"}
                    </span>
                  </td>
                  <td className="hod-actions-cell">
                    <div className="hod-actions-cell">
                      <Link to={`/hod/exams/${e.id}`} className="inst-btn inst-btn-small">
                        <GraduationCap size={14} /> Manage
                      </Link>
                      <button
                        className="inst-btn inst-btn-small danger"
                        onClick={() => handleDelete(e)}
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
