import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { Loading, Empty, Page } from "../ui";

function AdminStudents() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [resetModal, setResetModal] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetting, setResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      setLoading(true);
      setError("");
      const profile = await api.profile();
      if (profile?.role !== "ADMIN") {
        setError("Access denied. Admin role required.");
        return;
      }
      const userList = await api.adminUsers();
      // Filter to only STUDENT role
      const students = Array.isArray(userList)
        ? userList.filter((u) => u.role === "STUDENT")
        : [];
      setUsers(students);
    } catch (e) {
      setError(e.message || "Unable to load users.");
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(user) {
    try {
      setError("");
      await api.adminSetActive(user.id, !user.active);
      setUsers((current) =>
        current.map((item) =>
          Number(item.id) === Number(user.id)
            ? { ...item, active: !item.active }
            : item
        )
      );
    } catch (e) {
      setError(e.message || "Update failed.");
    }
  }

  async function removeUser(user) {
    if (!window.confirm(`Delete student "${user.name}" (${user.email})?`)) return;
    try {
      setError("");
      await api.adminDeleteUser(user.id);
      setUsers((current) =>
        current.filter((item) => Number(item.id) !== Number(user.id))
      );
    } catch (e) {
      setError(e.message || "Delete failed.");
    }
  }

  async function handleResetPassword() {
    if (!resetModal || !newPassword || newPassword.length < 6) return;
    try {
      setResetting(true);
      setError("");
      await api.adminResetPassword(resetModal.id, newPassword);
      setResetSuccess(`Password reset successfully for "${resetModal.name}"`);
      setResetModal(null);
      setNewPassword("");
      setTimeout(() => setResetSuccess(""), 5000);
    } catch (e) {
      setError(e.message || "Password reset failed.");
    } finally {
      setResetting(false);
    }
  }

  const filtered = users.filter((u) => {
    const matchesSearch =
      !searchTerm ||
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && u.active) ||
      (filterStatus === "inactive" && !u.active);
    return matchesSearch && matchesStatus;
  });

  const activeCount = users.filter((u) => u.active).length;
  const inactiveCount = users.filter((u) => !u.active).length;

  if (loading) return <Loading />;

  return (
    <Page
      title="👨‍🎓 Manage Students"
      subtitle="View and manage student accounts."
    >
      {error && <div className="error">{error}</div>}
      {resetSuccess && <div className="notice">{resetSuccess}</div>}

      {/* Stats */}
      <div className="analytics-stats" style={{ marginBottom: 20 }}>
        <div className="card analytics-stat tint-blue">
          <span className="analytics-stat-icon">👨‍🎓</span>
          <div className="analytics-stat-text">
            <strong>{users.length}</strong>
            <span>Total Students</span>
          </div>
        </div>
        <div className="card analytics-stat tint-green">
          <span className="analytics-stat-icon">✅</span>
          <div className="analytics-stat-text">
            <strong>{activeCount}</strong>
            <span>Active</span>
          </div>
        </div>
        <div className="card analytics-stat tint-orange">
          <span className="analytics-stat-icon">⏸️</span>
          <div className="analytics-stat-text">
            <strong>{inactiveCount}</strong>
            <span>Inactive</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="admin-quick-links" style={{ marginBottom: 20 }}>
        <Link className="primary button-link" to="/admin">
          ← Back to Dashboard
        </Link>
        <Link className="secondary button-link" to="/admin/teachers">
          🧑‍🏫 Manage Teachers →
        </Link>
      </div>

      {/* Filters */}
      <div className="inst-filters" style={{ marginBottom: 20 }}>
        <div className="inst-search-wrapper">
          <span className="inst-search-icon">🔍</span>
          <input
            className="inst-input"
            placeholder="Search students by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="inst-input"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{ maxWidth: 160 }}
        >
          <option value="all">All Status</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>
      </div>

      {/* Users Table */}
      <section className="card">
        <div className="dash-panel-head">
          <h3>Students</h3>
          <span>{filtered.length} total</span>
        </div>

        {filtered.length === 0 ? (
          <Empty
            text={
              users.length === 0
                ? "No students found."
                : "No students match your search."
            }
          />
        ) : (
          <div className="mobile-cards">
            {filtered.map((user) => (
              <div key={user.id} className="mobile-user-card">
                <div className="mobile-user-card-header">
                  <div className="mobile-user-avatar">
                    {(user.name || "U")[0].toUpperCase()}
                  </div>
                  <div className="mobile-user-info">
                    <strong>{user.name}</strong>
                    <span className="user-login-id">🔑 ID: {user.email}</span>
                  </div>
                </div>
                <div className="mobile-user-card-details">
                  <div className="mobile-user-detail">
                    <span className="mobile-detail-label">User ID</span>
                    <span className="mobile-detail-value">#{user.id}</span>
                  </div>
                  <div className="mobile-user-detail">
                    <span className="mobile-detail-label">Course</span>
                    <span className="mobile-detail-value">{user.courseName || user.courseCode || "—"}</span>
                  </div>
                  <div className="mobile-user-detail">
                    <span className="mobile-detail-label">Status</span>
                    <span className={`mobile-user-status ${user.active ? "active" : "inactive"}`}>
                      {user.active ? "● Active" : "● Inactive"}
                    </span>
                  </div>
                </div>
                <div className="mobile-user-card-actions">
                  <button className="primary small" onClick={() => { setResetModal(user); setNewPassword(""); }}>
                    🔑 Reset Password
                  </button>
                  <button className="secondary small" onClick={() => toggleActive(user)}>
                    {user.active ? "Deactivate" : "Activate"}
                  </button>
                  <button className="danger small" onClick={() => removeUser(user)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Reset Password Modal */}
      {resetModal && (
        <div className="modal-overlay" onClick={() => setResetModal(null)}>
          <div className="modal-content card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420, margin: "10% auto" }}>
            <div className="dash-panel-head">
              <h3>🔑 Reset Password</h3>
            </div>
            <p style={{ margin: "0 0 12px", fontSize: "13.5px", color: "var(--text-secondary)" }}>
              Set a new password for <strong>{resetModal.name}</strong> ({resetModal.email})
            </p>
            <div className="form-field">
              <label>New Password *</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 6 characters"
                minLength={6}
                autoFocus
              />
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button className="primary" onClick={handleResetPassword} disabled={resetting || newPassword.length < 6}>
                {resetting ? "Resetting..." : "Reset Password"}
              </button>
              <button className="secondary" onClick={() => setResetModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </Page>
  );
}

export default AdminStudents;
