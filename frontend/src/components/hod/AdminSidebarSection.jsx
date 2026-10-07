import React from "react";
import AdminSidebarItem from "../admin/AdminSidebarItem";

export default function AdminSidebarSection({ section, items, collapsed }) {
  return (
    <div className="admin-nav-group">
      {!collapsed && <div className="admin-nav-group-label">{section}</div>}
      {items.map((item) => (
        <AdminSidebarItem key={item.path} item={item} collapsed={collapsed} />
      ))}
    </div>
  );
}
