import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";
import { getStoredUser } from "../../ui";
import { Megaphone, PlusCircle, Trash2, Bell } from "lucide-react";

export default function HODAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => { loadAnnouncements(); }, []);

  async function loadAnnouncements() {
    try {
      setLoading(true);
      setError("");
      const data = await api.hodAnnouncements().catch(() => []);
      setAnnouncements(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Unable to load announcements.");
    } finally {
      setLoading(false);
    }
  }

  async function handlePost() {
    if (!title.trim()) return;
    setPosting(true);
    try {
      await api.hodCreateAnnouncement({ title, content }).catch(() => {});
      setTitle(""); setContent("");
      loadAnnouncements();
    } catch (e) {
      setError(e.message || "Failed to post announcement.");
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="page hod-announcements">
      <div className="page-heading">
        <h1>Announcements</h1>
        <p>Post course announcements to students and instructors.</p>
      </div>

      {/* Compose */}
      <div className="card hod-compose">
        <h3>📢 New Announcement</h3>
        <div className="hod-form">
          <div className="hod-form-row">
            <label>Title</label>
            <input
              className="hod-input"
              placeholder="Announcement title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="hod-form-row">
            <label>Content</label>
            <textarea
              className="hod-input"
              placeholder="Announcement content..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
            />
          </div>
          <div className="hod-form-actions">
            <button className="inst-btn primary" onClick={handlePost} disabled={posting || !title.trim()}>
              <Bell size={16} /> {posting ? "Posting..." : "Post Announcement"}
            </button>
            <button className="inst-btn inst-btn-secondary" onClick={() => { setTitle(""); setContent(""); }}>
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="card">
        <div className="card-header">
          <h2>📋 Announcements</h2>
        </div>
        {loading ? (
          <div className="inst-loading">Loading...</div>
        ) : announcements.length === 0 ? (
          <div className="hod-empty">
            <div className="empty-icon">📢</div>
            <p>No announcements yet.</p>
          </div>
        ) : (
          <div className="hod-announce-list">
            {announcements.map((a) => (
              <div key={a.id} className="hod-announce-item">
                <div className="hod-announce-icon">📢</div>
                <div className="hod-announce-info">
                  <strong>{a.title || "Untitled"}</strong>
                  <span>{a.content?.slice(0, 120)}...</span>
                  <span className="hod-sub">{a.createdAt ? new Date(a.createdAt).toLocaleString() : ""}</span>
                </div>
                <div className="hod-announce-actions">
                  <button className="inst-btn inst-btn-small"><Bell size={14} /> View</button>
                  <button className="inst-btn inst-btn-small danger"><Trash2 size={14} /> Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
