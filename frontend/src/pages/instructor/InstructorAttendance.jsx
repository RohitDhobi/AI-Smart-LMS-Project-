import React, { useEffect, useState } from "react";
import { api } from "../../api";

export default function InstructorAttendance() {
  const [records, setRecords] = useState([]);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendanceData, setAttendanceData] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [r, c, s] = await Promise.all([
        api.myAttendance().catch(() => []),
        api.instructorCourses().catch(() => api.courses().catch(() => [])),
        api.instructorUsers().catch(() => []),
      ]);
      setRecords(Array.isArray(r) ? r : []);
      setCourses(Array.isArray(c) ? c : []);
      setStudents(Array.isArray(s) ? s.filter(u => u.role === "STUDENT") : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function handleCourseSelect(courseId) {
    setSelectedCourse(courseId);
    setAttendanceData({});
    if (courseId) {
      try {
        const courseStudents = await api.instructorUsers().catch(() => []);
        const filtered = Array.isArray(courseStudents) ? courseStudents.filter(u => u.role === "STUDENT") : [];
        setStudents(filtered);
        const initial = {};
        filtered.forEach(s => { initial[s.id] = "PRESENT"; });
        setAttendanceData(initial);
      } catch (e) { console.error(e); }
    }
  }

  async function handleSubmitAttendance() {
    if (!selectedCourse) return alert("Select a course first");
    const studentIds = Object.keys(attendanceData);
    if (studentIds.length === 0) return alert("No students to mark attendance for");

    try {
      setSaving(true);
      // Mark attendance for each student
      await Promise.all(
        studentIds.map(studentId =>
          api.markAttendance({
            courseId: Number(selectedCourse),
            studentId: Number(studentId),
            date: attendanceDate,
            status: attendanceData[studentId] || "PRESENT",
          })
        )
      );
      alert("Attendance marked successfully!");
      setShowForm(false);
      setSelectedCourse("");
      setAttendanceData({});
      loadData();
    } catch (err) {
      alert(err.message || "Failed to mark attendance");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="inst-page">
      <div className="inst-page-header">
        <div><h1>📅 Attendance</h1><p>Track and manage student attendance.</p></div>
        <button className="inst-btn primary" onClick={() => setShowForm(true)}>+ Take Attendance</button>
      </div>

      {showForm && (
        <div className="inst-form card" style={{ marginBottom: 20 }}>
          <h3>Take Attendance</h3>
          <div className="inst-form-row">
            <div className="inst-form-group">
              <label>Course *</label>
              <select required value={selectedCourse} onChange={e => handleCourseSelect(e.target.value)}>
                <option value="">Select a course</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
            <div className="inst-form-group">
              <label>Date *</label>
              <input type="date" value={attendanceDate} onChange={e => setAttendanceDate(e.target.value)} />
            </div>
          </div>

          {selectedCourse && students.length > 0 && (
            <div className="inst-section" style={{ marginTop: 16 }}>
              <h4>Students ({students.length})</h4>
              <div className="inst-table-wrap card">
                <table className="inst-table">
                  <thead>
                    <tr><th>Name</th><th>Email</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {students.map(s => (
                      <tr key={s.id}>
                        <td><strong>{s.name}</strong></td>
                        <td>{s.email}</td>
                        <td>
                          <select
                            value={attendanceData[s.id] || "PRESENT"}
                            onChange={e => setAttendanceData({ ...attendanceData, [s.id]: e.target.value })}
                            className="inst-select"
                          >
                            <option value="PRESENT">Present</option>
                            <option value="ABSENT">Absent</option>
                            <option value="LATE">Late</option>
                            <option value="EXCUSED">Excused</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="inst-form-actions" style={{ marginTop: 16 }}>
                <button type="button" className="inst-btn secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button className="inst-btn primary" onClick={handleSubmitAttendance} disabled={saving}>
                  {saving ? "Saving..." : "Save Attendance"}
                </button>
              </div>
            </div>
          )}

          {selectedCourse && students.length === 0 && (
            <div className="inst-empty" style={{ marginTop: 16 }}>No students enrolled in this course.</div>
          )}
        </div>
      )}

      {loading ? <div className="inst-loading">Loading...</div> : records.length === 0 ? (
        <div className="inst-empty"><div className="inst-empty-icon">📅</div><h3>No attendance records</h3><p>Start taking attendance to track student presence.</p></div>
      ) : (
        <div className="inst-table-wrap card">
          <table className="inst-table">
            <thead><tr><th>Date</th><th>Course</th><th>Status</th></tr></thead>
            <tbody>{records.map(r => (
              <tr key={r.id}><td>{r.date || "—"}</td><td>{r.course?.title || "—"}</td>
                <td><span className={`inst-badge ${r.status === "PRESENT" ? "green" : r.status === "ABSENT" ? "red" : "orange"}`}>{r.status}</span></td></tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
