import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, ShieldCheck, Presentation, Landmark, Eye, EyeOff } from "lucide-react";
import { api } from "../../services/api";

function StaffLogin() {

  const navigate = useNavigate();

  const [role, setRole] = useState("ADMIN");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const roleConfig = {
    ADMIN: {
      label: "Admin",
      description: "Manage the platform, users, and courses",
      redirect: "/admin"
    },
    INSTRUCTOR: {
      label: "Teacher",
      description: "Manage your courses and track student progress",
      redirect: "/instructor"
    },
    HOD: {
      label: "HOD",
      description: "Oversee courses, subjects and instructor assignments",
      redirect: "/hod"
    }
  };

  const config = roleConfig[role];

  async function handleLogin(event) {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");

      const response = await api.login(email, password);

      const token =
        response?.token ||
        response?.accessToken ||
        response?.jwt;

      if (!token) {
        throw new Error(
          "Login successful but no token was returned by the server."
        );
      }

      // Check that the logged-in user has the correct role
      const userRole = response?.user?.role || response?.role;

      if (userRole && userRole !== role) {
        setError(
          `This account is registered as ${userRole}. ` +
          `Please use the ${roleConfig[userRole]?.label || userRole} login instead.`
        );
        return;
      }

      localStorage.setItem("token", token);

      const user =
        response?.user ||
        response?.data ||
        {
          name: response?.name || email.split("@")[0],
          email,
          role: role
        };

      localStorage.setItem("user", JSON.stringify(user));

      navigate(config.redirect);

    } catch (e) {
      setError(e.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-split">

      {/* Brand panel: same identity block as the student login page. */}
      <aside className="auth-brand">
        <div className="auth-brand-inner">
          <div className="auth-brand-mark">
            <GraduationCap size={30} strokeWidth={1.75} aria-hidden="true" />
          </div>
          <p className="auth-brand-name">AI Smart LMS</p>
          <p className="auth-brand-tagline">Staff access for admins, teachers and HODs</p>
        </div>
      </aside>

      {/* Form panel */}
      <main className="auth-main">

        <div className="auth-panel">

          <div className="auth-brand-mobile">
            <span className="auth-brand-mark auth-brand-mark-sm">
              <GraduationCap size={20} strokeWidth={1.75} aria-hidden="true" />
            </span>
            <span className="auth-brand-mobile-name">AI Smart LMS</span>
          </div>

          <h1>Staff Login</h1>

          <p className="auth-subtitle">{config.description}</p>

          {/* Role tabs */}
          <div className="auth-account-toggle" role="tablist" aria-label="Staff role">
            <button
              type="button"
              role="tab"
              aria-selected={role === "ADMIN"}
              className={role === "ADMIN" ? "active" : ""}
              onClick={() => {
                setRole("ADMIN");
                setError("");
              }}
            >
              <ShieldCheck size={16} strokeWidth={1.75} aria-hidden="true" />
              Admin
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={role === "INSTRUCTOR"}
              className={role === "INSTRUCTOR" ? "active" : ""}
              onClick={() => {
                setRole("INSTRUCTOR");
                setError("");
              }}
            >
              <Presentation size={16} strokeWidth={1.75} aria-hidden="true" />
              Teacher
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={role === "HOD"}
              className={role === "HOD" ? "active" : ""}
              onClick={() => {
                setRole("HOD");
                setError("");
              }}
            >
              <Landmark size={16} strokeWidth={1.75} aria-hidden="true" />
              HOD
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="error" role="alert">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin}>

            <div className="form-field">
              <label htmlFor="staff-email">Email</label>
              <input
                id="staff-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="staff-password">Password</label>
              <div className="password-field">
                <input
                  id="staff-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword
                    ? <EyeOff size={18} strokeWidth={1.75} aria-hidden="true" />
                    : <Eye size={18} strokeWidth={1.75} aria-hidden="true" />}
                </button>
              </div>
            </div>

            <button
              className="primary full-width"
              disabled={loading}
            >
              {loading
                ? "Logging in..."
                : `Login as ${config.label}`}
            </button>

          </form>

          {/* Back to student login */}
          <p className="auth-switch">
            Are you a student?{" "}
            <Link to="/login">
              Student Login
            </Link>
          </p>

        </div>

      </main>

    </div>
  );
}

export default StaffLogin;
