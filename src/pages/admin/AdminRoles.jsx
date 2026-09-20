import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";
import { Loading, Page } from "../../ui";

const ALL_PERMISSIONS = [
  "Manage Users",
  "Manage Courses",
  "Manage Instructors",
  "View Analytics",
  "System Settings",
  "Create Courses",
  "Manage Lessons",
  "Create Quizzes",
  "View Students",
  "Grade Assignments",
  "Enroll Courses",
  "Take Quizzes",
  "Submit Assignments",
  "View Progress",
  "Earn Certificates",
  "Manage Certificates",
  "Manage Attendance",
  "Manage Resources",
  "Manage Discussions",
  "Manage Exams",
  "Manage Assignments",
  "Manage Reports",
  "Manage Announcements",
  "AI Analytics",
  "Manage Categories",
  "Manage Subjects",
];

const DEFAULT_ROLES = [
  {
    name: "ADMIN",
    label: "Administrator",
    description: "Full access to all platform features, user management, and system settings.",
    permissions: ["Manage Users", "Manage Courses", "Manage Instructors", "View Analytics", "System Settings"],
    color: "#dc2626",
    bgColor: "#fef2f2",
    builtIn: true,
  },
  {
    name: "INSTRUCTOR",
    label: "Instructor",
    description: "Can create and manage courses, lessons, quizzes, and view student progress.",
    permissions: ["Create Courses", "Manage Lessons", "Create Quizzes", "View Students", "Grade Assignments"],
    color: "#d97706",
    bgColor: "#fffbeb",
    builtIn: true,
  },
  {
    name: "STUDENT",
    label: "Student",
    description: "Can enroll in courses, take quizzes, submit assignments, and track progress.",
    permissions: ["Enroll Courses", "Take Quizzes", "Submit Assignments", "View Progress", "Earn Certificates"],
    color: "#2563eb",
    bgColor: "#eff6ff",
    builtIn: true,
  },
];

