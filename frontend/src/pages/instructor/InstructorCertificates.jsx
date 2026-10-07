import React, { useEffect, useState, useCallback } from "react";
import { api } from "../../api";

export default function InstructorCertificates() {
  // =========================
  // STATE
  // =========================

  const [stats, setStats] = useState(null);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [students, setStudents] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [activeTab, setActiveTab] = useState("eligibility"); // eligibility | issued | verify | analytics
  const [verifyId, setVerifyId] = useState("");
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifyLoading, setVerifyLoading] = useState(false);

  // Revoke modal
  const [revokeModal, setRevokeModal] = useState(null);
  const [revokeReason, setRevokeReason] = useState("");
  const [revokeLoading, setRevokeLoading] = useState(false);

  // Generate feedback
  const [generating, setGenerating] = useState(null);

  // =========================
  // LOAD DATA
  // =========================

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [statsData, coursesData, certsData] = await Promise.all([
        api.instructorCertStats().catch(() => null),
        api.instructorCertCourses().catch(() => []),
        api.instructorCertAll().catch(() => []),
      ]);
      setStats(statsData);
      setCourses(Array.isArray(coursesData) ? coursesData : []);
      setCertificates(Array.isArray(certsData) ? certsData : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const loadStudents = useCallback(async (courseId) => {
    if (!courseId) {
      setStudents([]);
      return;
    }
    try {
      setLoadingStudents(true);
      const data = await api.instructorCertStudents(courseId);
      setStudents(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      loadStudents(selectedCourse);
    }
  }, [selectedCourse, loadStudents]);

  // =========================
  // GENERATE CERTIFICATE
  // =========================

  async function handleGenerate(courseId, studentId) {
    try {
      setGenerating(studentId);
      await api.instructorCertGenerate(courseId, studentId);
      // Reload students and certificates
      await loadStudents(courseId);
      const certsData = await api.instructorCertAll().catch(() => []);
      setCertificates(Array.isArray(certsData) ? certsData : []);
      const statsData = await api.instructorCertStats().catch(() => null);
      setStats(statsData);
    } catch (e) {
      alert(e.message || "Failed to generate certificate");
    } finally {
      setGenerating(null);
    }
  }

  // =========================
  // REVOKE CERTIFICATE
  // =========================

  async function handleRevoke() {
    if (!revokeModal) return;
    try {
      setRevokeLoading(true);
      await api.instructorCertRevoke(revokeModal.id, revokeReason);
      setRevokeModal(null);
      setRevokeReason("");
      // Reload
      const certsData = await api.instructorCertAll().catch(() => []);
      setCertificates(Array.isArray(certsData) ? certsData : []);
      const statsData = await api.instructorCertStats().catch(() => null);
      setStats(statsData);
      if (selectedCourse) loadStudents(selectedCourse);
    } catch (e) {
      alert(e.message || "Failed to revoke certificate");
    } finally {
      setRevokeLoading(false);
    }
  }

  // =========================
  // VERIFY CERTIFICATE
  // =========================

  async function handleVerify() {
    if (!verifyId.trim()) return;
    try {
      setVerifyLoading(true);
      setVerifyResult(null);
      const result = await api.instructorCertVerify(verifyId.trim());
      setVerifyResult(result);
    } catch (e) {
      setVerifyResult({ valid: false, error: e.message || "Certificate not found" });
    } finally {
      setVerifyLoading(false);
    }
  }

  // =========================
  // FILTERING
  // =========================

  const filteredCerts = certificates.filter((c) => {
    if (statusFilter !== "ALL" && c.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        c.certificateId?.toLowerCase().includes(q) ||
        c.user?.name?.toLowerCase().includes(q) ||
        c.course?.title?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const filteredStudents = students.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.studentName?.toLowerCase().includes(q) ||
      s.studentEmail?.toLowerCase().includes(q)
    );
  });

  // =========================
  // RENDER
  // =========================

  if (loading) {
    return <div className="inst-loading">Loading certificates...</div>;
  }

  return (
    <div className="inst-page">
      {/* HEADER */}
      <div className="inst-page-header">
        <div>
          <h1>🏆 Certificates</h1>
          <p>Manage course certificates, eligibility, and verification.</p>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      {stats && (
        <div className="inst-stats-grid">
          <div className="inst-stat-card" style={{ borderLeft: "4px solid #3b82f6" }}>
            <div className="inst-stat-icon" style={{ background: "#eff6ff", color: "#3b82f6" }}>🏆</div>
            <div className="inst-stat-info">
              <strong>{stats.totalIssued || 0}</strong>
              <span>Total Issued</span>
            </div>
          </div>
          <div className="inst-stat-card" style={{ borderLeft: "4px solid #f59e0b" }}>
            <div className="inst-stat-icon" style={{ background: "#fffbeb", color: "#f59e0b" }}>📅</div>
            <div className="inst-stat-info">
              <strong>{stats.thisMonth || 0}</strong>
              <span>This Month</span>
            </div>
          </div>
          <div className="inst-stat-card" style={{ borderLeft: "4px solid #16a34a" }}>
            <div className="inst-stat-icon" style={{ background: "#f0fdf4", color: "#16a34a" }}>🎓</div>
            <div className="inst-stat-info">
              <strong>{stats.eligibleStudents || 0}</strong>
              <span>Eligible Students</span>
            </div>
          </div>
          <div className="inst-stat-card" style={{ borderLeft: "4px solid #dc2626" }}>
            <div className="inst-stat-icon" style={{ background: "#fef2f2", color: "#dc2626" }}>🚫</div>
            <div className="inst-stat-info">
              <strong>{stats.totalRevoked || 0}</strong>
              <span>Revoked</span>
            </div>
          </div>
        </div>
      )}

      {/* TABS */}
      <div className="inst-tabs">
        {[
          { key: "eligibility", label: "📋 Eligibility & Generate" },
          { key: "issued", label: "🏆 Issued Certificates" },
          { key: "verify", label: "🔐 Verify Certificate" },
          { key: "analytics", label: "📊 Analytics" },
        ].map((tab) => (
          <button
            key={tab.key}
            className={`inst-tab ${activeTab === tab.key ? "active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* SEARCH BAR */}
      <div className="inst-filters">
        <input
          className="inst-input"
          placeholder="🔍 Search students or certificates..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 340 }}
        />
        {activeTab === "issued" && (
          <div className="inst-filter-chips">
            {["ALL", "VALID", "REVOKED", "EXPIRED"].map((s) => (
              <button
                key={s}
                className={`inst-chip ${statusFilter === s ? "active" : ""}`}
                onClick={() => setStatusFilter(s)}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* =================== TAB: ELIGIBILITY =================== */}
      {activeTab === "eligibility" && (
        <div className="inst-section">
          <div className="inst-section-header">
            <h2>Course Eligibility Check</h2>
          </div>

          {/* Course Selector */}
          <div className="inst-form-group" style={{ maxWidth: 400, marginBottom: 20 }}>
            <label>Select Course</label>
            <select
              className="inst-select"
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
            >
              <option value="">-- Choose a course --</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          {!selectedCourse && (
            <div className="inst-empty">
              <div className="inst-empty-icon">📋</div>
              <h3>Select a Course</h3>
              <p>Choose a course above to check student eligibility for certificates.</p>
            </div>
          )}

          {selectedCourse && loadingStudents && (
            <div className="inst-loading">Loading students...</div>
          )}

          {selectedCourse && !loadingStudents && filteredStudents.length === 0 && (
            <div className="inst-empty">
              <div className="inst-empty-icon">👨‍🎓</div>
              <h3>No Students Found</h3>
              <p>No students are enrolled in this course yet.</p>
            </div>
          )}

          {selectedCourse && !loadingStudents && filteredStudents.length > 0 && (
            <div className="card">
              <div className="data-table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Lessons</th>
                      <th>Quiz Avg</th>
                      <th>Assignments</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((s, idx) => (
                      <tr key={idx}>
                        <td>
                          <div>
                            <strong>{s.studentName || "Student"}</strong>
                            <br />
                            <small style={{ color: "var(--text-muted)" }}>{s.studentEmail}</small>
                          </div>
                        </td>
                        <td>
                          <span className={`inst-cert-badge ${s.lessonProgress >= 100 ? "badge-pass" : "badge-fail"}`}>
                            {s.completedLessons}/{s.totalLessons} ({Math.round(s.lessonProgress || 0)}%)
                          </span>
                        </td>
                        <td>
                          <span className={`inst-cert-badge ${(s.avgQuizScore || 0) >= 60 ? "badge-pass" : "badge-fail"}`}>
                            {(s.avgQuizScore || 0).toFixed(1)}%
                          </span>
                        </td>
                        <td>
                          <span className="inst-cert-badge badge-info">
                            {s.totalAssignments || 0} total
                          </span>
                        </td>
                        <td>
                          {s.alreadyIssued ? (
                            <span className="inst-status-badge status-issued">Issued</span>
                          ) : s.eligible ? (
                            <span className="inst-status-badge status-eligible">Eligible</span>
                          ) : (
                            <span className="inst-status-badge status-not-eligible">Not Eligible</span>
                          )}
                        </td>
                        <td>
                          {s.alreadyIssued ? (
                            <span style={{ color: "var(--text-muted)", fontSize: 13 }}>✓ Already Issued</span>
                          ) : s.eligible ? (
                            <button
                              className="inst-btn inst-btn-primary inst-btn-sm"
                              disabled={generating === s.studentEmail}
                              onClick={() => handleGenerate(selectedCourse, s.studentId || idx)}
                            >
                              {generating === s.studentEmail ? "Generating..." : "Generate"}
                            </button>
                          ) : (
                            <span style={{ color: "var(--text-muted)", fontSize: 13 }}>—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Eligibility Requirements */}
          {selectedCourse && !loadingStudents && filteredStudents.length > 0 && (
            <div className="card" style={{ marginTop: 16 }}>
              <h3>📋 Automatic Eligibility Requirements</h3>
              <div className="inst-eligibility-rules">
                <div className="inst-rule">
                  <span className="inst-rule-icon">✅</span>
                  <span>Course completion: <strong>100%</strong></span>
                </div>
                <div className="inst-rule">
                  <span className="inst-rule-icon">✅</span>
                  <span>All lessons completed: <strong>100%</strong></span>
                </div>
                <div className="inst-rule">
                  <span className="inst-rule-icon">✅</span>
                  <span>Required quizzes passed: <strong>60% minimum</strong></span>
                </div>
                <div className="inst-rule">
                  <span className="inst-rule-icon">✅</span>
                  <span>Assignment completed: <strong>All submitted</strong></span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =================== TAB: ISSUED CERTIFICATES =================== */}
      {activeTab === "issued" && (
        <div className="inst-section">
          <div className="inst-section-header">
            <h2>Issued Certificates ({filteredCerts.length})</h2>
          </div>

          {filteredCerts.length === 0 ? (
            <div className="inst-empty">
              <div className="inst-empty-icon">🏆</div>
              <h3>No Certificates Found</h3>
              <p>Generate certificates from the Eligibility tab, or adjust your filters.</p>
            </div>
          ) : (
            <div className="card">
              <div className="data-table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Certificate ID</th>
                      <th>Student</th>
                      <th>Course</th>
                      <th>Score</th>
                      <th>Issued</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCerts.map((c) => (
                      <tr key={c.id}>
                        <td>
                          <code className="inst-cert-code">{c.certificateId}</code>
                        </td>
                        <td><strong>{c.user?.name || "—"}</strong></td>
                        <td>{c.course?.title || "—"}</td>
                        <td>{c.score != null ? `${c.score.toFixed(1)}%` : "—"}</td>
                        <td>{c.issuedAt ? new Date(c.issuedAt).toLocaleDateString() : "—"}</td>
                        <td>
                          <span className={`inst-status-badge status-${c.status?.toLowerCase()}`}>
                            {c.status}
                          </span>
                        </td>
                        <td>
                          <div className="inst-actions">
                            {c.status === "VALID" && (
                              <button
                                className="inst-btn inst-btn-danger inst-btn-sm"
                                onClick={() => setRevokeModal(c)}
                              >
                                Revoke
                              </button>
                            )}
                            <button
                              className="inst-btn inst-btn-secondary inst-btn-sm"
                              onClick={() => {
                                setVerifyId(c.certificateId);
                                setActiveTab("verify");
                              }}
                            >
                              Verify
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =================== TAB: VERIFY =================== */}
      {activeTab === "verify" && (
        <div className="inst-section">
          <div className="inst-section-header">
            <h2>🔐 Certificate Verification</h2>
          </div>

          <div className="card" style={{ maxWidth: 520 }}>
            <p style={{ marginBottom: 14, fontSize: 14 }}>
              Enter a certificate ID to verify its authenticity.
            </p>
            <div className="inst-verify-form">
              <input
                className="inst-input"
                placeholder="e.g. LMS-BCA-2026-000001"
                value={verifyId}
                onChange={(e) => setVerifyId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleVerify()}
              />
              <button
                className="inst-btn inst-btn-primary"
                onClick={handleVerify}
                disabled={verifyLoading || !verifyId.trim()}
              >
                {verifyLoading ? "Verifying..." : "Verify"}
              </button>
            </div>

            {verifyResult && (
              <div className={`inst-verify-result ${verifyResult.valid ? "valid" : "invalid"}`}>
                {verifyResult.valid ? (
                  <>
                    <div className="inst-verify-icon">✅</div>
                    <h3>Certificate Valid</h3>
                    <div className="inst-verify-details">
                      <div className="inst-verify-row">
                        <span>Student</span>
                        <strong>{verifyResult.studentName}</strong>
                      </div>
                      <div className="inst-verify-row">
                        <span>Course</span>
                        <strong>{verifyResult.courseTitle}</strong>
                      </div>
                      <div className="inst-verify-row">
                        <span>Score</span>
                        <strong>{verifyResult.score?.toFixed(1)}%</strong>
                      </div>
                      <div className="inst-verify-row">
                        <span>Issued</span>
                        <strong>{verifyResult.issuedAt ? new Date(verifyResult.issuedAt).toLocaleDateString() : "—"}</strong>
                      </div>
                      <div className="inst-verify-row">
                        <span>Instructor</span>
                        <strong>{verifyResult.instructorName}</strong>
                      </div>
                      <div className="inst-verify-row">
                        <span>Status</span>
                        <strong style={{ color: "var(--success)" }}>Valid</strong>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="inst-verify-icon">⚠️</div>
                    <h3>Certificate {verifyResult.status === "REVOKED" ? "Revoked" : "Invalid"}</h3>
                    {verifyResult.status === "REVOKED" && (
                      <div className="inst-verify-details">
                        <div className="inst-verify-row">
                          <span>Student</span>
                          <strong>{verifyResult.studentName}</strong>
                        </div>
                        <div className="inst-verify-row">
                          <span>Course</span>
                          <strong>{verifyResult.courseTitle}</strong>
                        </div>
                        <div className="inst-verify-row">
                          <span>Revoked</span>
                          <strong>{verifyResult.revokedAt ? new Date(verifyResult.revokedAt).toLocaleDateString() : "—"}</strong>
                        </div>
                        <div className="inst-verify-row">
                          <span>Reason</span>
                          <strong>{verifyResult.revocationReason || "No reason provided"}</strong>
                        </div>
                      </div>
                    )}
                    {verifyResult.error && (
                      <p style={{ marginTop: 10, color: "var(--text-secondary)" }}>{verifyResult.error}</p>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =================== TAB: ANALYTICS =================== */}
      {activeTab === "analytics" && (
        <div className="inst-section">
          <div className="inst-section-header">
            <h2>📊 Certificate Analytics</h2>
          </div>

          <div className="inst-analytics-grid">
            {/* Overall Stats */}
            <div className="card">
              <h3>Overall Statistics</h3>
              <div className="inst-analytics-bars">
                <div className="inst-analytics-bar-row">
                  <span>Total Issued</span>
                  <div className="inst-analytics-bar">
                    <div
                      className="inst-analytics-bar-fill blue"
                      style={{ width: `${stats?.totalIssued ? 100 : 0}%` }}
                    />
                  </div>
                  <strong>{stats?.totalIssued || 0}</strong>
                </div>
                <div className="inst-analytics-bar-row">
                  <span>Valid</span>
                  <div className="inst-analytics-bar">
                    <div
                      className="inst-analytics-bar-fill green"
                      style={{ width: `${stats?.totalIssued ? (stats.totalValid / stats.totalIssued) * 100 : 0}%` }}
                    />
                  </div>
                  <strong>{stats?.totalValid || 0}</strong>
                </div>
                <div className="inst-analytics-bar-row">
                  <span>Revoked</span>
                  <div className="inst-analytics-bar">
                    <div
                      className="inst-analytics-bar-fill red"
                      style={{ width: `${stats?.totalIssued ? (stats.totalRevoked / stats.totalIssued) * 100 : 0}%` }}
                    />
                  </div>
                  <strong>{stats?.totalRevoked || 0}</strong>
                </div>
                <div className="inst-analytics-bar-row">
                  <span>This Month</span>
                  <div className="inst-analytics-bar">
                    <div
                      className="inst-analytics-bar-fill orange"
                      style={{ width: `${stats?.totalIssued ? (stats.thisMonth / stats.totalIssued) * 100 : 0}%` }}
                    />
                  </div>
                  <strong>{stats?.thisMonth || 0}</strong>
                </div>
              </div>
            </div>

            {/* By Course */}
            <div className="card">
              <h3>Certificates by Course</h3>
              {courses.length === 0 ? (
                <p style={{ fontSize: 13, color: "var(--text-muted)" }}>No courses found.</p>
              ) : (
                <div className="inst-analytics-bars">
                  {courses.map((course) => {
                    const count = certificates.filter(
                      (c) => c.course?.id === course.id
                    ).length;
                    const maxCount = Math.max(
                      ...courses.map((co) =>
                        certificates.filter((c) => c.course?.id === co.id).length
                      ),
                      1
                    );
                    return (
                      <div key={course.id} className="inst-analytics-bar-row">
                        <span style={{ minWidth: 160, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {course.title}
                        </span>
                        <div className="inst-analytics-bar">
                          <div
                            className="inst-analytics-bar-fill blue"
                            style={{ width: `${(count / maxCount) * 100}%` }}
                          />
                        </div>
                        <strong>{count}</strong>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Certificate Workflow */}
            <div className="card" style={{ gridColumn: "1 / -1" }}>
              <h3>🔥 Certificate Workflow</h3>
              <div className="inst-workflow">
                {["Course", "Lessons", "Progress", "Quiz", "Eligibility", "Certificate", "QR Verify"].map(
                  (step, i, arr) => (
                    <React.Fragment key={step}>
                      <div className="inst-workflow-step">
                        <div className="inst-workflow-step-icon">
                          {i === 0 ? "📚" : i === 1 ? "📖" : i === 2 ? "📊" : i === 3 ? "❓" : i === 4 ? "✅" : i === 5 ? "🏆" : "🔐"}
                        </div>
                        <span>{step}</span>
                      </div>
                      {i < arr.length - 1 && <div className="inst-workflow-arrow">→</div>}
                    </React.Fragment>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================== REVOKE MODAL =================== */}
      {revokeModal && (
        <div className="inst-modal-overlay" onClick={() => setRevokeModal(null)}>
          <div className="inst-modal" onClick={(e) => e.stopPropagation()}>
            <h2>⚠️ Revoke Certificate</h2>
            <p style={{ fontSize: 14, marginBottom: 16 }}>
              Are you sure you want to revoke the certificate for <strong>{revokeModal.user?.name}</strong>?
              This action cannot be undone.
            </p>

            <div className="inst-form-group">
              <label>Reason for Revocation</label>
              <select
                className="inst-select"
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
              >
                <option value="">Select a reason...</option>
                <option value="Academic misconduct">Academic misconduct</option>
                <option value="Incorrect issuance">Incorrect issuance</option>
                <option value="Fraudulent submission">Fraudulent submission</option>
                <option value="Policy violation">Policy violation</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {revokeReason === "Other" && (
              <div className="inst-form-group">
                <label>Custom Reason</label>
                <textarea
                  className="inst-textarea"
                  placeholder="Enter reason..."
                  value={revokeReason === "Other" ? "" : revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                />
              </div>
            )}

            <div className="inst-modal-actions">
              <button
                className="inst-btn inst-btn-secondary"
                onClick={() => setRevokeModal(null)}
              >
                Cancel
              </button>
              <button
                className="inst-btn inst-btn-danger"
                onClick={handleRevoke}
                disabled={revokeLoading || !revokeReason}
              >
                {revokeLoading ? "Revoking..." : "Confirm Revocation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
