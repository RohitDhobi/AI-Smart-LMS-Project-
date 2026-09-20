import React, { useEffect, useState } from "react";
import { api } from "../../api";

export default function InstructorResources() {
  const [resources, setResources] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadMode, setUploadMode] = useState("file"); // "file" or "url"
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "DOCUMENT",
    url: "",
    fileName: "",
    category: "LECTURE",
    visibility: "COURSE",
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      loadResources(selectedCourse);
    } else {
      setResources([]);
    }
  }, [selectedCourse]);

  async function loadData() {
    try {
      setLoading(true);
      const c = await api.instructorCourses().catch(() => api.adminCourses().catch(() => api.courses()));
      setCourses(Array.isArray(c) ? c : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function loadResources(courseId) {
    if (!courseId) {
      setResources([]);
      return;
    }
    try {
      const r = await api.resourcesByCourse(courseId);
      setResources(Array.isArray(r) ? r : []);
    } catch (e) {
      setResources([]);
    }
  }

  function openAddForm() {
    setEditingResource(null);
    setUploadMode("file");
    setSelectedFile(null);
    setForm({
      title: "",
      description: "",
      type: "DOCUMENT",
      url: "",
      fileName: "",
      category: "LECTURE",
      visibility: "COURSE",
    });
    setShowForm(true);
  }

  function openEditForm(resource) {
    setEditingResource(resource);
    setSelectedFile(null);
    // Determine mode based on existing resource
    if (resource.filePath) {
      setUploadMode("file");
    } else {
      setUploadMode("url");
    }
    setForm({
      title: resource.title || "",
      description: resource.description || "",
      type: resource.type || "DOCUMENT",
      url: resource.url || "",
      fileName: resource.fileName || "",
      category: resource.category || "LECTURE",
      visibility: resource.visibility || "COURSE",
    });
    setShowForm(true);
  }

  function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      // Auto-set title from filename if empty
      if (!form.title) {
        const name = file.name.replace(/\.[^/.]+$/, "");
        setForm((prev) => ({ ...prev, title: name, fileName: file.name }));
      }
      // Auto-detect type
      const ext = file.name.split(".").pop().toLowerCase();
      let type = "OTHER";
      if (["pdf", "doc", "docx", "txt", "ppt", "pptx", "xls", "xlsx"].includes(ext)) {
        type = "DOCUMENT";
      } else if (["mp4", "avi", "mov", "mkv", "webm"].includes(ext)) {
        type = "VIDEO";
      } else if (["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(ext)) {
        type = "IMAGE";
      }
      setForm((prev) => ({ ...prev, type, fileName: file.name }));
    }
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
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      if (!form.title) {
        const name = file.name.replace(/\.[^/.]+$/, "");
        setForm((prev) => ({ ...prev, title: name, fileName: file.name }));
      }
      const ext = file.name.split(".").pop().toLowerCase();
      let type = "OTHER";
      if (["pdf", "doc", "docx", "txt", "ppt", "pptx", "xls", "xlsx"].includes(ext)) {
        type = "DOCUMENT";
      } else if (["mp4", "avi", "mov", "mkv", "webm"].includes(ext)) {
        type = "VIDEO";
      } else if (["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(ext)) {
        type = "IMAGE";
      }
      setForm((prev) => ({ ...prev, type, fileName: file.name }));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selectedCourse) return alert("Select a course first");

    try {
      setSaving(true);

      if (uploadMode === "file" && selectedFile) {
        // File upload mode
        await api.uploadResource(selectedCourse, selectedFile, {
          title: form.title,
          description: form.description,
          category: form.category,
          visibility: form.visibility,
        });
      } else if (editingResource) {
        // Edit URL-based resource
        await api.updateResource(editingResource.id, form);
      } else {
        // Add URL-based resource
        await api.addResource(selectedCourse, {
          ...form,
          uploadedBy: "Instructor",
        });
      }

      setShowForm(false);
      setEditingResource(null);
      setSelectedFile(null);
      loadResources(selectedCourse);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this resource?")) return;
    try {
      await api.deleteResource(id);
      loadResources(selectedCourse);
    } catch (err) {
      alert(err.message);
    }
  }

  function handleDownload(resource) {
    if (resource.filePath || (!resource.url && resource.id)) {
      // Download file
      window.open(api.downloadResourceUrl(resource.id), "_blank");
    } else if (resource.url) {
      // Open URL
      window.open(resource.url, "_blank");
    }
  }

  function getTypeIcon(type) {
    switch (type) {
      case "DOCUMENT": return "📄";
      case "VIDEO": return "🎥";
      case "LINK": return "🔗";
      case "IMAGE": return "🖼️";
      default: return "📁";
    }
  }

  function getTypeBadgeClass(type) {
    switch (type) {
      case "DOCUMENT": return "inst-badge-blue";
      case "VIDEO": return "inst-badge-purple";
      case "LINK": return "inst-badge-green";
      case "IMAGE": return "inst-badge-orange";
      default: return "inst-badge-gray";
    }
  }

  function formatFileSize(bytes) {
    if (!bytes) return "";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  function formatDate(dateStr) {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  const filteredResources = resources.filter((r) => {
    const matchesSearch =
      !searchTerm ||
      r.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filterType || r.type === filterType;
    const matchesCategory = !filterCategory || r.category === filterCategory;
    return matchesSearch && matchesType && matchesCategory;
  });

  const resourceTypes = ["DOCUMENT", "VIDEO", "LINK", "IMAGE", "OTHER"];
  const categories = ["LECTURE", "ASSIGNMENT", "REFERENCE", "TUTORIAL", "SUPPLEMENTARY"];

  return (
    <div className="inst-page">
      <div className="inst-page-header">
        <div>
          <h1>📁 Resources</h1>
          <p>Manage course materials and learning resources</p>
        </div>
        <button className="inst-btn primary" onClick={openAddForm}>
          + Add Resource
        </button>
      </div>

      {/* Course Selector */}
      <div className="inst-filter-bar">
        <label>Select Course:</label>
        <select
          value={selectedCourse}
          onChange={(e) => {
            setSelectedCourse(e.target.value);
          }}
        >
          <option value="">Choose a course</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </div>

      {/* Resource Form */}
      {showForm && (
        <form className="inst-form card" onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
          <h3>{editingResource ? "Edit Resource" : "Add New Resource"}</h3>
          {!selectedCourse && (
            <p className="inst-warning">⚠️ Select a course first from the dropdown above.</p>
          )}

          {/* Upload Mode Toggle (only when adding new) */}
          {!editingResource && (
            <div className="inst-upload-toggle">
              <button
                type="button"
                className={`inst-toggle-btn ${uploadMode === "file" ? "active" : ""}`}
                onClick={() => setUploadMode("file")}
              >
                📤 Upload File
              </button>
              <button
                type="button"
                className={`inst-toggle-btn ${uploadMode === "url" ? "active" : ""}`}
                onClick={() => setUploadMode("url")}
              >
                🔗 Add URL
              </button>
            </div>
          )}

          {/* File Upload Area */}
          {uploadMode === "file" && !editingResource && (
            <div
              className={`inst-upload-area ${dragActive ? "drag-active" : ""} ${selectedFile ? "has-file" : ""}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById("file-input").click()}
            >
              <input
                id="file-input"
                type="file"
                style={{ display: "none" }}
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx,.mp4,.avi,.mov,.mkv,.jpg,.jpeg,.png,.gif,.svg,.zip,.rar"
              />
              {selectedFile ? (
                <div className="inst-upload-file-info">
                  <span className="inst-upload-file-icon">{getTypeIcon(form.type)}</span>
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
                    Supports PDF, Word, Excel, PowerPoint, images, videos, and archives (max 50MB)
                  </span>
                </div>
              )}
            </div>
          )}

          {/* URL Input (when in URL mode or editing) */}
          {(uploadMode === "url" || editingResource) && (
            <div className="inst-form-group">
              <label>URL / Link *</label>
              <input
                required
                placeholder="https://example.com/resource.pdf"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
              />
            </div>
          )}

          <div className="inst-form-group">
            <label>Title *</label>
            <input
              required
              placeholder="e.g. Lecture Notes - Chapter 1"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div className="inst-form-group">
            <label>Description</label>
            <textarea
              rows={3}
              placeholder="Brief description of the resource..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="inst-form-row">
            <div className="inst-form-group">
              <label>Type *</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                {resourceTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="inst-form-group">
              <label>Category *</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="inst-form-row">
            {uploadMode === "url" && (
              <div className="inst-form-group">
                <label>File Name</label>
                <input
                  placeholder="resource.pdf"
                  value={form.fileName}
                  onChange={(e) => setForm({ ...form, fileName: e.target.value })}
                />
              </div>
            )}
            <div className="inst-form-group">
              <label>Visibility</label>
              <select
                value={form.visibility}
                onChange={(e) => setForm({ ...form, visibility: e.target.value })}
              >
                <option value="COURSE">Course Only</option>
                <option value="PUBLIC">Public</option>
                <option value="PRIVATE">Private</option>
              </select>
            </div>
          </div>

          <div className="inst-form-actions">
            <button
              type="button"
              className="inst-btn secondary"
              onClick={() => {
                setShowForm(false);
                setEditingResource(null);
                setSelectedFile(null);
              }}
            >
              Cancel
            </button>
            <button type="submit" className="inst-btn primary" disabled={saving || !selectedCourse}>
              {saving
                ? "Saving..."
                : editingResource
                ? "Update Resource"
                : uploadMode === "file" && selectedFile
                ? "Upload & Add"
                : "Add Resource"}
            </button>
          </div>
        </form>
      )}

      {/* Filters */}
      {selectedCourse && (
        <div className="inst-filters">
          <div className="inst-search-wrapper">
            <span className="inst-search-icon">🔍</span>
            <input
              className="inst-input"
              placeholder="Search resources..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="inst-input"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">All Types</option>
            {resourceTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select
            className="inst-input"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Resources List */}
      <div className="inst-section">
        {selectedCourse ? (
          filteredResources.length === 0 ? (
            <div className="inst-empty">
              <div className="inst-empty-icon">📁</div>
              <h3>No Resources Found</h3>
              <p>
                {resources.length === 0
                  ? "No resources added yet. Click 'Add Resource' to get started."
                  : "No resources match your search criteria."}
              </p>
            </div>
          ) : (
            <div className="inst-resource-list">
              {filteredResources.map((r) => (
                <div key={r.id} className="inst-resource-card card">
                  <div className="inst-resource-header">
                    <div className="inst-resource-icon">{getTypeIcon(r.type)}</div>
                    <div className="inst-resource-info">
                      <h4>{r.title}</h4>
                      <p className="inst-resource-desc">{r.description || "No description"}</p>
                    </div>
                    <div className="inst-resource-actions">
                      <button
                        className="inst-btn-icon"
                        title="Download / Open"
                        onClick={() => handleDownload(r)}
                      >
                        ⬇️
                      </button>
                      <button
                        className="inst-btn-icon"
                        title="Edit"
                        onClick={() => openEditForm(r)}
                      >
                        ✏️
                      </button>
                      <button
                        className="inst-btn-icon danger"
                        title="Delete"
                        onClick={() => handleDelete(r.id)}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  <div className="inst-resource-meta">
                    <span className={`inst-badge ${getTypeBadgeClass(r.type)}`}>{r.type}</span>
                    <span className="inst-badge inst-badge-gray">{r.category}</span>
                    {r.visibility === "PUBLIC" && (
                      <span className="inst-badge inst-badge-green">Public</span>
                    )}
                    {r.visibility === "PRIVATE" && (
                      <span className="inst-badge inst-badge-orange">Private</span>
                    )}
                    {r.filePath && (
                      <span className="inst-resource-file">📎 {r.fileName || "Uploaded file"}</span>
                    )}
                    {r.url && !r.filePath && (
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inst-resource-link"
                      >
                        🔗 Open Link
                      </a>
                    )}
                    {r.fileSize > 0 && (
                      <span className="inst-resource-size">{formatFileSize(r.fileSize)}</span>
                    )}
                    <span className="inst-resource-date">
                      📅 {formatDate(r.createdAt)}
                    </span>
                    {r.downloadCount > 0 && (
                      <span className="inst-resource-downloads">⬇️ {r.downloadCount}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="inst-empty">
            <div className="inst-empty-icon">📁</div>
            <h3>Resources</h3>
            <p>Select a course to manage its resources, or click "Add Resource" to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
