import React, { useEffect, useState } from "react";
import { api } from "../../api";
import { Loading, Empty, Page } from "../../ui";

export default function AdminSemesters() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [courseDetail, setCourseDetail] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  const [showSettingsForm, setShowSettingsForm] = useState(false);
  const [totalSemesters, setTotalSemesters] = useState(6);

  const [showSubjectForm, setShowSubjectForm] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [subjectForm, setSubjectForm] = useState({
    subjectCode: "",
    subjectName: "",
    description: "",
    semester: 1,
  });

  const [activeSemester, setActiveSemester] = useState(null);

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    if (selectedCourseId) loadCourseDetail(selectedCourseId);
  }, [selectedCourseId]);

  async function loadCourses() {
    try {
      setLoading(true);
      setError("");
      const list = await api.adminCourses();
      setCourses(Array.isArray(list) ? list : []);
    } catch (e) {
      setError(e.message || "Unable to load courses.");
    } finally {
      setLoading(false);
    }
  }

  async function loadCourseDetail(courseId) {
    try {
      setLoadingSubjects(true);
      setError("");
      const subjectsList = await api.courseSubjects(courseId);
      setSubjects(Array.isArray(subjectsList) ? subjectsList : []);

      const course = courses.find((c) => Number(c.id) === Number(courseId));
      if (course) {
        setCourseDetail(course);
        const ts = course.totalSemesters || 6;
        setTotalSemesters(ts);
        setActiveSemester(1);
      }
    } catch (e) {
      setError(e.message || "Unable to load course details.");
    } finally {
      setLoadingSubjects(false);
    }
  }

  // ===== Update total semesters =====

  async function updateTotalSemesters(e) {
    e.preventDefault();
    if (!selectedCourseId) return;
    try {
      setError("");
      setNotice("");
      await api.adminUpdateCourse(selectedCourseId, {
        ...courseDetail,
        totalSemesters: Number(totalSemesters),
      });
      setNotice("Semester settings updated successfully.");
      setShowSettingsForm(false);
      await loadCourses();
      await loadCourseDetail(selectedCourseId);
    } catch (e) {
      setError(e.message || "Unable to update semester settings.");
    }
  }

  // ===== Create / Update Subject =====

  async function handleSubjectSubmit(e) {
    e.preventDefault();
    if (!selectedCourseId) return;
    try {
      setError("");
      setNotice("");
      if (editingSubject) {
        await api.adminUpdateSubject(editingSubject.id, {
          subjectCode: subjectForm.subjectCode,
          subjectName: subjectForm.subjectName,
          description: subjectForm.description,
          semester: Number(subjectForm.semester),
        });
        setNotice("Subject updated successfully.");
      } else {
        await api.adminCreateSubject({
          courseId: Number(selectedCourseId),
          subjectCode: subjectForm.subjectCode,
          subjectName: subjectForm.subjectName,
          description: subjectForm.description,
          semester: Number(subjectForm.semester),
        });
        setNotice("Subject created successfully.");
      }
      setShowSubjectForm(false);
      setEditingSubject(null);
      resetSubjectForm();
      await loadCourseDetail(selectedCourseId);
    } catch (e) {
      setError(e.message || "Unable to save subject.");
    }
  }

  function resetSubjectForm() {
    setSubjectForm({
      subjectCode: "",
      subjectName: "",
      description: "",
      semester: activeSemester || 1,
    });
  }

  function startEditSubject(subject) {
    setEditingSubject(subject);
    setSubjectForm({
      subjectCode: subject.subjectCode || "",
      subjectName: subject.subjectName || "",
      description: subject.description || "",
      semester: subject.semester || 1,
    });
    setShowSubjectForm(true);
  }

  async function deleteSubject(subject) {
    if (!window.confirm(`Delete subject "${subject.subjectName}"?`)) return;
    try {
      setError("");
      setNotice("");
      await api.adminDeleteSubject(subject.id);
      setNotice("Subject deleted successfully.");
      await loadCourseDetail(selectedCourseId);
    } catch (e) {
      setError(e.message || "Unable to delete subject.");
    }
  }

  function getSubjectsForSemester(sem) {
    return subjects.filter((s) => Number(s.semester) === Number(sem));
  }

  if (loading) return <Loading />;

  return (
    <Page
      title="📅 Semester Management"
      subtitle="Manage semesters and organize subjects for each course."
    >
      {error && <div className="error">{error}</div>}
      {notice && <div className="notice">{notice}</div>}

      {/* ===== COURSE SELECTOR ===== */}
      <section className="card">
        <div className="dash-panel-head">
          <h3>Select Course</h3>
        </div>
        {courses.length === 0 ? (
          <Empty text="No courses found. Create a course first." />
        ) : (
          <div className="semester-course-grid">
            {courses.map((course) => (
              <button
                key={course.id}
                className={`semester-course-card ${
                  Number(selectedCourseId) === Number(course.id)
                    ? "active"
                    : ""
                }`}
                onClick={() => setSelectedCourseId(course.id)}
              >
                <div className="semester-course-icon">🎓</div>
                <div className="semester-course-info">
                  <strong>{course.courseCode || course.title}</strong>
                  <span>{course.courseName || ""}</span>
                  <small>
                    {course.totalSemesters || "?"} semesters •{" "}
                    {course.subjectCount ?? subjects.length ?? 0} subjects
                  </small>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* ===== SEMESTER MANAGER ===== */}
      {selectedCourseId && (
        <section className="card">
          <div className="dash-panel-head">
            <h3>
              📖 {courseDetail?.courseCode || ""}{" "}
              {courseDetail?.courseName || "Semesters"}
            </h3>
            <button
              className="secondary small"
              onClick={() => setShowSettingsForm(!showSettingsForm)}
            >
              ⚙️ Semester Settings
            </button>
          </div>

          {/* Semester Settings Form */}
          {showSettingsForm && (
            <form
              className="semester-settings-form"
              onSubmit={updateTotalSemesters}
            >
              <div className="semester-settings-row">
                <div className="form-field" style={{ maxWidth: 200 }}>
                  <label>Total Semesters</label>
                  <input
                    type="number"
                    min={1}
                    max={24}
                    value={totalSemesters}
                    onChange={(e) =>
                      setTotalSemesters(Number(e.target.value))
                    }
                  />
                </div>
                <button className="primary small" type="submit">
                  Save
                </button>
                <button
                  className="secondary small"
                  type="button"
                  onClick={() => setShowSettingsForm(false)}
                >
                  Cancel
                </button>
              </div>
              <small className="semester-settings-hint">
                Changing this will update the available semester tabs. Subjects
                assigned to removed semesters will still exist.
              </small>
            </form>
          )}

          {loadingSubjects ? (
            <Loading />
          ) : (
            <>
              {/* Semester Tabs */}
              <div className="semester-filter-row">
                <span className="semester-filter-label">Semesters:</span>
                <div className="semester-filter-tabs">
                  {Array.from(
                    { length: courseDetail?.totalSemesters || totalSemesters },
                    (_, i) => i + 1
                  ).map((sem) => (
                    <button
                      key={sem}
                      className={`semester-tab ${
                        Number(activeSemester) === Number(sem) ? "active" : ""
                      }`}
                      onClick={() => setActiveSemester(sem)}
                    >
                      Sem {sem}
                      <span className="semester-tab-count">
                        {getSubjectsForSemester(sem).length}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Add Subject Button */}
              <div style={{ margin: "16px 0 8px", display: "flex", gap: 10 }}>
                <button
                  className="primary small"
                  onClick={() => {
                    resetSubjectForm();
                    setEditingSubject(null);
                    setShowSubjectForm(true);
                  }}
                >
                  + Add Subject to Semester {activeSemester}
                </button>
              </div>

              {/* Subject Form */}
              {showSubjectForm && (
                <div className="semester-subject-form-wrapper">
                  <form
                    className="semester-subject-form"
                    onSubmit={handleSubjectSubmit}
                  >
                    <div className="semester-subject-form-header">
                      <h4>
                        {editingSubject
                          ? "Edit Subject"
                          : `Add Subject to Semester ${subjectForm.semester}`}
                      </h4>
                      <button
                        type="button"
                        className="semester-subject-form-close"
                        onClick={() => {
                          setShowSubjectForm(false);
                          setEditingSubject(null);
                        }}
                      >
                        ✕
                      </button>
                    </div>

                    <div className="form-grid">
                      <div className="form-field">
                        <label>Subject Name *</label>
                        <input
                          required
                          value={subjectForm.subjectName}
                          onChange={(e) =>
                            setSubjectForm({
                              ...subjectForm,
                              subjectName: e.target.value,
                            })
                          }
                          placeholder="e.g. Data Structures"
                        />
                      </div>
                      <div className="form-field">
                        <label>Subject Code</label>
                        <input
                          value={subjectForm.subjectCode}
                          onChange={(e) =>
                            setSubjectForm({
                              ...subjectForm,
                              subjectCode: e.target.value,
                            })
                          }
                          placeholder="e.g. BCA-101"
                        />
                      </div>
                      <div className="form-field">
                        <label>Semester</label>
                        <select
                          value={subjectForm.semester}
                          onChange={(e) =>
                            setSubjectForm({
                              ...subjectForm,
                              semester: Number(e.target.value),
                            })
                          }
                        >
                          {Array.from(
                            {
                              length:
                                courseDetail?.totalSemesters ||
                                totalSemesters,
                            },
                            (_, i) => i + 1
                          ).map((s) => (
                            <option key={s} value={s}>
                              Semester {s}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="form-field">
                      <label>Description</label>
                      <textarea
                        rows={2}
                        value={subjectForm.description}
                        onChange={(e) =>
                          setSubjectForm({
                            ...subjectForm,
                            description: e.target.value,
                          })
                        }
                        placeholder="Short description of the subject"
                      />
                    </div>
                    <div className="semester-subject-form-actions">
                      <button className="primary small" type="submit">
                        {editingSubject ? "Save Changes" : "Create Subject"}
                      </button>
                      <button
                        className="secondary small"
                        type="button"
                        onClick={() => {
                          setShowSubjectForm(false);
                          setEditingSubject(null);
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Subjects List for Active Semester */}
              {(() => {
                const semSubjects = getSubjectsForSemester(activeSemester);
                if (semSubjects.length === 0) {
                  return (
                    <div className="empty" style={{ marginTop: 12 }}>
                      <div className="empty-icon">📚</div>
                      <p>
                        No subjects in Semester {activeSemester} yet. Click{" "}
                        <strong>"+ Add Subject"</strong> to create one.
                      </p>
                    </div>
                  );
                }
                return (
                  <div className="semester-subjects-list">
                    {semSubjects.map((subject) => (
                      <div key={subject.id} className="semester-subject-card">
                        <div className="semester-subject-card-main">
                          <div className="semester-subject-icon">📘</div>
                          <div className="semester-subject-info">
                            <strong>{subject.subjectName}</strong>
                            <span>{subject.subjectCode || "No code"}</span>
                            {subject.description && (
                              <small>{subject.description}</small>
                            )}
                          </div>
                        </div>
                        <div className="semester-subject-card-actions">
                          <button
                            className="secondary small"
                            onClick={() => startEditSubject(subject)}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            className="danger small"
                            onClick={() => deleteSubject(subject)}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </>
          )}
        </section>
      )}
    </Page>
  );
}
