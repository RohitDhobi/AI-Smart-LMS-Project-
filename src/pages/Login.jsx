import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";

function Login() {

  const navigate = useNavigate();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

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
    <div className="auth-page">

      <div className="auth-card">

        <div className="auth-logo">
          🤖
        </div>

        <h1>AI Smart LMS</h1>

        <p>
          Login to continue learning
        </p>


        {error && (
          <div className="error">
            {error}
          </div>
        )}


        <form onSubmit={handleLogin}>

          <label>
            Email
          </label>

          <input
            type="email"
            value={email}
            onChange={e =>
              setEmail(e.target.value)
            }
            placeholder="Enter your email"
            required
          />


          <label>
            Password
          </label>

          <input
            type="password"
            value={password}
            onChange={e =>
              setPassword(e.target.value)
            }
            placeholder="Enter your password"
            required
          />


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

        <p className="auth-switch">

          <Link to="/staff-login">
            🛡️ Admin / Teacher Login
          </Link>

        </p>

      </div>

    </div>
  );
}


// =====================================================
// REGISTER
// =====================================================


export default Login;
