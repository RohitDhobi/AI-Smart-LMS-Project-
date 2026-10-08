import React, { useEffect, useState } from "react";
import { api } from "../../services/api";

// =====================================================
// HOD - EXAM APPROVALS
//
// Route: /hod/exam-approvals
//
// Lists exams waiting for a decision, shows the full paper in the review
// screen and lets the HOD approve or reject (a rejection reason is required
// by the backend - HTTP 400 without one).
// =====================================================

function formatDateTime(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString([], {
    weekday: "short", day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function statusLabel(status) {
  const map = {
    DRAFT: "Draft",
    PENDING_HOD_APPROVAL: "Pending Approval",
    REJECTED: "Rejected",
    APPROVED: "Approved",
    PUBLISHED: "Published",
    COMPLETED: "Completed",
    SCHEDULED: "Scheduled",
  };
  return map[status] || status || "—";
}

function parsePaper(raw) {
  if (!raw) return null;
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch { return null; }
}

const FILTERS = [
  { value: "PENDING_HOD_APPROVAL", label: "Pending" },
  { value: "", label: "All" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "PUBLISHED", label: "Published" },
];

export default function HODExamApprovals() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [filter, setFilter] = useState("PENDING_HOD_APPROVAL");

  const [review, setReview] = useState(null);   // full exam detail
  const [reviewLoading, setReviewLoading] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [decisionBusy, setDecisionBusy] = useState(false);

  useEffect(() => { load(); }, [filter]);

  async function load() {
    try {
      setLoading(true);
      setError("");
      const data = await api.hodExamApprovals(filter || undefined);
      setExams(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Unable to load exam approvals.");
    } finally {
      setLoading(false);
    }
  }

  async function openReview(exam) {
    try {
      setReviewLoading(true);
      setRejecting(false);
      setRejectReason("");
      const detail = await api.hodExamApprovalDetail(exam.id);
      setReview(detail);
    } catch (err) {
      setError(err.message || "Unable to load this exam.");
    } finally {
      setReviewLoading(false);
    }
  }

  function closeReview() {
    setReview(null);
    setRejecting(false);
    setRejectReason("");
  }

  async function handleApprove() {
    if (!review) return;
    try {
      setDecisionBusy(true);
      setError("");
      const res = await api.hodApproveExam(review.id);
      setReview({
        ...review,
        status: "APPROVED",
        approvedBy: res.approvedBy,
        approvedByName: res.approvedByName,
        approvedAt: res.approvedAt,
      });
      setNotice(`"${review.title}" approved.`);
      load();
    } catch (err) {
      setError(err.message || "Failed to approve the exam.");
    } finally {
      setDecisionBusy(false);
    }
  }

  async function handleRejectConfirm() {
    if (!review) return;
    if (!rejectReason.trim()) {
      setError("A rejection reason is required - the instructor needs the feedback.");
      return;
    }
    try {
      setDecisionBusy(true);
      setError("");
      await api.hodRejectExam(review.id, rejectReason.trim());
      setReview({ ...review, status: "REJECTED", rejectionReason: rejectReason.trim() });
      setRejecting(false);
      setNotice(`"${review.title}" rejected - feedback sent to the instructor.`);
      load();
    } catch (err) {
      setError(err.message || "Failed to reject the exam.");
    } finally {
      setDecisionBusy(false);
    }
  }

  const paper = parsePaper(review?.questionPaper);

  return (
    <div className="page hod-exam-approvals">
      <div className="page-heading">
        <h1>Exam Approvals</h1>
        <p>Review exams submitted by instructors, then approve or reject them.</p>
      </div>

      {error && <div className="error" style={{ marginBottom: 14 }}>{error}</div>}
      {notice && <div className="notice" style={{ marginBottom: 14 }}>{notice}</div>}

      <div className="hod-actions" style={{ marginBottom: 18, display: "flex", gap: 8, flexWrap: "wrap" }}>
        {FILTERS.map((f) => (
          <button
            key={f.value || "all"}
            className={`inst-btn ${filter === f.value ? "inst-btn-primary" : "inst-btn-secondary"}`}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
        <button className="inst-btn inst-btn-secondary" onClick={load}>Refresh</button>
      </div>

      {loading ? (
        <div className="inst-loading">Loading exams...</div>
      ) : exams.length === 0 ? (
        <div className="card hod-empty">
          <div className="empty-icon">✅</div>
          <h3>No exams waiting for approval</h3>
          <p>Instructor-submitted exams will appear here for review.</p>
        </div>
      ) : (
        <div className="hod-table-wrap">
          <table className="hod-table">
            <thead>
              <tr>
                <th>Exam</th>
                <th>Instructor</th>
                <th>Subject</th>
                <th>Date</th>
                <th>Marks</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {exams.map((e) => (
                <tr key={e.id}>
                  <td>
                    <strong>{e.title}</strong>
                    {e.description && <span className="hod-sub">{e.description}</span>}
                  </td>
                  <td>{e.createdByName || "—"}</td>
                  <td>{e.subjectName || e.courseName || "—"}</td>
                  <td>{e.date ? formatDateTime(e.date) : "—"}</td>
                  <td>{e.totalMarks ?? "—"}</td>
                  <td>
                    <span className={`status-badge status-${(e.status || "").toLowerCase()}`}>
                      {statusLabel(e.status)}
                    </span>
                  </td>
                  <td className="hod-actions-cell">
                    <button
                      className="inst-btn inst-btn-primary inst-btn-small"
                      onClick={() => openReview(e)}
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ---------------- REVIEW MODAL ---------------- */}
      {(review || reviewLoading) && (
        <div className="qb-modal-overlay" onClick={closeReview}>
          <div
            className="qb-modal"
            style={{ maxWidth: 860, padding: 0, maxHeight: "90vh", overflowY: "auto" }}
            onClick={(ev) => ev.stopPropagation()}
          >
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "14px 20px", borderBottom: "1px solid var(--border)",
              position: "sticky", top: 0, background: "var(--surface)", zIndex: 2,
            }}>
              <h3 style={{ margin: 0 }}>Review Exam</h3>
              <button className="qb-cancel-btn" onClick={closeReview}>✕ Close</button>
            </div>

            {reviewLoading ? (
              <p style={{ padding: 20 }}>Loading exam…</p>
            ) : review && (
              <div style={{ padding: 20 }}>
                {/* ---- Exam details ---- */}
                <h2 style={{ marginTop: 0 }}>{review.title}</h2>
                {review.description && <p>{review.description}</p>}

                <div className="data-table-wrap">
                  <table className="data-table">
                    <tbody>
                      <tr><th>Subject / Course</th><td>{review.subjectName || review.courseName || "—"}</td></tr>
                      <tr><th>Instructor</th><td>{review.createdByName || "—"}</td></tr>
                      <tr><th>Exam Date</th><td>{review.date ? formatDateTime(review.date) : "—"}</td></tr>
                      <tr><th>Duration</th><td>{review.duration || "—"} minutes</td></tr>
                      <tr><th>Total Marks</th><td>{review.totalMarks ?? "—"}</td></tr>
                      <tr><th>Passing Marks</th><td>{review.passingMarks ?? "—"}</td></tr>
                      <tr>
                        <th>Status</th>
                        <td>
                          <span className={`status-badge status-${(review.status || "").toLowerCase()}`}>
                            {statusLabel(review.status)}
                          </span>
                        </td>
                      </tr>
                      {review.submittedAt && (
                        <tr><th>Submitted</th><td>{formatDateTime(review.submittedAt)}</td></tr>
                      )}
                      {review.status === "APPROVED" && (
                        <>
                          <tr><th>Approved By</th><td>{review.approvedByName || "—"}</td></tr>
                          <tr><th>Approved Date</th><td>{formatDateTime(review.approvedAt)}</td></tr>
                        </>
                      )}
                      {review.status === "REJECTED" && review.rejectionReason && (
                        <tr><th>Rejection Reason</th><td>{review.rejectionReason}</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* ---- Complete question paper ---- */}
                <h3 style={{ marginTop: 22 }}>Question Paper</h3>
                {paper && Array.isArray(paper.sections) ? (
                  <div className="paper-preview" style={{ boxShadow: "none", border: "1px solid var(--border)" }}>
                    <h1>{paper.title}</h1>
                    <h2>{paper.subject}</h2>
                    <div className="paper-meta">
                      <p>
                        <strong>Duration:</strong> {paper.duration} &nbsp;&nbsp;|&nbsp;&nbsp;
                        <strong> Maximum Marks:</strong> {paper.totalMarks} &nbsp;&nbsp;|&nbsp;&nbsp;
                        <strong> Difficulty:</strong> {paper.difficulty}
                      </p>
                    </div>
                    {paper.instructions && (
                      <p className="paper-section-instructions"><em>{paper.instructions}</em></p>
                    )}
                    {paper.sections.map((sec, si) => (
                      <div key={si} className="paper-section">
                        <h3>
                          {sec.name} &nbsp;
                          <span className="paper-section-marks">({sec.total} marks)</span>
                        </h3>
                        {sec.instructions && (
                          <p className="paper-section-instructions"><em>{sec.instructions}</em></p>
                        )}
                        {(sec.questions || []).map((q, qi) => (
                          <div key={qi} className="paper-q">
                            <span className="paper-q-num">Q{q.num}.</span>
                            <span>
                              {q.text}
                              {q.type === "mcq" && Array.isArray(q.options) && (
                                <div className="paper-mcq-options">
                                  {q.options.map((opt, oi) => (
                                    <span key={oi}>({'ABCD'[oi] || oi + 1}) {opt}</span>
                                  ))}
                                </div>
                              )}
                              <em style={{ fontSize: 12, color: "#666" }}>
                                ({q.marks} mark{q.marks !== 1 ? "s" : ""})
                              </em>
                            </span>
                            {q.orChoice && <div className="paper-or">OR &nbsp; {q.orChoice}</div>}
                          </div>
                        ))}
                      </div>
                    ))}
                    <div className="paper-total-footer">
                      <p>TOTAL: {paper.totalMarks} MARKS &nbsp;&nbsp;|&nbsp;&nbsp; {paper.totalQuestions} Questions</p>
                    </div>
                  </div>
                ) : (
                  <p style={{ color: "var(--text-secondary)" }}>
                    No question paper attached to this exam yet.
                  </p>
                )}

                {/* ---- Decisions ---- */}
                {review.status === "APPROVED" ? (
                  <div className="notice" style={{ marginTop: 18 }}>
                    ✓ <strong>Exam approved by HOD</strong>
                    {review.approvedByName ? <> — Approved By: {review.approvedByName}</> : null}
                    {review.approvedAt ? <> — Approved Date: {formatDateTime(review.approvedAt)}</> : null}
                    <div style={{ fontSize: 13, marginTop: 4 }}>
                      The instructor can now publish this exam to students.
                    </div>
                  </div>
                ) : review.status === "REJECTED" ? (
                  <div className="error" style={{ marginTop: 18 }}>
                    <strong>Rejected</strong> — {review.rejectionReason || "No reason recorded."}
                  </div>
                ) : (
                  <div style={{ marginTop: 20, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-start" }}>
                    <button
                      className="inst-btn inst-btn-primary"
                      disabled={decisionBusy}
                      onClick={handleApprove}
                    >
                      {decisionBusy ? "Working..." : "Approve Exam"}
                    </button>

                    {!rejecting ? (
                      <button
                        className="inst-btn inst-btn-secondary"
                        disabled={decisionBusy}
                        onClick={() => { setRejecting(true); setError(""); }}
                        style={{ background: "#fee2e2", color: "#b91c1c" }}
                      >
                        Reject Exam
                      </button>
                    ) : (
                      <div style={{ flex: 1, minWidth: 280 }}>
                        <label style={{ display: "block", fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                          Rejection Reason *
                        </label>
                        <textarea
                          rows={3}
                          autoFocus
                          placeholder='e.g. "Section C contains insufficient 3-mark questions."'
                          value={rejectReason}
                          onChange={(ev) => setRejectReason(ev.target.value)}
                          style={{ width: "100%" }}
                        />
                        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                          <button
                            className="inst-btn inst-btn-primary"
                            disabled={decisionBusy || !rejectReason.trim()}
                            onClick={handleRejectConfirm}
                            style={{ background: "#dc2626" }}
                          >
                            Confirm Rejection
                          </button>
                          <button
                            className="inst-btn inst-btn-secondary"
                            disabled={decisionBusy}
                            onClick={() => { setRejecting(false); setRejectReason(""); setError(""); }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
