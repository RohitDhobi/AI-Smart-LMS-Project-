import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";

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
      icon: "🛡️",
      label: "Admin",
      description: "Manage the platform, users, and courses",
      redirect: "/admin",
      color: "#ef4444"
    },
    INSTRUCTOR: {
      icon: "🧑‍🏫",
      label: "Teacher",
      description: "Manage your courses and track student progress",
      redirect: "/instructor",
      color: "#f59e0b"
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
    <div className="auth-page">

      <div className="auth-card">

        {/* Logo */}
        <div className="auth-logo">
          🤖
        </div>

        <h1>AI Smart LMS</h1>
        <p>{config.description}</p>

        {/* Role Tabs */}
        <div className="staff-role-tabs">
          <button
            className={
              `staff-tab ${role === "ADMIN" ? "active" : ""}`
            }
            onClick={() => {
              setRole("ADMIN");
              setError("");
            }}
          >
            <span className="staff-tab-icon">🛡️</span>
            Admin
          </button>
          <button
            className={
              `staff-tab ${role === "INSTRUCTOR" ? "active" : ""}`
            }
            onClick={() => {
              setRole("INSTRUCTOR");
              setError("");
            }}
          >
            <span className="staff-tab-icon">🧑‍🏫</span>
            Teacher
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="error">{error}</div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin}>

          <label>Email Address</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
          />

          <label>Password</label>
          <div className="password-field">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
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

    </div>
  );
}

export default StaffLogin;
