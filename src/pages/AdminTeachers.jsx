import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { Loading, Empty, Page } from "../ui";

function AdminTeachers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Create instructor form
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    bio: "",
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
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
      // Filter to only INSTRUCTOR role
      const instructors = Array.isArray(userList)
        ? userList.filter((u) => u.role === "INSTRUCTOR")
        : [];
      setUsers(instructors);
    } catch (e) {
      setError(e.message || "Unable to load users.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    try {
      setSaving(true);
      setError("");
      setSuccess("");
      const result = await api.adminCreateInstructor(form);
      setUsers((current) => [...current, result]);
      setSuccess(
        `Instructor "${result.name}" created successfully! They can login at /staff-login`
      );
      setForm({ name: "", email: "", password: "", phone: "", bio: "" });
      setShowForm(false);
      setTimeout(() => setSuccess(""), 5000);
    } catch (e) {
      setError(e.message || "Failed to create instructor.");
    } finally {
      setSaving(false);
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
    if (!window.confirm(`Delete instructor "${user.name}" (${user.email})?`)) return;
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
      title="🧑‍🏫 Manage Teachers"
      subtitle="Create and manage instructor accounts."
    >
      {error && <div className="error">{error}</div>}
      {success && <div className="notice">{success}</div>}
      {resetSuccess && <div className="notice">{resetSuccess}</div>}

      {/* Stats */}
      <div className="analytics-stats" style={{ marginBottom: 20 }}>
        <div className="card analytics-stat tint-blue">
          <span className="analytics-stat-icon">🧑‍🏫</span>
          <div className="analytics-stat-text">
            <strong>{users.length}</strong>
            <span>Total Teachers</span>
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

      {/* Pending approvals (instructors who signed up themselves) */}
      {inactiveCount > 0 && (
        <div className="notice" style={{ marginBottom: 20 }}>
          ⏸️ {inactiveCount} instructor account{" "}
          {inactiveCount === 1 ? "is" : "are"} inactive / awaiting approval —
          use the status filter below (Inactive) to review and activate them.
        </div>
      )}

      {/* Quick Actions */}
      <div className="admin-quick-links" style={{ marginBottom: 20 }}>
        <Link className="primary button-link" to="/admin">
          ← Back to Dashboard
        </Link>
        <button
          className="secondary button-link"
          onClick={() => setShowForm(!showForm)}
        >
          🧑‍🏫 {showForm ? "Close Form" : "Create Instructor"}
        </button>
        <Link className="secondary button-link" to="/admin/students">
          👨‍🎓 Manage Students →
        </Link>
      </div>

      {/* Create Form */}
      {showForm && (
        <section className="card instructor-form-card">
          <div className="dash-panel-head">
            <h3>🧑‍🏫 Create Instructor Account</h3>
          </div>
          <p
            style={{
              margin: "0 0 16px",
              fontSize: "13.5px",
              color: "var(--text-secondary)",
            }}
          >
            Create a new teacher/instructor account. They can login via the
            staff login page.
          </p>
          <form onSubmit={handleCreate} className="instructor-form">
            <div className="form-grid">
              <div className="form-field">
                <label>Full Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Dr. Smith"
                  required
                />
              </div>
              <div className="form-field">
                <label>Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="teacher@example.com"
                  required
                />
              </div>
              <div className="form-field">
                <label>Password *</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  placeholder="Min 6 characters"
                  minLength={6}
                  required
                />
              </div>
              <div className="form-field">
                <label>Phone</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="Phone number (optional)"
                />
              </div>
            </div>
            <div className="form-field">
              <label>Bio</label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                placeholder="Short bio for the instructor (optional)"
                rows={3}
              />
            </div>
            <button className="primary" type="submit" disabled={saving}>
              {saving ? "Creating..." : "Create Instructor Account"}
            </button>
          </form>
        </section>
      )}

      {/* Filters */}
      <div className="inst-filters" style={{ marginBottom: 20 }}>
        <div className="inst-search-wrapper">
          <span className="inst-search-icon">🔍</span>
          <input
            className="inst-input"
            placeholder="Search teachers by name or email..."
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
          <h3>Instructors</h3>
          <span>{filtered.length} total</span>
        </div>

        {filtered.length === 0 ? (
          <Empty
            text={
              users.length === 0
                ? "No instructors found. Create one to get started."
                : "No instructors match your search."
            }
          />
        ) : (
          <>
            {/* Desktop Table */}
            <div className="data-table-wrap mobile-hide">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>User ID</th>
                    <th>Name</th>
                    <th>Login ID (Email)</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((user) => (
                    <tr key={user.id}>
                      <td>#{user.id}</td>
                      <td><strong>{user.name}</strong></td>
                      <td>🔑 {user.email}</td>
                      <td>{user.phone || "—"}</td>
                      <td>
                        <span className={`role-badge ${user.active ? "role-instructor" : "role-admin"}`}>
                          {user.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        <button className="primary small" onClick={() => { setResetModal(user); setNewPassword(""); }} style={{ marginRight: 6 }}>
                          🔑 Reset
                        </button>
                        <button className="secondary small" onClick={() => toggleActive(user)} style={{ marginRight: 6 }}>
                          {user.active ? "Deactivate" : "Activate"}
                        </button>
                        <button className="danger small" onClick={() => removeUser(user)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="mobile-cards mobile-show">
              {filtered.map((user) => (
                <div key={user.id} className="mobile-user-card">
                  <div className="mobile-user-card-header">
                    <div className="mobile-user-avatar instructor">
                      {(user.name || "T")[0].toUpperCase()}
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
                      <span className="mobile-detail-label">Phone</span>
                      <span className="mobile-detail-value">{user.phone || "—"}</span>
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
          </>
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

export default AdminTeachers;
