import React, { useState, useEffect } from "react";
import { api } from "../api";
import { Loading } from "../ui";
import { getTheme, applyTheme } from "../gamification";

export default function StudentSettings() {
  const [theme, setTheme] = useState(() => getTheme());
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", email: "", phone: "" });

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        const p = await api.profile().catch(() => null);
        setProfile(p);
        if (p) setForm({ name: p.name || "", email: p.email || "", phone: p.phone || "" });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    try {
      setSaving(true);
      setSuccess("");
      setError("");
      const result = await api.updateProfile(form);
      setProfile(result || profile);
      localStorage.setItem("user", JSON.stringify(result || profile));
      setSuccess("Settings saved successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (e) {
      setError(e.message || "Unable to update settings.");
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
    <div className="page">
      <div className="page-heading">
        <h1>⚙️ Settings</h1>
        <p>Manage your account preferences and appearance.</p>
      </div>

      {success && <div className="notice">{success}</div>}
      {error && <div className="error">{error}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }}>
        {/* Profile Settings */}
        <div className="card">
          <h3 style={{ margin: "0 0 16px" }}>👤 Profile Settings</h3>
          <form onSubmit={handleSave}>
            <div style={{ marginBottom: 14 }}>
              <label>Full Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label>Phone</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <button className="primary" type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Appearance Settings */}
          <div className="card">
            <h3 style={{ margin: "0 0 16px" }}>🎨 Appearance</h3>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16 }}>
              Choose your preferred theme.
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => handleThemeChange("light")}
                style={{
                  flex: 1,
                  padding: "16px 12px",
                  border: `2px solid ${theme === "light" ? "var(--primary)" : "var(--border)"}`,
                  borderRadius: 10,
                  background: "var(--surface)",
                  cursor: "pointer",
                  textAlign: "center",
                  color: "var(--text)",
                }}
              >
                <div style={{ fontSize: 24, marginBottom: 4 }}>☀️</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Light</div>
              </button>
              <button
                onClick={() => handleThemeChange("dark")}
                style={{
                  flex: 1,
                  padding: "16px 12px",
                  border: `2px solid ${theme === "dark" ? "var(--primary)" : "var(--border)"}`,
                  borderRadius: 10,
                  background: "var(--surface-soft)",
                  cursor: "pointer",
                  textAlign: "center",
                  color: "var(--text)",
                }}
              >
                <div style={{ fontSize: 24, marginBottom: 4 }}>🌙</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Dark</div>
              </button>
            </div>
          </div>

          {/* Account Info */}
          <div className="card">
            <h3 style={{ margin: "0 0 16px" }}>ℹ️ Account Information</h3>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: 8 }}>
              <div><strong>Platform:</strong> AI Smart LMS</div>
              <div><strong>Version:</strong> 1.0.0</div>
              <div><strong>Role:</strong> {profile?.role || "STUDENT"}</div>
              <div><strong>Theme:</strong> {theme === "dark" ? "Dark" : "Light"}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
