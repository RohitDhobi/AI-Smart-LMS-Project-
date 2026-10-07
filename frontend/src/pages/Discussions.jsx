import React, { useEffect, useState } from "react";
import { api } from "../api";
import { Loading, Empty, Page } from "../ui";
import { getStoredUser } from "../ui";

function Discussions() {

  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");

  // create form
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", tag: "", courseId: "" });
  const [courses, setCourses] = useState([]);

  // selected discussion
  const [selected, setSelected] = useState(null);
  const [replies, setReplies] = useState([]);
  const [replyText, setReplyText] = useState("");
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);

  const user = getStoredUser();

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    try {
      setLoading(true);
      setError("");
      const [discList, courseList] = await Promise.all([
        api.discussions(),
        api.courses().catch(() => [])
      ]);
      setDiscussions(Array.isArray(discList) ? discList : []);
      setCourses(Array.isArray(courseList) ? courseList : []);
    } catch (e) {
      setError(e.message || "Unable to load discussions.");
    } finally {
      setLoading(false);
    }
  }

  async function createDiscussion(event) {
    event.preventDefault();
    try {
      setError("");
      setNotice("");
      const body = {
        title: form.title,
        content: form.content,
        tag: form.tag || null,
        course: form.courseId ? { id: Number(form.courseId) } : null
      };
      const result = await api.createDiscussion(body);
      setDiscussions(current => [result, ...current]);
      setForm({ title: "", content: "", tag: "", courseId: "" });
      setShowForm(false);
      setNotice("Discussion created successfully!");
    } catch (e) {
      setError(e.message || "Unable to create discussion.");
    }
  }

  async function openDiscussion(disc) {
    setSelected(disc);
    setLoadingReplies(true);
    setReplyText("");
    try {
      const replyList = await api.discussionReplies(disc.id);
      setReplies(Array.isArray(replyList) ? replyList : []);
    } catch {
      setReplies([]);
    } finally {
      setLoadingReplies(false);
    }
  }

  async function sendReply(event) {
    event.preventDefault();
    if (!replyText.trim() || !selected) return;
    try {
      setSendingReply(true);
      const result = await api.addDiscussionReply(selected.id, replyText);
      setReplies(current => [...current, result]);
      setReplyText("");
    } catch (e) {
      setError(e.message || "Unable to send reply.");
    } finally {
      setSendingReply(false);
    }
  }

  async function toggleLike(disc) {
    try {
      const updated = await api.toggleDiscussionLike(disc.id);
      setDiscussions(current =>
        current.map(d => d.id === disc.id ? { ...d, likes: updated.likes } : d)
      );
      if (selected?.id === disc.id) {
        setSelected({ ...selected, likes: updated.likes });
      }
    } catch {}
  }

  async function toggleSolved(disc) {
    try {
      const updated = await api.toggleDiscussionSolved(disc.id);
      setDiscussions(current =>
        current.map(d => d.id === disc.id ? { ...d, solved: updated.solved } : d)
      );
      if (selected?.id === disc.id) {
        setSelected({ ...selected, solved: updated.solved });
      }
    } catch {}
  }

  const filtered = discussions.filter(d =>
    !search.trim() ||
    d.title?.toLowerCase().includes(search.trim().toLowerCase()) ||
    d.content?.toLowerCase().includes(search.trim().toLowerCase()) ||
    d.tag?.toLowerCase().includes(search.trim().toLowerCase())
  );

  if (loading) return <Loading />;

  return (
    <Page
      title="Discussion Forum"
      subtitle="Ask questions, share knowledge, and help fellow students."
    >

      {error && <div className="error">{error}</div>}
      {notice && <div className="notice">{notice}</div>}

      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <div className="dash-search" style={{ flex: 1, maxWidth: 400 }}>
          <span>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search discussions..."
          />
        </div>
        <button className="primary" onClick={() => setShowForm(s => !s)}>
          {showForm ? "Cancel" : "+ New Discussion"}
        </button>
      </div>

      {showForm && (
        <section className="card">
          <h3>Start a New Discussion</h3>
          <form onSubmit={createDiscussion}>
            <div className="form-grid">
              <div className="form-field">
                <label>Title</label>
                <input
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="What's your question?"
                  required
                />
              </div>
              <div className="form-field">
                <label>Tag</label>
                <select value={form.tag} onChange={e => setForm({ ...form, tag: e.target.value })}>
                  <option value="">Select tag</option>
                  <option value="Question">Question</option>
                  <option value="Discussion">Discussion</option>
                  <option value="Help">Help</option>
                  <option value="Resource">Resource</option>
                </select>
              </div>
            </div>
            <div className="form-field">
              <label>Course (optional)</label>
              <select value={form.courseId} onChange={e => setForm({ ...form, courseId: e.target.value })}>
                <option value="">General</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>Content</label>
              <textarea
                value={form.content}
                onChange={e => setForm({ ...form, content: e.target.value })}
                rows="5"
                placeholder="Describe your question or topic in detail..."
                required
              />
            </div>
            <button className="primary">Post Discussion</button>
          </form>
        </section>
      )}

      {filtered.length === 0 ? (
        <Empty text="No discussions yet. Start the first one!" />
      ) : (
        <div className="notification-list">
          {filtered.map(disc => (
            <div
              className={`card notification ${disc.solved ? "read" : "unread"}`}
              key={disc.id}
              style={{ cursor: "pointer" }}
              onClick={() => openDiscussion(disc)}
            >
              <div style={{ flex: 1 }}>
                <h3>
                  {disc.solved && <span style={{ color: "var(--success)", marginRight: 6 }}>✓ Solved</span>}
                  {disc.title}
                </h3>
                <p style={{ fontSize: 13, marginBottom: 6 }}>
                  {disc.content?.slice(0, 150)}{disc.content?.length > 150 ? "..." : ""}
                </p>
                <div style={{ display: "flex", gap: 10, fontSize: 12, color: "var(--text-muted)" }}>
                  <span>👤 {disc.author?.name || "Anonymous"}</span>
                  {disc.tag && <span className="meta-chip">{disc.tag}</span>}
                  <span>❤️ {disc.likes || 0}</span>
                  <span>💬 {disc.replies?.length || 0} replies</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Discussion Detail Modal */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 700 }}>
            <div className="modal-head">
              <h3>{selected.title}</h3>
              <button className="modal-close" onClick={() => setSelected(null)}>✕</button>
            </div>

            <div style={{ padding: "0 0 16px", borderBottom: "1px solid var(--border)" }}>
              <p style={{ whiteSpace: "pre-wrap" }}>{selected.content}</p>
              <div style={{ display: "flex", gap: 10, marginTop: 10, fontSize: 13, color: "var(--text-muted)" }}>
                <span>👤 {selected.author?.name || "Anonymous"}</span>
                {selected.tag && <span className="meta-chip">{selected.tag}</span>}
                <button
                  className="secondary small"
                  onClick={(e) => { e.stopPropagation(); toggleLike(selected); }}
                >
                  ❤️ {selected.likes || 0}
                </button>
                {(user?.role === "ADMIN" || user?.role === "INSTRUCTOR" || selected.author?.email === user?.email) && (
                  <button
                    className="secondary small"
                    onClick={(e) => { e.stopPropagation(); toggleSolved(selected); }}
                  >
                    {selected.solved ? "🔄 Unmark Solved" : "✓ Mark Solved"}
                  </button>
                )}
              </div>
            </div>

            <div style={{ maxHeight: 400, overflow: "auto", margin: "12px 0" }}>
              <h4>💬 Replies ({replies.length})</h4>
              {loadingReplies ? (
                <Loading />
              ) : replies.length === 0 ? (
                <p style={{ color: "var(--text-muted)", fontSize: 13 }}>No replies yet. Be the first!</p>
              ) : (
                replies.map(reply => (
                  <div
                    key={reply.id}
                    style={{
                      padding: "12px",
                      marginBottom: 8,
                      background: reply.isTeacherResponse ? "var(--primary-light)" : "var(--surface-soft)",
                      border: "1px solid var(--border)",
                      borderRadius: 10
                    }}
                  >
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                      <strong style={{ fontSize: 13 }}>{reply.author?.name || "Anonymous"}</strong>
                      {reply.isTeacherResponse && (
                        <span className="role-badge role-instructor">Instructor</span>
                      )}
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                        {reply.createdAt ? new Date(reply.createdAt).toLocaleString() : ""}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: 14, whiteSpace: "pre-wrap" }}>{reply.content}</p>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={sendReply} style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <input
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                placeholder="Write a reply..."
                style={{ flex: 1 }}
                required
              />
              <button className="primary" disabled={sendingReply}>
                {sendingReply ? "..." : "Reply"}
              </button>
            </form>
          </div>
        </div>
      )}

    </Page>
  );
}

export default Discussions;
