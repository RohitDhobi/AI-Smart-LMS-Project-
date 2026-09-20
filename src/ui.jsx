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


export function Protected({ children }) {

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

  return children;
}


// =====================================================
// LAYOUT
// =====================================================

