import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { api } from "../../services/api";

function Login() {

  const navigate = useNavigate();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  async function handleLogin(event) {

    event.preventDefault();

    try {

      setLoading(true);
      setError("");

      const response =
        await api.login(
          email,
          password
        );

      const token =
        response?.token ||
        response?.accessToken ||
        response?.jwt;

      if (!token) {
        throw new Error(
          "Login successful but no token was returned by the server."
        );
      }

      localStorage.setItem(
        "token",
        token
      );

      const user =
        response?.user ||
        response?.data ||
        {
          name:
            response?.name ||
            email.split("@")[0],
          email
        };

      localStorage.setItem(
        "user",
        JSON.stringify(user)
      );

      // Redirect admin/teacher/HOD users to their own dashboards
      const userRole = response?.user?.role || response?.role || user?.role;
      if (userRole === "ADMIN") {
        navigate("/admin");
      } else if (userRole === "INSTRUCTOR") {
        navigate("/instructor");
      } else if (userRole === "HOD") {
        navigate("/hod");
      } else {
        navigate("/dashboard");
      }

    } catch (e) {

      setError(
        e.message ||
        "Login failed."
      );

    } finally {

      setLoading(false);

    }
  }

  return (
    <div className="auth-split">

      {/* Brand panel: carries the product identity so the form side can stay
          calm and focused. Hidden on small screens (see .auth-brand-mobile). */}
      <aside className="auth-brand">
        <div className="auth-brand-inner">
          <div className="auth-brand-mark">
            <GraduationCap size={30} strokeWidth={1.75} aria-hidden="true" />
          </div>
          <p className="auth-brand-name">AI Smart LMS</p>
          <p className="auth-brand-tagline">Learn Smarter, Grow Faster</p>
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

          <h1>Login to continue learning</h1>

          {error && (
            <div className="error" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>

            <div className="form-field">
              <label htmlFor="login-email">Email</label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={e =>
                  setEmail(e.target.value)
                }
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="login-password">Password</label>
              <div className="password-field">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={e =>
                    setPassword(e.target.value)
                  }
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
                : "Login"}
            </button>

          </form>

          <p className="auth-switch">

            Don't have an account?{" "}

            <Link to="/register">
              Register
            </Link>

          </p>

          <p className="auth-switch auth-switch-staff">

            <Link to="/staff-login" className="auth-staff-link">
              <ShieldCheck size={15} strokeWidth={1.75} aria-hidden="true" />
              Admin / Teacher Login
            </Link>

          </p>

        </div>

      </main>

    </div>
  );
}


// =====================================================
// LOGIN
// =====================================================


export default Login;
