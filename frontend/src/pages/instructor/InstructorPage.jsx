import React from "react";

export default function InstructorPage({ icon, title, subtitle, children }) {
  return (
    <div className="inst-page">
      <div className="inst-page-header">
        <div>
          <h1>{icon} {title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>
      {children || (
        <div className="inst-empty">
          <div className="inst-empty-icon">{icon}</div>
          <h3>{title}</h3>
          <p>This section is coming soon. Full functionality will be available in the next update.</p>
        </div>
      )}
    </div>
  );
}
