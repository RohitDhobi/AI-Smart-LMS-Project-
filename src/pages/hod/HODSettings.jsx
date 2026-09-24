import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";
import { getStoredUser } from "../../ui";
import { Users, BookOpen, Settings, LogOut, Bell, User, Lock, Eye, EyeOff } from "lucide-react";

export default function HODSettings() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => { loadProfile(); }, []);

  async function loadProfile() {
    try {
      setLoading(true);
      setError("");
      const data = await api.profile().catch(() => null);
      if (data) setProfile(data);
      setName(data?.name || "");
      setPhone(data?.phone || "");
      setGender(data?.gender || "");
    } catch (e) {
      setError(e.message || "Unable to load profile.");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateProfile() {
    setSaving(true);
    try {
      const data = await api.updateProfile({ name, phone, gender }).catch(() => null);
      if (data) setProfile(data);
      setMsg("Profile updated.");
    } catch (e) {
      setError(e.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword() {
    if (newPassword.length < 6) return;
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setSaving(true);
    try {
      await api.changePassword({ newPassword }).catch(() => {});
      setNewPassword(""); setConfirmPassword("");
      setMsg("Password updated.");
    } catch (e) {
      setError(e.message || "Failed to change password.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page hod-settings">
      <div className="page-heading">
        <h1>Settings</h1>
        <p>Profile, notifications, and account settings.</p>
      </div>

      {error && <div className="error">{error}</div>}
      {msg && <div className="notice">{msg}</div>}

      {/* Profile */}
      <div className="card">
        <div className="card-header">
          <h2>👤 Profile</h2>
        </div>
        <div className="hod-form">
          <div className="hod-form-row">
            <label>Name</label>
            <input className="hod-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          </div>
          <div className="hod-form-row">
            <label>Email</label>
            <input className="hod-input" value={profile?.email || ""} disabled placeholder="Email" />
          </div>
          <div className="hod-form-row">
            <label>Phone</label>
            <input className="hod-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" />
          </div>
          <div className="hod-form-row">
            <label>Gender</label>
            <select className="hod-input" value={gender} onChange={(e) => setGender(e.target.value)}>
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="hod-form-actions">
            <button className="inst-btn primary" onClick={handleUpdateProfile} disabled={saving}>
              <User size={16} /> {saving ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </div>
      </div>

      {/* My Subjects */}
      <div className="card">
        <div className="card-header">
          <h2>📚 My Subjects</h2>
          <span className="card-sub">Subjects assigned by the HOD</span>
        </div>
        <div className="hod-empty">
          <div className="empty-icon">📚</div>
          <p>No subjects assigned yet.</p>
          <p>Contact the HOD to assign you subjects/courses.</p>
        </div>
      </div>

      {/* Notifications & Security */}
      <div className="hod-settings-grid">
        <div className="card">
          <div className="card-header">
            <h2>🔔 Notifications</h2>
            <span className="card-sub">Enable email and in-app notifications.</span>
          </div>
          <div className="hod-form">
            <div className="hod-form-row">
              <label>Email Notifications</label>
              <input type="checkbox" className="hod-checkbox" defaultChecked />
            </div>
            <div className="hod-form-row">
              <label>Course Updates</label>
              <input type="checkbox" className="hod-checkbox" defaultChecked />
            </div>
            <div className="hod-form-row">
              <label>Assignment Reminders</label>
              <input type="checkbox" className="hod-checkbox" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2>🔒 Security</h2>
          </div>
          <div className="hod-form">
            <div className="hod-form-row">
              <label>Current Password</label>
              <div className="password-field">
                <input
                  type={showPassword ? "text" : "password"}
                  className="hod-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Current password"
                />
                <button className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="hod-form-row">
              <label>New Password</label>
              <input className="hod-input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" />
            </div>
            <div className="hod-form-row">
              <label>Confirm New Password</label>
              <input className="hod-input" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" />
            </div>
            <div className="hod-form-actions">
              <button className="inst-btn danger" onClick={handleChangePassword} disabled={saving}>
                <Lock size={16} /> Change Password
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="hod-footer">
        <Link to="/" className="inst-btn">
          <LogOut size={16} /> Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
