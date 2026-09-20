import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";
import { Loading, Page } from "../../ui";
import { getTheme, applyTheme } from "../../gamification";

export default function AdminSettings() {
  const [theme, setTheme] = useState(() => getTheme());
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({ name: "", email: "", phone: "" });

  useEffect(() => { loadProfile(); }, []);

  async function loadProfile() {
    try {
      setLoading(true);
      const p = await api.profile().catch(() => null);
      setProfile(p);
      if (p) setForm({ name: p.name || "", email: p.email || "", phone: p.phone || "" });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function handleSave(e) {
    e.preventDefault();
    try {
      setSaving(true);
      setSuccess("");
      await api.updateProfile(form);
      setSuccess("Profile updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }

  function handleThemeChange(newTheme) {
    setTheme(newTheme);
    applyTheme(newTheme);
  }

  if (loading) return <Loading />;

  return (
    <Page title="⚙️ Settings" subtitle="Platform and account settings.">
      <div className="admin-quick-links" style={{ marginBottom: 20 }}>
        <Link className="primary button-link" to="/admin">← Back to Dashboard</Link>
      </div>

      {success && <div className="notice">{success}</div>}

      <div className="admin-two-col">
        {/* Profile Settings */}
        <div className="card">
          <h3 style={{ margin: "0 0 16px" }}>👤 Profile Settings</h3>
          <form onSubmit={handleSave}>
            <div className="form-field" style={{ marginBottom: 12 }}>
              <label>Full Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-field" style={{ marginBottom: 12 }}>
              <label>Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="form-field" style={{ marginBottom: 16 }}>
              <label>Phone</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <button className="primary" type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>

        {/* Appearance Settings */}
        <div className="card">
          <h3 style={{ margin: "0 0 16px" }}>🎨 Appearance</h3>
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
        </div>

        {/* Security Settings */}
        <div className="card">
          <h3 style={{ margin: "0 0 16px" }}>🔒 Security</h3>
          <p style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>Manage your password and security settings.</p>
          <Link
            to="/profile"
            className="secondary"
            style={{ display: "inline-flex", padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: "none" }}
          >
            Change Password →
          </Link>
        </div>

        {/* System Info */}
        <div className="card">
          <h3 style={{ margin: "0 0 16px" }}>ℹ️ System Information</h3>
          <div style={{ fontSize: 13, color: "#64748b", display: "flex", flexDirection: "column", gap: 8 }}>
            <div><strong>Platform:</strong> AI Smart LMS</div>
            <div><strong>Version:</strong> 1.0.0</div>
            <div><strong>Role:</strong> {profile?.role || "ADMIN"}</div>
            <div><strong>Theme:</strong> {theme === "dark" ? "Dark" : "Light"}</div>
          </div>
        </div>
      </div>
    </Page>
  );
}
