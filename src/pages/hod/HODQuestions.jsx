import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";
import { getStoredUser } from "../../ui";
import { FileQuestion, PlusCircle, Bot, Trash2, PlayCircle } from "lucide-react";

export default function HODQuestions() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);

  useEffect(() => { loadQuestions(); }, []);

  async function loadQuestions() {
    try {
      setLoading(true);
      setError("");
      const data = await api.hodQuestions().catch(() => []);
      setQuestions(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Unable to load questions.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateAI() {
    setAiGenerating(true);
    try {
      const data = await api.hodGenerateQuestions({ count: 10 }).catch(() => null);
      if (data) loadQuestions();
    } catch (e) {
      setError(e.message || "AI question generation failed.");
    } finally {
      setAiGenerating(false);
    }
  }

  return (
    <div className="page hod-questions">
      <div className="page-heading">
        <h1>Question Bank</h1>
        <p>Manage questions: create, edit, and generate AI questions.</p>
      </div>

      <div className="hod-actions">
        <button className="inst-btn inst-btn-primary" onClick={handleGenerateAI} disabled={aiGenerating}>
          <Bot size={16} /> Generate AI Questions
        </button>
        <Link to="/hod/questions/new" className="inst-btn inst-btn-secondary">
          <PlusCircle size={16} /> Add Question
        </Link>
      </div>

      {error && <div className="error">{error}</div>}

      {loading ? (
        <div className="inst-loading">Loading questions...</div>
      ) : questions.length === 0 ? (
        <div className="card hod-empty">
          <div className="empty-icon">📝</div>
          <h3>Question bank is empty</h3>
          <p>Add questions manually or use AI to generate them.</p>
          <button className="inst-btn primary" onClick={handleGenerateAI}>
            <Bot size={16} /> Generate with AI
          </button>
        </div>
      ) : (
        <div className="hod-table-wrap">
          <table className="hod-table">
            <thead>
              <tr>
                <th>Question</th>
                <th>Type</th>
                <th>Category</th>
                <th>Difficulty</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((q) => (
                <tr key={q.id}>
                  <td>{q.title || q.question || "Untitled"}</td>
                  <td>
                    <span className="status-badge">{q.type || "MCQ"}</span>
                  </td>
                  <td>
                    {q.category ? <span className="hod-sub">{q.category}</span> : <span className="hod-sub">—</span>}
                  </td>
                  <td>
                    <span className={`status-badge status-${q.difficulty?.toLowerCase() || "medium"}`}>
                      {q.difficulty || "Medium"}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge status-${q.status?.toLowerCase() || "active"}`}>
                      {q.status || "Active"}
                    </span>
                  </td>
                  <td className="hod-actions-cell">
                    <div className="hod-actions-cell">
                      <Link to={`/hod/questions/${q.id}`} className="inst-btn inst-btn-small">
                        <Pencil size={14} /> Edit
                      </Link>
                      <button className="inst-btn inst-btn-small danger">
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
