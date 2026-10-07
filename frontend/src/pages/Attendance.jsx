import React, { useEffect, useState } from "react";
import { api } from "../api";
import { Loading, Empty, Page } from "../ui";

function Attendance() {

  const [attendance, setAttendance] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    try {
      setLoading(true);
      setError("");

      const [attendanceData, courseList] = await Promise.all([
        api.myAttendance(),
        api.courses()
      ]);

      setAttendance(Array.isArray(attendanceData) ? attendanceData : []);
      setCourses(Array.isArray(courseList) ? courseList : []);

    } catch (e) {
      setError(e.message || "Unable to load attendance.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <Loading />;

  // Calculate attendance per course
  const courseAttendance = {};
  attendance.forEach(record => {
    const courseId = record.course?.id;
    const courseName = record.course?.title || "Unknown Course";
    if (!courseId) return;

    if (!courseAttendance[courseId]) {
      courseAttendance[courseId] = {
        name: courseName,
        total: 0,
        present: 0,
        absent: 0,
        late: 0
      };
    }

    courseAttendance[courseId].total++;
    if (record.status === "PRESENT") courseAttendance[courseId].present++;
    else if (record.status === "ABSENT") courseAttendance[courseId].absent++;
    else if (record.status === "LATE") courseAttendance[courseId].late++;
  });

  const totalPresent = attendance.filter(a => a.status === "PRESENT").length;
  const totalAbsent = attendance.filter(a => a.status === "ABSENT").length;
  const totalLate = attendance.filter(a => a.status === "LATE").length;
  const totalRecords = attendance.length;
  const overallPercentage = totalRecords > 0
    ? Math.round(((totalPresent + totalLate) / totalRecords) * 100)
    : 0;

  return (
    <Page
      title="Attendance"
      subtitle="Track your attendance across all courses."
    >

      {error && <div className="error">{error}</div>}

      {/* Overall Stats */}
      <div className="analytics-stats">
        <div className="card analytics-stat tint-blue">
          <span className="analytics-stat-icon">📊</span>
          <div className="analytics-stat-text">
            <strong>{overallPercentage}%</strong>
            <span>Overall Attendance</span>
          </div>
        </div>
        <div className="card analytics-stat tint-green">
          <span className="analytics-stat-icon">✅</span>
          <div className="analytics-stat-text">
            <strong>{totalPresent}</strong>
            <span>Present</span>
          </div>
        </div>
        <div className="card analytics-stat tint-orange">
          <span className="analytics-stat-icon">⚠️</span>
          <div className="analytics-stat-text">
            <strong>{totalLate}</strong>
            <span>Late</span>
          </div>
        </div>
        <div className="card analytics-stat tint-purple">
          <span className="analytics-stat-icon">❌</span>
          <div className="analytics-stat-text">
            <strong>{totalAbsent}</strong>
            <span>Absent</span>
          </div>
        </div>
      </div>

      {/* Course-wise Attendance */}
      <section className="card">
        <div className="dash-panel-head">
          <h3>Course-wise Attendance</h3>
          <span>{totalRecords} total records</span>
        </div>

        {Object.keys(courseAttendance).length === 0 ? (
          <Empty text="No attendance records yet." />
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Total</th>
                  <th>Present</th>
                  <th>Absent</th>
                  <th>Late</th>
                  <th>Percentage</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(courseAttendance).map(([id, data]) => {
                  const pct = data.total > 0
                    ? Math.round(((data.present + data.late) / data.total) * 100)
                    : 0;

                  return (
                    <tr key={id}>
                      <td><strong>{data.name}</strong></td>
                      <td>{data.total}</td>
                      <td>{data.present}</td>
                      <td>{data.absent}</td>
                      <td>{data.late}</td>
                      <td>
                        <div className="table-progress">
                          <div className="progress">
                            <span style={{ width: `${pct}%` }} />
                          </div>
                          <strong>{pct}%</strong>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Recent Records */}
      <section className="card">
        <div className="dash-panel-head">
          <h3>Recent Records</h3>
        </div>

        {attendance.length === 0 ? (
          <Empty text="No attendance records found." />
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Course</th>
                  <th>Subject</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {attendance.slice(0, 20).map(record => (
                  <tr key={record.id}>
                    <td>{record.date || "—"}</td>
                    <td>{record.course?.title || "—"}</td>
                    <td>{record.subject || "—"}</td>
                    <td>
                      <span className={`subject-status ${
                        record.status === "PRESENT" ? "completed" :
                        record.status === "ABSENT" ? "not-started" : "in-progress"
                      }`}>
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

    </Page>
  );
}

export default Attendance;
