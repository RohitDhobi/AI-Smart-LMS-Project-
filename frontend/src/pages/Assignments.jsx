import React, { useEffect, useState } from "react";
import { api } from "../api";
import { Loading, Empty, Page } from "../ui";

function Assignments() {

  const [assignments, setAssignments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");

  // submission state
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [answerText, setAnswerText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submissions, setSubmissions] = useState({});

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    try {
      setLoading(true);
      setError("");

      const [assignmentList, courseList, mySubs] = await Promise.all([
        api.assignments(),
        api.courses(),
        api.mySubmissions().catch(() => [])
      ]);

      setAssignments(Array.isArray(assignmentList) ? assignmentList : []);
      setCourses(Array.isArray(courseList) ? courseList : []);

      const subMap = {};
      (Array.isArray(mySubs) ? mySubs : []).forEach(sub => {
        if (sub.assignment?.id) {
          subMap[sub.assignment.id] = sub;
        }
      });
      setSubmissions(subMap);

    } catch (e) {
      setError(e.message || "Unable to load assignments.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!selectedAssignment) return;

    try {
      setSubmitting(true);
      setError("");
      setNotice("");

      const result = await api.submitAssignment(selectedAssignment.id, answerText);

      setSubmissions(current => ({
        ...current,
        [selectedAssignment.id]: result
      }));

      setNotice("Assignment submitted successfully! ✅");
      setSelectedAssignment(null);
      setAnswerText("");

    } catch (e) {
      setError(e.message || "Unable to submit assignment.");
    } finally {
      setSubmitting(false);
    }
  }

  const filtered = assignments.filter(a =>
    !search.trim() ||
    a.title?.toLowerCase().includes(search.trim().toLowerCase()) ||
    a.subject?.toLowerCase().includes(search.trim().toLowerCase())
  );

  if (loading) return <Loading />;

  return (
    <Page
      title="Assignments"
      subtitle="View and submit your course assignments."
    >

      {error && <div className="error">{error}</div>}
      {notice && <div className="notice">{notice}</div>}

      <div className="dash-search" style={{ maxWidth: 400, marginBottom: 20 }}>
        <span>🔍</span>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search assignments..."
        />
      </div>

      {filtered.length === 0 ? (
        <Empty text="No assignments found." />
      ) : (
        <div className="quizzes-grid">
          {filtered.map(assignment => {
            const sub = submissions[assignment.id];
            const isPastDue = assignment.dueDate && new Date(assignment.dueDate) < new Date();

            return (
              <div className="card quiz-card" key={assignment.id}>
                <div className="quiz-card-icon">📋</div>

                <div className="quiz-card-head">
                  <span className="quiz-card-course">
                    {assignment.subject || "General"}
                  </span>
                  {sub && (
                    <span className="passed-badge">
                      {sub.status === "GRADED" ? `✓ Graded: ${sub.marks}/${assignment.maximumMarks}` : "✓ Submitted"}
                    </span>
                  )}
                  {isPastDue && !sub && (
                    <span className="best-score">Past Due</span>
                  )}
                </div>

                <h2>{assignment.title}</h2>
                <p>{assignment.description || "Complete the assigned task."}</p>

                <div className="quiz-card-meta">
                  <span>Max Marks: {assignment.maximumMarks || 100}</span>
                  {assignment.dueDate && (
                    <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                  )}
                </div>

                {sub?.status === "GRADED" ? (
                  <div className="quiz-result passed" style={{ marginTop: 12 }}>
                    <p>
                      Score: <strong>{sub.marks}</strong> / {assignment.maximumMarks}
                    </p>
                    {sub.feedback && <p>Feedback: {sub.feedback}</p>}
                  </div>
                ) : sub ? (
                  <button className="secondary" disabled>
                    ✓ Submitted
                  </button>
                ) : (
                  <button
                    className="primary quiz-take-btn"
                    onClick={() => setSelectedAssignment(assignment)}
                  >
                    Submit Assignment
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {selectedAssignment && (
        <div className="modal-overlay" onClick={() => setSelectedAssignment(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h3>📋 Submit: {selectedAssignment.title}</h3>
              <button className="modal-close" onClick={() => setSelectedAssignment(null)}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-field">
                <label>Your Answer</label>
                <textarea
                  value={answerText}
                  onChange={e => setAnswerText(e.target.value)}
                  placeholder="Type your answer or paste your work here..."
                  rows="8"
                  required
                />
              </div>

              <button className="primary" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Assignment"}
              </button>
            </form>
          </div>
        </div>
      )}

    </Page>
  );
}

export default Assignments;
