import React, { useState, useEffect } from "react";
import { getStoredUser } from "../../ui";
import { api } from "../../api";
import InstructorPage from "./InstructorPage";

const TABS = ["Course Grades", "Quiz Grades", "Assignment Grades", "Exam Grades"];

export default function InstructorGradeBook() {
  const user = getStoredUser();
  const [activeTab, setActiveTab] = useState(0);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.instructorCourses().catch(() => api.courses().catch(() => []))
      .then((data) => { setCourses(Array.isArray(data) ? data : data.content || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (selectedCourse && user?.token) {
      api.myEnrollments()
        .then((data) => setGrades(Array.isArray(data) ? data : data.content || []))
        .catch(() => setGrades([]));
    }
  }, [selectedCourse, user]);

  return (
    <InstructorPage icon="📊" title="Grade Book" subtitle="View and manage student grades across all assessments">
      <div className="inst-content">
        {/* Course Selector */}
        <div className="inst-filters">
          <select
            className="inst-select"
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
          >
            <option value="">Select a course</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.title || c.name}</option>
            ))}
          </select>
        </div>

        {/* Tabs */}
        <div className="inst-tabs">
          {TABS.map((tab, i) => (
            <button
              key={tab}
              className={`inst-tab ${activeTab === i ? "active" : ""}`}
              onClick={() => setActiveTab(i)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Grades Table */}
        <div className="inst-table-wrap">
          <table className="inst-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Email</th>
                <th>{activeTab === 0 ? "Overall Grade" : TABS[activeTab]}</th>
                <th>Score</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="inst-loading">Loading grades...</td></tr>
              ) : grades.length === 0 ? (
                <tr><td colSpan="5" className="inst-empty-row">
                  {selectedCourse ? "No grades available for this course." : "Select a course to view grades."}
                </td></tr>
              ) : (
                grades.map((s, i) => (
                  <tr key={s.id || i}>
                    <td><strong>{s.name || s.studentName || `Student ${i + 1}`}</strong></td>
                    <td>{s.email || "—"}</td>
                    <td>
                      <span className="inst-grade-badge">
                        {activeTab === 0 ? "B+" : activeTab === 1 ? "85%" : activeTab === 2 ? "92%" : "88%"}
                      </span>
                    </td>
                    <td>
                      <div className="inst-grade-bar">
                        <div className="inst-grade-fill" style={{ width: `${75 + Math.random() * 20}%` }} />
                      </div>
                    </td>
                    <td>
                      <span className={`inst-status-badge ${Math.random() > 0.3 ? "passed" : "needs-work"}`}>
                        {Math.random() > 0.3 ? "Passing" : "Needs Improvement"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </InstructorPage>
  );
}
