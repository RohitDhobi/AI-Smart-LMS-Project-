import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./styles.css";

// Error boundary: if the app ever crashes during render,
// show a readable message instead of a blank page.
class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("App crashed:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            background: "var(--bg, #0f172a)",
            color: "var(--text, #e2e8f0)",
            fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
            padding: "24px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "40px" }}>⚠️</div>
          <h1 style={{ fontSize: "18px", margin: 0 }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: "13px", opacity: 0.7, maxWidth: "420px", margin: 0 }}>
            {String(this.state.error?.message || this.state.error)}
          </p>
          <button
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              window.location.href = "/login";
            }}
            style={{
              marginTop: "8px",
              padding: "10px 20px",
              borderRadius: "8px",
              border: "none",
              background: "var(--primary, #2563eb)",
              color: "#fff",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            Back to Login
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AppErrorBoundary>
  </React.StrictMode>
);

// Register service worker for PWA
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => console.log("SW registered:", reg.scope))
      .catch((err) => console.warn("SW registration failed:", err));
  });
}
