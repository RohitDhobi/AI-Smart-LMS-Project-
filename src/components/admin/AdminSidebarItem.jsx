import React from "react";
import { NavLink } from "react-router-dom";

export default function AdminSidebarItem({ item, collapsed }) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.path}
      end={item.exact}
      className={({ isActive }) =>
        `admin-nav-item ${isActive ? "active" : ""}`
      }
      title={collapsed ? item.label : undefined}
    >
      <span className="admin-nav-icon">
        <Icon size={18} />
      </span>
      {!collapsed && (
        <span className="admin-nav-label">{item.label}</span>
      )}
    </NavLink>
  );
}
