import React from "react";
import { Menu, X, Bell } from "lucide-react";
import { NavLink } from "react-router-dom";

export default function AdminMobileHeader({ onToggleSidebar, sidebarOpen }) {
  return (
    <header className="admin-mobile-header">
      <div className="admin-mobile-header-left">
        <button
          className="admin-mobile-menu-btn"
          onClick={onToggleSidebar}
          aria-label={sidebarOpen ? "Close menu" : "Open menu"}
        >
          {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
        <NavLink to="/admin" className="admin-mobile-logo">
          <span className="admin-mobile-logo-icon">🎓</span>
          <span className="admin-mobile-logo-text">AI Smart LMS</span>
        </NavLink>
      </div>
      <div className="admin-mobile-header-right">
        <NavLink to="/admin/settings" className="admin-mobile-icon-btn" title="Settings">
          ⚙️
        </NavLink>
      </div>
    </header>
  );
}
