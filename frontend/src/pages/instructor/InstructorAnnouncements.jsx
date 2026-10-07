import React, { useState, useEffect } from "react";
import { getStoredUser } from "../../ui";
import InstructorPage from "./InstructorPage";

export default function InstructorAnnouncements() {
  const user = getStoredUser();
  const [announcements, setAnnouncements] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", message: "", courseId: "" });
  const [courses, setCourses] = useState([]);

  const sampleAnnouncements = [
    { id: 1, title: "Mid-term Exam Schedule", message: "Mid-term exams will begin from next Monday. Please prepare accordingly.", date: "2026-08-20", course: "Java Programming", priority: "high" },
    { id: 2, title: "Holiday Notice", message: "Institute will remain closed on 25th August due to Independence Day.", date: "2026-08-18", course: "All Courses", priority: "medium" },
    { id: 3, title: "Assignment Deadline Extended", message: "Assignment 3 deadline has been extended to August 30th.", date: "2026-08-15", course: "Web Development", priority: "low" },
  ];

  useEffect(() => {
    setAnnouncements(sampleAnnouncements);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const newAnnouncement = {
      id: Date.now(),
      ...form,
      date: new Date().toISOString().split("T")[0],
      course: "All Courses",
      priority: "medium",
    };
    setAnnouncements([newAnnouncement, ...announcements]);
    setForm({ title: "", message: "", courseId: "" });
    setShowForm(false);
  };

  return (
    <InstructorPage icon="📢" title="Announcements" subtitle="Create and manage announcements for your students">
      <div className="inst-content">
        <div className="inst-header-actions">
          <button className="inst-btn inst-btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancel" : "📢 New Announcement"}
          </button>
        </div>

        {showForm && (
          <div className="inst-card inst-form-card">
            <h3>Create Announcement</h3>
            <form onSubmit={handleSubmit} className="inst-form">
              <div className="inst-form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Announcement title"
                  required
                />
              </div>
              <div className="inst-form-group">
                <label>Message</label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Write your announcement message..."
                  rows={4}
                  required
                />
              </div>
              <div className="inst-form-group">
                <label>Priority</label>
                <select className="inst-select">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="inst-form-actions">
                <button type="submit" className="inst-btn inst-btn-primary">Publish</button>
                <button type="button" className="inst-btn inst-btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        <div className="inst-announcements-list">
          {announcements.map((a) => (
            <div key={a.id} className={`inst-announcement-card priority-${a.priority}`}>
              <div className="inst-announcement-header">
                <h3>{a.title}</h3>
                <span className={`inst-priority-badge ${a.priority}`}>{a.priority}</span>
              </div>
              <p>{a.message}</p>
              <div className="inst-announcement-footer">
                <span>📚 {a.course}</span>
                <span>📅 {a.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </InstructorPage>
  );
}
