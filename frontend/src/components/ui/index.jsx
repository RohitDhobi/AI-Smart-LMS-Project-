import { Navigate } from "react-router-dom";

export function getStoredUser() {
  try {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
}


export function formatTime(totalSeconds) {
  const minutes =
    Math.floor(totalSeconds / 60);
  const seconds =
    totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}


// =====================================================
// LOADING
// =====================================================


export function Loading() {
  return (
    <div className="loading-page">
      <div className="loading-spinner"></div>
      <p>Loading...</p>
    </div>
  );
}


// =====================================================
// EMPTY
// =====================================================


export function Empty({ text = "No data available." }) {
  return (
    <div className="empty">
      <div className="empty-icon">📭</div>
      <p>{text}</p>
    </div>
  );
}


// =====================================================
// PAGE
// =====================================================


export function Page({
  title,
  subtitle,
  children
}) {
  return (
    <div className="page">

      <div className="page-heading">
        <h1>{title}</h1>

        {subtitle && (
          <p>{subtitle}</p>
        )}
      </div>

      {children}

    </div>
  );
}


// =====================================================
// PROTECTED ROUTE
// =====================================================


// Where each role lands when it opens a route it may not use.
const ROLE_HOME = {
  ADMIN: "/admin",
  HOD: "/hod",
  INSTRUCTOR: "/instructor",
  STUDENT: "/dashboard",
};

/**
 * Guard for the auth pages (login/register/staff-login): signed-in users are
 * bounced to their dashboard.
 *
 * IMPORTANT: this must be a component, not an inline
 * `localStorage.getItem("token") ? <Navigate/> : <Login/>` expression in the
 * route config. Inline expressions are evaluated when <App> renders, which
 * almost never happens, so the element kept a STALE snapshot of the token
 * state. After logout, that stale <Navigate to="/dashboard"/> fought
 * Protected's fresh <Navigate to="/login"/> in an endless redirect loop:
 * React hit "Maximum update depth exceeded", unmounted the tree and left the
 * page blank and stuck. Evaluating storage here — at the moment the route
 * actually renders — always sees the current session state.
 */
export function SignedOutOnly({ children }) {
  return localStorage.getItem("token")
    ? <Navigate to="/dashboard" replace />
    : children;
}


/**
 * Route guard.
 *
 * Always requires a JWT. When `roles` is given it additionally checks the
 * stored user's role, so e.g. a STUDENT cannot open /admin or /hod in the
 * browser. This is UI-level only — the server still enforces every endpoint.
 */
export function Protected({ children, roles = null }) {

  const token =
    localStorage.getItem("token");

  if (!token) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (Array.isArray(roles) && roles.length > 0) {
    const role = getStoredUser()?.role;

    // Stored user without a usable role -> stale session, re-authenticate.
    if (!role) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      return (
        <Navigate
          to="/login"
          replace
        />
      );
    }

    if (!roles.includes(role)) {
      return (
        <Navigate
          to={ROLE_HOME[role] || "/dashboard"}
          replace
        />
      );
    }
  }

  return children;
}


// =====================================================
// LAYOUT
// =====================================================

