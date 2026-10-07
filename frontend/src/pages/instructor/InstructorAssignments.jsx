import React, { useEffect, useState, useRef } from "react";
import { api } from "../../api";

export default function InstructorAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", subject: "", maximumMarks: 100, dueDate: "" });
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => { loadAssignments(); }, []);

  async function loadAssignments() {
    try {
      setLoading(true);
      const data = await api.assignments().catch(() => []);
      setAssignments(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  function handleDrag(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  }

  function handleFileSelect(e) {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  }

  function formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  function getFileIcon(filename) {
    const ext = filename.split(".").pop().toLowerCase();
    const icons = {
      pdf: "📄", doc: "📝", docx: "📝", txt: "📃", ppt: "📊", pptx: "📊",
      xls: "📈", xlsx: "📈", csv: "📈", jpg: "🖼️", jpeg: "🖼️", png: "🖼️",
      gif: "🖼️", svg: "🖼️", mp4: "🎬", avi: "🎬", mov: "🎬", mkv: "🎬",
      mp3: "🎵", wav: "🎵", zip: "📦", rar: "📦", "7z": "📦",
      js: "💻", py: "💻", java: "💻", cpp: "💻", html: "🌐", css: "🎨",
    };
    return icons[ext] || "📎";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setSaving(true);

      if (selectedFile) {
        // Use FormData for file upload
        const formData = new FormData();
        formData.append("title", form.title);
        formData.append("description", form.description);
        formData.append("subject", form.subject);
        formData.append("maximumMarks", String(form.maximumMarks));
        formData.append("dueDate", form.dueDate);
        formData.append("file", selectedFile);

        await api.instructorCreateAssignmentForm(formData);
      } else {
        await api.instructorCreateAssignment(form);
      }

      setShowForm(false);
      setForm({ title: "", description: "", subject: "", maximumMarks: 100, dueDate: "" });
      setSelectedFile(null);
      loadAssignments();
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  }

  function handleCancel() {
    setShowForm(false);
    setForm({ title: "", description: "", subject: "", maximumMarks: 100, dueDate: "" });
    setSelectedFile(null);
  }

  return (
    <div className="inst-page">
      <div className="inst-page-header">
        <div>
          <h1>📝 Assignments</h1>
          <p>Create and manage course assignments.</p>
        </div>
        <button className="inst-btn primary" onClick={() => setShowForm(true)}>+ Create Assignment</button>
      </div>

      {showForm && (
        <form className="inst-form card" onSubmit={handleSubmit}>
          <h3>Create Assignment</h3>

          <div className="inst-form-group">
            <label>Title *</label>
            <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Assignment 1 - Data Structures" />
          </div>

          <div className="inst-form-group">
            <label>Description</label>
            <textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe the assignment..." />
          </div>

          <div className="inst-form-row">
            <div className="inst-form-group">
              <label>Subject/Course</label>
              <input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="e.g. Computer Science" />
            </div>
            <div className="inst-form-group">
              <label>Max Marks</label>
              <input type="number" value={form.maximumMarks} onChange={e => setForm({ ...form, maximumMarks: Number(e.target.value) })} />
            </div>
          </div>

          <div className="inst-form-group">
            <label>Due Date</label>
            <input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
          </div>

          {/* File Upload Area */}
          <div className="inst-form-group">
            <label>📎 Attachment (optional)</label>
            <div
              className={`inst-upload-area ${dragActive ? "drag-active" : ""} ${selectedFile ? "has-file" : ""}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                style={{ display: "none" }}
                onChange={handleFileSelect}
              />
              {selectedFile ? (
                <div className="inst-upload-file-info">
                  <span className="inst-upload-file-icon">{getFileIcon(selectedFile.name)}</span>
                  <div className="inst-upload-file-details">
                    <strong>{selectedFile.name}</strong>
                    <span>{formatFileSize(selectedFile.size)}</span>
                  </div>
                  <button
                    type="button"
                    className="inst-btn-icon danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="inst-upload-placeholder">
                  <span className="inst-upload-icon">📁</span>
                  <p>Drag and drop a file here, or click to browse</p>
                  <span className="inst-upload-hint">
                    Supports any file type — PDF, Word, Excel, images, videos, archives, code files, and more
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="inst-form-actions">
            <button type="button" className="inst-btn secondary" onClick={handleCancel}>Cancel</button>
            <button type="submit" className="inst-btn primary" disabled={saving}>{saving ? "Creating..." : "Create"}</button>
          </div>
        </form>
      )}

      {loading ? <div className="inst-loading">Loading...</div> : assignments.length === 0 ? (
        <div className="inst-empty">
          <div className="inst-empty-icon">📝</div>
          <h3>No Assignments Yet</h3>
          <p>Create your first assignment to get started.</p>
        </div>
      ) : (
        <div className="inst-grid">
          {assignments.map(a => (
            <div key={a.id} className="card inst-list-item">
              <h3>{a.title}</h3>
              <p>{a.description || "No description"}</p>
              {a.attachment && (
                <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 18 }}>{getFileIcon(a.attachment)}</span>
                  <span style={{ fontSize: 12, color: "#64748b" }}>{a.attachment}</span>
                </div>
              )}
              <div className="inst-list-meta">
                <span>📊 Max: {a.maximumMarks || 100}</span>
                {a.dueDate && <span>📅 Due: {new Date(a.dueDate).toLocaleDateString()}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
