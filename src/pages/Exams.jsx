import React, { useEffect, useState } from "react";
import { api } from "../api";
import { Loading, Empty, Page } from "../ui";

function Exams() {

  const [exams, setExams] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedExam, setSelectedExam] = useState(null);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    try {
      setLoading(true);
      setError("");

      const [examList, courseList] = await Promise.all([
        api.exams(),
        api.courses().catch(() => [])
      ]);

      setExams(Array.isArray(examList) ? examList : []);
      setCourses(Array.isArray(courseList) ? courseList : []);

    } catch (e) {
      setError(e.message || "Unable to load exams.");
    } finally {
      setLoading(false);
    }
  }

  const filtered = exams.filter(exam =>
    !search.trim() ||
    exam.title?.toLowerCase().includes(search.trim().toLowerCase()) ||
    exam.course?.title?.toLowerCase().includes(search.trim().toLowerCase())
  );

  if (loading) return <Loading />;

  return (
    <Page
      title="Exams"
      subtitle="View and prepare for your upcoming exams."
    >

      {error && <div className="error">{error}</div>}

      <div className="dash-search" style={{ maxWidth: 400, marginBottom: 20 }}>
        <span>🔍</span>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search exams..."
        />
      </div>

      {filtered.length === 0 ? (
        <Empty text="No exams scheduled yet." />
      ) : (
        <div className="quizzes-grid">
          {filtered.map(exam => {
            const now = new Date();
            const start = exam.startTime ? new Date(exam.startTime) : null;
            const end = exam.endTime ? new Date(exam.endTime) : null;
            const isUpcoming = start && start > now;
            const isOngoing = start && end && start <= now && end >= now;
            const isPast = end && end < now;

            return (
              <div className="card quiz-card" key={exam.id}>
                <div className="quiz-card-icon">🎓</div>

                <div className="quiz-card-head">
                  <span className="quiz-card-course">
                    {exam.course?.title || "General"}
                  </span>
                  <span className={`passed-badge ${
                    isOngoing ? "in-progress" : isPast ? "" : ""
                  }`} style={{
                    background: isOngoing ? "var(--success-light)" : isPast ? "var(--surface-soft)" : "var(--primary-light)",
                    color: isOngoing ? "var(--success)" : isPast ? "var(--text-muted)" : "var(--primary)"
                  }}>
                    {isOngoing ? "🔴 Live Now" : isUpcoming ? "📅 Upcoming" : isPast ? "✓ Completed" : exam.status || "Scheduled"}
                  </span>
                </div>

                <h2>{exam.title}</h2>
                <p>{exam.description || "Final examination for this course."}</p>

                <div className="quiz-card-meta">
                  <span>⏱ {exam.durationMinutes || 60} min</span>
                  <span>📊 {exam.totalMarks || 100} marks</span>
                  <span>✅ Pass: {exam.passingMarks || 40}</span>
                </div>

                {exam.startTime && (
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                    📅 {new Date(exam.startTime).toLocaleString()}
                    {exam.endTime && ` — ${new Date(exam.endTime).toLocaleString()}`}
                  </div>
                )}

                {exam.negativeMarking && (
                  <div style={{ fontSize: 12, color: "var(--danger)", marginTop: 4 }}>
                    ⚠️ Negative marking: -{exam.negativeMarkValue || 0.25} per wrong answer
                  </div>
                )}

                <button
                  className="primary quiz-take-btn"
                  onClick={() => setSelectedExam(exam)}
                >
                  View Details
                </button>
              </div>
            );
          })}
        </div>
      )}

      {selectedExam && (
        <div className="modal-overlay" onClick={() => setSelectedExam(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h3>🎓 {selectedExam.title}</h3>
              <button className="modal-close" onClick={() => setSelectedExam(null)}>✕</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, margin: "12px 0" }}>
              <div>
                <b style={{ fontSize: 12, color: "var(--text-muted)" }}>Course</b>
                <p style={{ margin: 0 }}>{selectedExam.course?.title || "—"}</p>
              </div>
              <div>
                <b style={{ fontSize: 12, color: "var(--text-muted)" }}>Duration</b>
                <p style={{ margin: 0 }}>{selectedExam.durationMinutes || 60} minutes</p>
              </div>
              <div>
                <b style={{ fontSize: 12, color: "var(--text-muted)" }}>Total Marks</b>
                <p style={{ margin: 0 }}>{selectedExam.totalMarks || 100}</p>
              </div>
              <div>
                <b style={{ fontSize: 12, color: "var(--text-muted)" }}>Passing Marks</b>
                <p style={{ margin: 0 }}>{selectedExam.passingMarks || 40}</p>
              </div>
              <div>
                <b style={{ fontSize: 12, color: "var(--text-muted)" }}>Start Time</b>
                <p style={{ margin: 0 }}>
                  {selectedExam.startTime ? new Date(selectedExam.startTime).toLocaleString() : "Not scheduled"}
                </p>
              </div>
              <div>
                <b style={{ fontSize: 12, color: "var(--text-muted)" }}>End Time</b>
                <p style={{ margin: 0 }}>
                  {selectedExam.endTime ? new Date(selectedExam.endTime).toLocaleString() : "Not scheduled"}
                </p>
              </div>
            </div>

            {selectedExam.description && (
              <div style={{ margin: "12px 0" }}>
                <b style={{ fontSize: 12, color: "var(--text-muted)" }}>Description</b>
                <p style={{ whiteSpace: "pre-wrap" }}>{selectedExam.description}</p>
              </div>
            )}

            {selectedExam.negativeMarking && (
              <div className="notice">
                ⚠️ This exam has negative marking: -{selectedExam.negativeMarkValue || 0.25} per wrong answer
              </div>
            )}
          </div>
        </div>
      )}

    </Page>
  );
}

export default Exams;
