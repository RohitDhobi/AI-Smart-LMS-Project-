import React, { useEffect, useState } from "react";
import { api } from "../../api";

export default function InstructorStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => { loadStudents(); }, []);

  async function loadStudents() {
    try {
      setLoading(true);
      const data = await api.instructorUsers().catch(() => api.adminUsers().catch(() => []));
      setStudents(Array.isArray(data) ? data.filter(u => u.role === "STUDENT") : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  const filtered = students.filter(s =>
    !search || s.name?.toLowerCase().includes(search.toLowerCase()) || s.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="inst-page">
      <div className="inst-page-header">
        <div>
          <h1>👨‍🎓 My Students</h1>
          <p>View and manage enrolled students.</p>
        </div>
      </div>

      <div className="inst-search-bar">
        <span>🔍</span>
        <input placeholder="Search students..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="inst-loading">Loading students...</div>
      ) : filtered.length === 0 ? (
        <div className="inst-empty">No students found.</div>
      ) : (
        <div className="inst-table-wrap card">
          <table className="inst-table">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Course</th><th>Status</th></tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id}>
                  <td><strong>{s.name}</strong></td>
                  <td>{s.email}</td>
                  <td>{s.courseName || "—"}</td>
                  <td><span className={`inst-badge ${s.active ? "green" : "red"}`}>{s.active ? "Active" : "Inactive"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
