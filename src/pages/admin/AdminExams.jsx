import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";
import { Loading, Empty, Page } from "../../ui";

// Statuses the admin may force an exam into (mirrors the backend switch).
const OVERRIDE_STATUSES = [
  "DRAFT",
  "PENDING_HOD_APPROVAL",
  "REJECTED",
  "APPROVED",
  "PUBLISHED",
  "COMPLETED",
];

const STATUS_LABELS = {
  DRAFT: "Draft",
  PENDING_HOD_APPROVAL: "Pending HOD Approval",
  REJECTED: "Rejected",
  APPROVED: "Approved",
  PUBLISHED: "Published",
  COMPLETED: "Completed",
  SCHEDULED: "Scheduled",
};

function formatDateTime(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString([], {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function AdminExams() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      setLoading(true);
      const e = await api.exams().catch(() => []);
      setExams(Array.isArray(e) ? e : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  // ADMIN: override/manage an exam's status if required.
  async function overrideStatus(exam, status) {
    if (!status || status === exam.status) return;
    try {
      setError("");
      await api.adminSetExamStatus(exam.id, status);
      setNotice(`"${exam.title}" set to ${STATUS_LABELS[status] || status}.`);
      loadData();
    } catch (err) {
      setError(err.message || "Failed to update the exam status.");
    }
  }

  const filtered = exams.filter((e) => !search || e.title?.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <Loading />;

  return (
    <Page title="🎓 Exams" subtitle="View all exams across courses and override status if required.">
      <div className="admin-quick-links" style={{ marginBottom: 20 }}>
        <Link className="primary button-link" to="/admin">← Back to Dashboard</Link>
      </div>

      {error && <div className="error" style={{ marginBottom: 14 }}>{error}</div>}
      {notice && <div className="notice" style={{ marginBottom: 14 }}>{notice}</div>}

      <input placeholder="🔍 Search exams..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 300, padding: "8px 12px", fontSize: 13, marginBottom: 20 }} />

      <div className="card">
        <div className="dash-panel-head">
          <h3>Exams ({filtered.length})</h3>
        </div>
        {filtered.length === 0 ? <Empty text="No exams found." /> : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Created By</th>
                  <th>Duration</th>
                  <th>Total Marks</th>
                  <th>Status</th>
                  <th>Override</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <tr key={e.id}>
                    <td>{e.id}</td>
                    <td>
                      <strong>{e.title}</strong>
                      {e.rejectionReason && e.status === "REJECTED" && (
                        <div style={{ fontSize: 12, color: "#b91c1c" }}>
                          Feedback: {e.rejectionReason}
                        </div>
                      )}
                      {e.status === "APPROVED" && e.approvedAt && (
                        <div style={{ fontSize: 12, color: "#16a34a" }}>
                          ✓ {e.approvedByName ? `${e.approvedByName} · ` : ""}{formatDateTime(e.approvedAt)}
                        </div>
                      )}
                    </td>
                    <td>{e.createdByName || "—"}</td>
                    <td>{e.durationMinutes ? `${e.durationMinutes} min` : e.duration ? `${e.duration} min` : "—"}</td>
                    <td>{e.totalMarks || "—"}</td>
                    <td>
                      <span className={`status-badge status-${(e.status || "").toLowerCase()}`}>
                        {STATUS_LABELS[e.status] || e.status || "—"}
                      </span>
                    </td>
                    <td>
                      <select
                        value={e.status || ""}
                        onChange={(ev) => overrideStatus(e, ev.target.value)}
                        style={{ width: "auto", padding: "6px 8px", fontSize: 12.5 }}
                      >
                        {[...OVERRIDE_STATUSES, e.status]
                          .filter((s, i, arr) => s && arr.indexOf(s) === i)
                          .map((s) => (
                            <option key={s} value={s}>{STATUS_LABELS[s] || s}</option>
                          ))}
                      </select>
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