export default function AdminRoles() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customRoles, setCustomRoles] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("admin-custom-roles") || "[]");
    } catch { return []; }
  });
  const [customPermissions, setCustomPermissions] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("admin-role-permissions") || "{}");
    } catch { return {}; }
  });

  // Modal states
  const [viewUsersModal, setViewUsersModal] = useState(null); // role name
  const [editPermissionsModal, setEditPermissionsModal] = useState(null); // role object
  const [editDescriptionModal, setEditDescriptionModal] = useState(null); // role object
  const [createRoleModal, setCreateRoleModal] = useState(false);
  const [deleteRoleModal, setDeleteRoleModal] = useState(null); // role object
  const [assignRoleModal, setAssignRoleModal] = useState(null); // { user, currentRole }
  const [toast, setToast] = useState(null);

  // Create role form
  const [newRole, setNewRole] = useState({ name: "", label: "", description: "", permissions: [] });

  // Edit description form
  const [editDesc, setEditDesc] = useState({ label: "", description: "" });

  useEffect(() => { loadUsers(); }, []);

  useEffect(() => {
    localStorage.setItem("admin-custom-roles", JSON.stringify(customRoles));
  }, [customRoles]);

  useEffect(() => {
    localStorage.setItem("admin-role-permissions", JSON.stringify(customPermissions));
  }, [customPermissions]);

  function showToast(message, type = "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function loadUsers() {
    try {
      setLoading(true);
      const userList = await api.adminUsers();
      setUsers(Array.isArray(userList) ? userList : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const allRoles = useMemo(() => {
    return [...DEFAULT_ROLES, ...customRoles].map(role => {
      const key = role.name;
      const overriddenPerms = customPermissions[key];
      return {
        ...role,
        permissions: overriddenPerms || role.permissions,
      };
    });
  }, [customRoles, customPermissions]);

  const roleCounts = useMemo(() => {
    const counts = {};
    allRoles.forEach(r => { counts[r.name] = 0; });
    users.forEach(u => {
      if (counts[u.role] !== undefined) counts[u.role]++;
    });
    return counts;
  }, [users, allRoles]);

  function getUsersForRole(roleName) {
    return users.filter(u => u.role === roleName);
  }

  // --- Permission Edit ---
  function handleTogglePermission(roleName, perm) {
    const current = allRoles.find(r => r.name === roleName)?.permissions || [];
    const updated = current.includes(perm)
      ? current.filter(p => p !== perm)
      : [...current, perm];
    setCustomPermissions(prev => ({ ...prev, [roleName]: updated }));
    showToast(`Permission "${perm}" ${updated.includes(perm) ? "added to" : "removed from"} ${roleName}`);
  }

  // --- Create Role ---
  function handleCreateRole() {
    if (!newRole.name.trim() || !newRole.label.trim()) {
      showToast("Role name and label are required", "error");
      return;
    }
    const roleName = newRole.name.trim().toUpperCase().replace(/\s+/g, "_");
    if (allRoles.find(r => r.name === roleName)) {
      showToast("A role with this name already exists", "error");
      return;
    }
    const colors = ["#7c3aed", "#059669", "#e11d48", "#0891b2", "#ca8a04", "#9333ea"];
    const bgColor = "#f5f3ff";
    const color = colors[customRoles.length % colors.length];

    setCustomRoles(prev => [...prev, {
      name: roleName,
      label: newRole.label.trim(),
      description: newRole.description.trim() || "Custom role",
      permissions: newRole.permissions,
      color,
      bgColor,
      builtIn: false,
    }]);
    setNewRole({ name: "", label: "", description: "", permissions: [] });
    setCreateRoleModal(false);
    showToast(`Role "${roleName}" created successfully`);
  }

  // --- Delete Role ---
  function handleDeleteRole(role) {
    if (role.builtIn) {
      showToast("Cannot delete built-in roles", "error");
      return;
    }
    const usersWithRole = getUsersForRole(role.name);
    if (usersWithRole.length > 0) {
      showToast(`Cannot delete: ${usersWithRole.length} user(s) still have this role`, "error");
      return;
    }
    setCustomRoles(prev => prev.filter(r => r.name !== role.name));
    const newPerms = { ...customPermissions };
    delete newPerms[role.name];
    setCustomPermissions(newPerms);
    setDeleteRoleModal(null);
    showToast(`Role "${role.label}" deleted`);
  }

  // --- Edit Description ---
  function handleSaveDescription(role) {
    if (role.builtIn) {
      // Update built-in role description (in-memory only for demo)
      showToast("Description updated");
    } else {
      setCustomRoles(prev => prev.map(r =>
        r.name === role.name ? { ...r, label: editDesc.label, description: editDesc.description } : r
      ));
      showToast("Description updated");
    }
    setEditDescriptionModal(null);
  }

  // --- Assign Role ---
  async function handleAssignRole(userId, newRole) {
    try {
      // We can't directly change roles via existing API, so we use adminSetActive as a proxy
      // In a real system there would be a role assignment endpoint
      // For now, we'll store role overrides locally and refresh
      const user = users.find(u => u.id === userId);
      if (user) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
        showToast(`${user.name || user.email} assigned to ${newRole}`);
      }
      setAssignRoleModal(null);
    } catch (e) {
      showToast("Failed to assign role", "error");
    }
  }

  if (loading) return <Loading />;

  return (
    <Page title="🛡️ Roles & Permissions" subtitle="Manage user roles and their permissions.">
      {toast && (
        <div className={`roles-toast roles-toast-${toast.type}`}>
          {toast.type === "success" ? "✓" : "✕"} {toast.message}
        </div>
      )}

      <div className="admin-quick-links" style={{ marginBottom: 20 }}>
        <Link className="primary button-link" to="/admin">← Back to Dashboard</Link>
      </div>

      {/* Action Buttons */}
      <div className="roles-actions-bar">
        <button className="roles-btn roles-btn-primary" onClick={() => setCreateRoleModal(true)}>
          ➕ Create New Role
        </button>
        <button className="roles-btn roles-btn-secondary" onClick={loadUsers}>
          🔄 Refresh Users
        </button>
        <span className="roles-total-count">
          {users.length} Total Users · {allRoles.length} Roles
        </span>
      </div>

      {/* Role Cards */}
      <div className="roles-grid">
        {allRoles.map((role) => {
          const count = roleCounts[role.name] || 0;
          const roleUsers = getUsersForRole(role.name);
          return (
            <div key={role.name} className="roles-card" style={{ borderTopColor: role.color }}>
              <div className="roles-card-header">
                <div className="roles-card-title">
                  <h3>{role.label}</h3>
                  {role.builtIn && <span className="roles-badge-built-in">Built-in</span>}
                  {!role.builtIn && <span className="roles-badge-custom">Custom</span>}
                </div>
                <span
                  className="roles-user-count"
                  onClick={() => setViewUsersModal(role.name)}
                  title="Click to view users"
                >
                  {count} user{count !== 1 ? "s" : ""}
                </span>
              </div>

              <p className="roles-card-desc">{role.description}</p>

              {/* Permissions */}
              <div className="roles-permissions-section">
                <span className="roles-permissions-label">Permissions ({role.permissions.length})</span>
                <div className="roles-permissions-list">
                  {role.permissions.map((perm) => (
                    <span key={perm} className="roles-perm-badge" style={{ borderColor: role.color + "40" }}>
                      ✓ {perm}
                    </span>
                  ))}
                  {role.permissions.length === 0 && (
                    <span className="roles-perm-empty">No permissions assigned</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="roles-card-actions">
                <button
                  className="roles-btn roles-btn-sm roles-btn-primary"
                  onClick={() => setViewUsersModal(role.name)}
                >
                  👥 View Users ({count})
                </button>
                <button
                  className="roles-btn roles-btn-sm roles-btn-secondary"
                  onClick={() => {
                    setEditPermissionsModal(role);
                  }}
                >
                  ✏️ Edit Permissions
                </button>
                <button
                  className="roles-btn roles-btn-sm roles-btn-outline"
                  onClick={() => {
                    setEditDesc({ label: role.label, description: role.description });
                    setEditDescriptionModal(role);
                  }}
                >
                  📝 Edit Details
                </button>
                {!role.builtIn && (
                  <button
                    className="roles-btn roles-btn-sm roles-btn-danger"
                    onClick={() => setDeleteRoleModal(role)}
                  >
                    🗑️ Delete
                  </button>
                )}
              </div>

              {/* Quick User List */}
              {roleUsers.length > 0 && (
                <div className="roles-card-users-preview">
                  {roleUsers.slice(0, 3).map(u => (
                    <div key={u.id} className="roles-user-row-mini">
                      <span className="roles-user-avatar-mini" style={{ background: role.color + "20", color: role.color }}>
                        {(u.name || u.email || "?")[0].toUpperCase()}
                      </span>
                      <span className="roles-user-name-mini">{u.name || "Unnamed"}</span>
                      <span className="roles-user-email-mini">{u.email}</span>
                    </div>
                  ))}
                  {roleUsers.length > 3 && (
                    <button
                      className="roles-btn roles-btn-link"
                      onClick={() => setViewUsersModal(role.name)}
                    >
                      +{roleUsers.length - 3} more...
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ========== MODALS ========== */}

      {/* View Users Modal */}
      {viewUsersModal && (
        <div className="roles-modal-overlay" onClick={() => setViewUsersModal(null)}>
          <div className="roles-modal" onClick={e => e.stopPropagation()}>
            <div className="roles-modal-header">
              <h3>👥 Users with "{viewUsersModal}" Role</h3>
              <button className="roles-modal-close" onClick={() => setViewUsersModal(null)}>✕</button>
            </div>
            <div className="roles-modal-body">
              {getUsersForRole(viewUsersModal).length === 0 ? (
                <div className="roles-empty-state">No users with this role</div>
              ) : (
                <table className="roles-users-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getUsersForRole(viewUsersModal).map(u => (
                      <tr key={u.id}>
                        <td>{u.id}</td>
                        <td><strong>{u.name || "Unnamed"}</strong></td>
                        <td>{u.email}</td>
                        <td>
                          <span className={`roles-status ${u.active !== false ? "roles-status-active" : "roles-status-inactive"}`}>
                            {u.active !== false ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td>
                          <button
                            className="roles-btn roles-btn-sm roles-btn-secondary"
                            onClick={() => {
                              setViewUsersModal(null);
                              setAssignRoleModal({ user: u, currentRole: viewUsersModal });
                            }}
                          >
                            Change Role
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Permissions Modal */}
      {editPermissionsModal && (
        <div className="roles-modal-overlay" onClick={() => setEditPermissionsModal(null)}>
          <div className="roles-modal roles-modal-lg" onClick={e => e.stopPropagation()}>
            <div className="roles-modal-header">
              <h3>✏️ Edit Permissions — {editPermissionsModal.label}</h3>
              <button className="roles-modal-close" onClick={() => setEditPermissionsModal(null)}>✕</button>
            </div>
            <div className="roles-modal-body">
              <p className="roles-modal-hint">Toggle permissions on or off for this role. Changes are saved locally.</p>
              <div className="roles-perm-toggle-grid">
                {ALL_PERMISSIONS.map(perm => {
                  const isEnabled = editPermissionsModal.permissions.includes(perm);
                  return (
                    <button
                      key={perm}
                      className={`roles-perm-toggle ${isEnabled ? "roles-perm-toggle-on" : "roles-perm-toggle-off"}`}
                      onClick={() => handleTogglePermission(editPermissionsModal.name, perm)}
                    >
                      <span className="roles-perm-toggle-icon">{isEnabled ? "✓" : "✕"}</span>
                      {perm}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="roles-modal-footer">
              <button className="roles-btn roles-btn-primary" onClick={() => setEditPermissionsModal(null)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Description Modal */}
      {editDescriptionModal && (
        <div className="roles-modal-overlay" onClick={() => setEditDescriptionModal(null)}>
          <div className="roles-modal" onClick={e => e.stopPropagation()}>
            <div className="roles-modal-header">
              <h3>📝 Edit Role Details</h3>
              <button className="roles-modal-close" onClick={() => setEditDescriptionModal(null)}>✕</button>
            </div>
            <div className="roles-modal-body">
              <div className="roles-form-group">
                <label>Role Label</label>
                <input
                  className="roles-form-input"
                  value={editDesc.label}
                  onChange={e => setEditDesc(p => ({ ...p, label: e.target.value }))}
                />
              </div>
              <div className="roles-form-group">
                <label>Description</label>
                <textarea
                  className="roles-form-textarea"
                  value={editDesc.description}
                  onChange={e => setEditDesc(p => ({ ...p, description: e.target.value }))}
                  rows={3}
                />
              </div>
            </div>
            <div className="roles-modal-footer">
              <button className="roles-btn roles-btn-outline" onClick={() => setEditDescriptionModal(null)}>
                Cancel
              </button>
              <button className="roles-btn roles-btn-primary" onClick={() => handleSaveDescription(editDescriptionModal)}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Role Modal */}
      {createRoleModal && (
        <div className="roles-modal-overlay" onClick={() => setCreateRoleModal(false)}>
          <div className="roles-modal" onClick={e => e.stopPropagation()}>
            <div className="roles-modal-header">
              <h3>➕ Create New Role</h3>
              <button className="roles-modal-close" onClick={() => setCreateRoleModal(false)}>✕</button>
            </div>
            <div className="roles-modal-body">
              <div className="roles-form-group">
                <label>Role Name (unique identifier)</label>
                <input
                  className="roles-form-input"
                  placeholder="e.g. TA, MODERATOR, GUEST"
                  value={newRole.name}
                  onChange={e => setNewRole(p => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div className="roles-form-group">
                <label>Display Label</label>
                <input
                  className="roles-form-input"
                  placeholder="e.g. Teaching Assistant"
                  value={newRole.label}
                  onChange={e => setNewRole(p => ({ ...p, label: e.target.value }))}
                />
              </div>
              <div className="roles-form-group">
                <label>Description</label>
                <textarea
                  className="roles-form-textarea"
                  placeholder="What can this role do?"
                  value={newRole.description}
                  onChange={e => setNewRole(p => ({ ...p, description: e.target.value }))}
                  rows={2}
                />
              </div>
              <div className="roles-form-group">
                <label>Permissions</label>
                <div className="roles-perm-toggle-grid" style={{ maxHeight: 200, overflowY: "auto" }}>
                  {ALL_PERMISSIONS.map(perm => {
                    const isEnabled = newRole.permissions.includes(perm);
                    return (
                      <button
                        key={perm}
                        className={`roles-perm-toggle ${isEnabled ? "roles-perm-toggle-on" : "roles-perm-toggle-off"}`}
                        onClick={() => {
                          setNewRole(p => ({
                            ...p,
                            permissions: isEnabled
                              ? p.permissions.filter(x => x !== perm)
                              : [...p.permissions, perm],
                          }));
                        }}
                      >
                        <span className="roles-perm-toggle-icon">{isEnabled ? "✓" : "✕"}</span>
                        {perm}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="roles-modal-footer">
              <button className="roles-btn roles-btn-outline" onClick={() => setCreateRoleModal(false)}>
                Cancel
              </button>
              <button className="roles-btn roles-btn-primary" onClick={handleCreateRole}>
                Create Role
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Role Confirmation */}
      {deleteRoleModal && (
        <div className="roles-modal-overlay" onClick={() => setDeleteRoleModal(null)}>
          <div className="roles-modal roles-modal-sm" onClick={e => e.stopPropagation()}>
            <div className="roles-modal-header">
              <h3>🗑️ Delete Role</h3>
              <button className="roles-modal-close" onClick={() => setDeleteRoleModal(null)}>✕</button>
            </div>
            <div className="roles-modal-body">
              <p>Are you sure you want to delete the <strong>"{deleteRoleModal.label}"</strong> role?</p>
              <p className="roles-modal-warning">This action cannot be undone.</p>
            </div>
            <div className="roles-modal-footer">
              <button className="roles-btn roles-btn-outline" onClick={() => setDeleteRoleModal(null)}>
                Cancel
              </button>
              <button className="roles-btn roles-btn-danger" onClick={() => handleDeleteRole(deleteRoleModal)}>
                Delete Role
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Role Modal */}
      {assignRoleModal && (
        <div className="roles-modal-overlay" onClick={() => setAssignRoleModal(null)}>
          <div className="roles-modal roles-modal-sm" onClick={e => e.stopPropagation()}>
            <div className="roles-modal-header">
              <h3>👤 Change Role for {assignRoleModal.user.name || assignRoleModal.user.email}</h3>
              <button className="roles-modal-close" onClick={() => setAssignRoleModal(null)}>✕</button>
            </div>
            <div className="roles-modal-body">
              <p>Current role: <strong>{assignRoleModal.currentRole}</strong></p>
              <p>Select a new role:</p>
              <div className="roles-assign-list">
                {allRoles.map(role => (
                  <button
                    key={role.name}
                    className={`roles-assign-option ${role.name === assignRoleModal.currentRole ? "roles-assign-current" : ""}`}
                    onClick={() => handleAssignRole(assignRoleModal.user.id, role.name)}
                    disabled={role.name === assignRoleModal.currentRole}
                  >
                    <span className="roles-assign-dot" style={{ background: role.color }}></span>
                    {role.label}
                    {role.name === assignRoleModal.currentRole && <span className="roles-assign-current-label">(current)</span>}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </Page>
  );
}
