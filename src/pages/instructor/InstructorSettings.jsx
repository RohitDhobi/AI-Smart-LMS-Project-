import React, { useState } from "react";
import { getStoredUser } from "../../ui";
import { api } from "../../api";
import { getTheme, applyTheme } from "../../gamification";
import InstructorPage from "./InstructorPage";

export default function InstructorSettings() {
  const user = getStoredUser();
  const [activeSection, setActiveSection] = useState("profile");
  const [profile, setProfile] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "",
    bio: "",
    department: "Computer Science",
    office: "Room 301",
  });
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    assignmentSubmissions: true,
    quizAttempts: true,
    studentMessages: true,
    announcements: false,
  });
  const [theme, setTheme] = useState(() => getTheme());
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSaveProfile() {
    try {
      setSaving(true);
      setError("");
      await api.instructorUpdateProfile({
        name: profile.name,
        phone: profile.phone,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword() {
    if (passwords.newPassword !== passwords.confirmPassword) {
      return setError("New passwords do not match");
    }
    if (passwords.newPassword.length < 6) {
      return setError("New password must be at least 6 characters");
    }
    try {
      setSaving(true);
      setError("");
      await api.instructorChangePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err.message || "Failed to change password");
    } finally {
      setSaving(false);
    }
  }

  function handleThemeChange(newTheme) {
    setTheme(newTheme);
    applyTheme(newTheme);
  }

  function handleSaveNotifications() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <InstructorPage icon="⚙️" title="Settings" subtitle="Manage your account and preferences">
      <div className="inst-content">
        <div className="inst-settings-layout">
          {/* Settings Nav */}
          <div className="inst-settings-nav">
            {[
              { id: "profile", icon: "👤", label: "Profile" },
              { id: "notifications", icon: "🔔", label: "Notifications" },
              { id: "teaching", icon: "📚", label: "Teaching Preferences" },
              { id: "appearance", icon: "🎨", label: "Appearance" },
              { id: "account", icon: "🔐", label: "Account Security" },
            ].map((s) => (
              <button
                key={s.id}
                className={`inst-settings-nav-item ${activeSection === s.id ? "active" : ""}`}
                onClick={() => { setActiveSection(s.id); setError(""); }}
              >
                <span>{s.icon}</span>
                {s.label}
              </button>
            ))}
          </div>

          {/* Settings Content */}
          <div className="inst-settings-content">
            {saved && <div className="inst-toast">✅ Settings saved successfully!</div>}
            {error && <div className="inst-error" style={{ marginBottom: 16, padding: "10px 16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, color: "#dc2626" }}>{error}</div>}

            {activeSection === "profile" && (
              <div className="inst-card">
                <h3>👤 Profile Settings</h3>
                <div className="inst-form">
                  <div className="inst-form-row">
                    <div className="inst-form-group">
                      <label>Full Name</label>
                      <input
                        type="text"
                        value={profile.name}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      />
                    </div>
                    <div className="inst-form-group">
                      <label>Email</label>
                      <input
                        type="email"
                        value={profile.email}
                        disabled
                        style={{ opacity: 0.6 }}
                      />
                    </div>
                  </div>
                  <div className="inst-form-row">
                    <div className="inst-form-group">
                      <label>Phone</label>
                      <input
                        type="tel"
                        value={profile.phone}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        placeholder="+91 98765 43210"
                      />
                    </div>
                    <div className="inst-form-group">
                      <label>Department</label>
                      <select
                        className="inst-select"
                        value={profile.department}
                        onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                      >
                        <option>Computer Science</option>
                        <option>Information Technology</option>
                        <option>Electronics</option>
                        <option>Mathematics</option>
                      </select>
                    </div>
                  </div>
                  <div className="inst-form-group">
                    <label>Office Location</label>
                    <input
                      type="text"
                      value={profile.office}
                      onChange={(e) => setProfile({ ...profile, office: e.target.value })}
                    />
                  </div>
                  <div className="inst-form-group">
                    <label>Bio</label>
                    <textarea
                      value={profile.bio}
                      onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                      placeholder="Tell students about yourself..."
                      rows={3}
                    />
                  </div>
                  <button className="inst-btn inst-btn-primary" onClick={handleSaveProfile} disabled={saving}>
                    {saving ? "Saving..." : "Save Profile"}
                  </button>
                </div>
              </div>
            )}

            {activeSection === "notifications" && (
              <div className="inst-card">
                <h3>🔔 Notification Preferences</h3>
                <div className="inst-settings-list">
                  {Object.entries(notifications).map(([key, value]) => (
                    <div key={key} className="inst-settings-item">
                      <div>
                        <strong>{key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}</strong>
                        <small>Receive notifications for {key.replace(/([A-Z])/g, " $1").toLowerCase()}</small>
                      </div>
                      <label className="inst-toggle">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={() => setNotifications({ ...notifications, [key]: !value })}
                        />
                        <span className="inst-toggle-slider" />
                      </label>
                    </div>
                  ))}
                </div>
                <button className="inst-btn inst-btn-primary" onClick={handleSaveNotifications}>Save Preferences</button>
              </div>
            )}

            {activeSection === "teaching" && (
              <div className="inst-card">
                <h3>📚 Teaching Preferences</h3>
                <div className="inst-form">
                  <div className="inst-form-group">
                    <label>Default Grading Scale</label>
                    <select className="inst-select">
                      <option>Percentage (0-100)</option>
                      <option>Letter Grade (A-F)</option>
                      <option>GPA (0-4.0)</option>
                    </select>
                  </div>
                  <div className="inst-form-group">
                    <label>Passing Grade</label>
                    <input type="number" defaultValue="60" min="0" max="100" />
                  </div>
                  <div className="inst-form-group">
                    <label>Course Visibility</label>
                    <select className="inst-select">
                      <option>Published</option>
                      <option>Draft</option>
                      <option>Archived</option>
                    </select>
                  </div>
                  <button className="inst-btn inst-btn-primary" onClick={handleSaveNotifications}>Save Preferences</button>
                </div>
              </div>
            )}

            {activeSection === "appearance" && (
              <div className="inst-card">
                <h3>🎨 Appearance</h3>
                <p style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>Choose your preferred theme.</p>
                <div style={{ display: "flex", gap: 12 }}>
                  <button
                    onClick={() => handleThemeChange("light")}
                    style={{
                      flex: 1, padding: "16px 12px", border: `2px solid ${theme === "light" ? "#2563eb" : "#e2e8f0"}`,
                      borderRadius: 10, background: "#ffffff", cursor: "pointer", textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: 24, marginBottom: 4 }}>☀️</div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>Light</div>
                  </button>
                  <button
                    onClick={() => handleThemeChange("dark")}
                    style={{
                      flex: 1, padding: "16px 12px", border: `2px solid ${theme === "dark" ? "#2563eb" : "#e2e8f0"}`,
                      borderRadius: 10, background: "#0f172a", cursor: "pointer", textAlign: "center", color: "#e2e8f0",
                    }}
                  >
                    <div style={{ fontSize: 24, marginBottom: 4 }}>🌙</div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>Dark</div>
                  </button>
                </div>
                <div style={{ marginTop: 16, fontSize: 13, color: "#64748b" }}>
                  Current theme: <strong>{theme === "dark" ? "Dark" : "Light"}</strong>
                </div>
              </div>
            )}

            {activeSection === "account" && (
              <div className="inst-card">
                <h3>🔐 Account Security</h3>
                <div className="inst-form">
                  <div className="inst-form-group">
                    <label>Current Password</label>
                    <input
                      type="password"
                      placeholder="Enter current password"
                      value={passwords.currentPassword}
                      onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                    />
                  </div>
                  <div className="inst-form-row">
                    <div className="inst-form-group">
                      <label>New Password</label>
                      <input
                        type="password"
                        placeholder="Enter new password"
                        value={passwords.newPassword}
                        onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                      />
                    </div>
                    <div className="inst-form-group">
                      <label>Confirm Password</label>
                      <input
                        type="password"
                        placeholder="Confirm new password"
                        value={passwords.confirmPassword}
                        onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                      />
                    </div>
                  </div>
                  <button className="inst-btn inst-btn-primary" onClick={handleChangePassword} disabled={saving}>
                    {saving ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </InstructorPage>
  );
}
