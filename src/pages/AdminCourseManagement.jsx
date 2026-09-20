import React, { useEffect, useState, useRef, useCallback } from "react";
import { api } from "../api";
import { Empty, Loading, Page } from "../ui";

function AdminCourseManagement() {

  const [role, setRole] =
    useState(null);

  const [courses, setCourses] =
    useState([]);

  const [selectedCourseId, setSelectedCourseId] =
    useState(null);

  const [subjects, setSubjects] =
    useState([]);

  const [students, setStudents] =
    useState([]);

  const [selectedSubjectId, setSelectedSubjectId] =
    useState(null);

  const [lessons, setLessons] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [notice, setNotice] =
    useState("");

  // ---------- course form ----------

  const [showCourseForm, setShowCourseForm] =
    useState(false);

  const [courseForm, setCourseForm] =
    useState({
      courseCode: "",
      courseName: "",
      description: "",
      duration: ""
    });

  const [editingCourse, setEditingCourse] =
    useState(null);

  // ---------- subject form ----------

  const [subjectForm, setSubjectForm] =
    useState({
      subjectCode: "",
      subjectName: "",
      description: ""
    });

  const [editingSubject, setEditingSubject] =
    useState(null);

  // ---------- lesson form ----------

  const [lessonForm, setLessonForm] =
    useState({
      title: "",
      description: "",
      content: "",
      durationMinutes: 30
    });

  const [editingLesson, setEditingLesson] =
    useState(null);

  const editRef = useRef(null);
  const manageRef = useRef(null);

  const selectedCourse =
    courses.find(c =>
      Number(c.id) === Number(selectedCourseId)
    ) || null;

  // =========================================================

  useEffect(() => {

    loadAll();

  }, []);

  useEffect(() => {
    if (selectedCourse && manageRef.current) {
      manageRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selectedCourse]);

  useEffect(() => {
    if (editingCourse && editRef.current) {
      editRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [editingCourse]);

  async function loadAll() {

    try {

      setLoading(true);
      setError("");

      const profile = await api.profile();

      setRole(profile?.role || null);

      if (profile?.role !== "ADMIN") {
        setError("Access denied. Admin role required.");
        return;
      }

      const list = await api.adminCourses();

      setCourses(
        Array.isArray(list) ? list : []
      );

    } catch (e) {

      setError(
        e.message ||
        "Unable to load courses."
      );

    } finally {

      setLoading(false);

    }
  }

  // ---------- course selection ----------

  async function selectCourse(courseId) {

    setSelectedCourseId(courseId);
    setSelectedSubjectId(null);
    setLessons([]);
    setStudents([]);
    setEditingCourse(null);
    setEditingSubject(null);
    setEditingLesson(null);
    setNotice("");

    if (!courseId) {
      setSubjects([]);
      return;
    }

    try {

      const [subjectList, studentList] =
        await Promise.all([
          api.courseSubjects(courseId),
          api.adminCourseStudents(courseId)
        ]);

      setSubjects(
        Array.isArray(subjectList) ? subjectList : []
      );

      setStudents(
        Array.isArray(studentList) ? studentList : []
      );

    } catch (e) {

      setError(
        e.message || "Unable to load course details."
      );

    }
  }

  // ---------- courses CRUD ----------

  async function createCourse(event) {

    event.preventDefault();

    try {

      setError("");
      setNotice("");

      await api.adminCreateCourse(courseForm);

      setCourseForm({
        courseCode: "",
        courseName: "",
        description: "",
        duration: ""
      });

      setShowCourseForm(false);

      setNotice("Course created successfully.");

      await loadAll();

    } catch (e) {

      setError(e.message || "Unable to create course.");

    }
  }

  async function updateCourse(event) {

    event.preventDefault();

    try {

      setError("");
      setNotice("");

      await api.adminUpdateCourse(
        editingCourse.id,
        {
          courseCode: editingCourse.courseCode,
          courseName: editingCourse.courseName,
          description: editingCourse.description,
          duration: editingCourse.duration,
        }
      );

      setEditingCourse(null);

      setNotice("Course updated successfully.");

      await loadAll();

    } catch (e) {

      setError(e.message || "Unable to update course.");

    }
  }

  async function deleteCourse(course) {

    if (!window.confirm(
      `Delete course "${course.courseCode || course.courseName}"? ` +
      "All subjects, lessons and enrollments will be removed."
    )) {
      return;
    }

    try {

      setError("");
      setNotice("");

      await api.adminDeleteCourse(course.id);

      if (Number(selectedCourseId) === Number(course.id)) {
        setSelectedCourseId(null);
        setSubjects([]);
        setStudents([]);
        setLessons([]);
        setSelectedSubjectId(null);
      }

      setNotice("Course deleted successfully.");

      await loadAll();

    } catch (e) {

      setError(e.message || "Unable to delete course.");

    }
  }

  // ---------- subjects CRUD ----------

  async function createSubject(event) {

    event.preventDefault();

    try {

      setError("");
      setNotice("");

      await api.adminCreateSubject({
        courseId: selectedCourseId,
        subjectCode: subjectForm.subjectCode,
        subjectName: subjectForm.subjectName,
        description: subjectForm.description,
      });

      setSubjectForm({
        subjectCode: "",
        subjectName: "",
        description: ""
      });

      setNotice("Subject added successfully.");

      await selectCourse(selectedCourseId);

    } catch (e) {

      setError(e.message || "Unable to add subject.");

    }
  }

  async function updateSubject(event) {

    event.preventDefault();

    try {

      setError("");
      setNotice("");

      await api.adminUpdateSubject(
        editingSubject.id,
        {
          subjectCode: editingSubject.subjectCode,
          subjectName: editingSubject.subjectName,
          description: editingSubject.description,

        }
      );

      setEditingSubject(null);

      setNotice("Subject updated successfully.");

      await selectCourse(selectedCourseId);

    } catch (e) {

      setError(e.message || "Unable to update subject.");

    }
  }

  async function deleteSubject(subject) {

    if (!window.confirm(
      `Delete subject "${subject.subjectName}"?`
    )) {
      return;
    }

    try {

      setError("");
      setNotice("");

      await api.adminDeleteSubject(subject.id);

      if (Number(selectedSubjectId) === Number(subject.id)) {
        setSelectedSubjectId(null);
        setLessons([]);
      }

      setNotice("Subject deleted successfully.");

      await selectCourse(selectedCourseId);

    } catch (e) {

      setError(e.message || "Unable to delete subject.");

    }
  }

  // ---------- lessons CRUD ----------

  async function selectSubject(subjectId) {

    setSelectedSubjectId(subjectId);
    setEditingLesson(null);
    setNotice("");

    if (!subjectId) {
      setLessons([]);
      return;
    }

    try {

      const data = await api.subject(subjectId);

      setLessons(
        Array.isArray(data.lessons) ? data.lessons : []
      );

    } catch (e) {

      setError(e.message || "Unable to load lessons.");

    }
  }

  async function createLesson(event) {

    event.preventDefault();

    if (!selectedSubjectId) {
      setError("Select a subject first.");
      return;
    }

    try {

      setError("");
      setNotice("");

      await api.adminAddLesson(selectedSubjectId, lessonForm);

      setLessonForm({
        title: "",
        description: "",
        content: "",
        durationMinutes: 30
      });

      setNotice("Lesson added successfully.");

      await selectSubject(selectedSubjectId);

    } catch (e) {

      setError(e.message || "Unable to add lesson.");

    }
  }

  async function updateLesson(event) {

    event.preventDefault();

    try {

      setError("");
      setNotice("");

      await api.adminUpdateLesson(editingLesson.id, {
        title: editingLesson.title,
        description: editingLesson.description,
        content: editingLesson.content,
        durationMinutes: Number(editingLesson.durationMinutes)
      });

      setEditingLesson(null);

      setNotice("Lesson updated successfully.");

      await selectSubject(selectedSubjectId);

    } catch (e) {

      setError(e.message || "Unable to update lesson.");

    }
  }

  async function deleteLesson(lesson) {

    if (!window.confirm(
      `Delete lesson "${lesson.title}"?`
    )) {
      return;
    }

    try {

      setError("");
      setNotice("");

      await api.adminDeleteLesson(lesson.id);

      setNotice("Lesson deleted successfully.");

      await selectSubject(selectedSubjectId);

    } catch (e) {

      setError(e.message || "Unable to delete lesson.");

    }
  }

  // =========================================================

  if (loading) {
    return <Loading />;
  }

  const selectedSubject =
    subjects.find(s =>
      Number(s.id) === Number(selectedSubjectId)
    ) || null;

  return (
    <Page
      title="Course Management"
      subtitle="Create courses, manage subjects and lessons, view enrolled students."
    >

      {error && (
        <div className="error">{error}</div>
      )}

      {notice && (
        <div className="notice">{notice}</div>
      )}

      {/* =================================================
          CREATE COURSE
      ================================================= */}

      <section className="card">

        <div className="dash-panel-head">
          <h3>Courses</h3>
          <button
            className="secondary small"
            onClick={() =>
              setShowCourseForm(s => !s)
            }
          >
            {showCourseForm
              ? "Cancel"
              : "+ Create Course"}
          </button>
        </div>

        {showCourseForm && (

          <form
            className="admin-form"
            onSubmit={createCourse}
          >

            <div className="form-grid">

              <div className="form-field">
                <label>Course Code</label>
                <input
                  value={courseForm.courseCode}
                  onChange={e =>
                    setCourseForm({
                      ...courseForm,
                      courseCode: e.target.value
                    })
                  }
                  placeholder="e.g. BCA"
                  required
                />
              </div>

              <div className="form-field">
                <label>Course Name</label>
                <input
                  value={courseForm.courseName}
                  onChange={e =>
                    setCourseForm({
                      ...courseForm,
                      courseName: e.target.value
                    })
                  }
                  placeholder="e.g. Bachelor of Computer Applications"
                  required
                />
              </div>

              <div className="form-field">
                <label>Duration</label>
                <input
                  value={courseForm.duration}
                  onChange={e =>
                    setCourseForm({
                      ...courseForm,
                      duration: e.target.value
                    })
                  }
                  placeholder="e.g. 3 Years"
                />
              </div>

            </div>

            <div className="form-field">
              <label>Description</label>
              <textarea
                value={courseForm.description}
                onChange={e =>
                  setCourseForm({
                    ...courseForm,
                    description: e.target.value
                  })
                }
                rows="2"
                placeholder="Short description of the program"
              />
            </div>

            <button className="primary" type="submit">
              Create Course
            </button>

          </form>

        )}

        {courses.length === 0 ? (

          <Empty text="No courses found." />

        ) : (

          <div className="data-table-wrap">

            <table className="data-table">

              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Subjects</th>
                  <th>Students</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>

                {courses.map(course => (
                  <tr
                    key={course.id}
                    className={
                      Number(selectedCourseId) ===
                      Number(course.id)
                        ? "row-selected"
                        : ""
                    }
                  >

                    <td>
                      <strong>
                        {course.courseCode || "—"}
                      </strong>
                    </td>

                    <td>
                      {course.courseName || course.title}
                    </td>

                    <td>
                      {course.subjectCount ?? 0}
                    </td>

                    <td>
                      {course.studentCount ?? 0}
                    </td>

                    <td>

                      <button
                        className="secondary small"
                        onClick={() =>
                          selectCourse(course.id)
                        }
                      >
                        Manage
                      </button>

                      <button
                        className="secondary small"
                        onClick={() =>
                          setEditingCourse({ ...course })
                        }
                      >
                        Edit
                      </button>

                      <button
                        className="danger small"
                        onClick={() =>
                          deleteCourse(course)
                        }
                      >
                        Delete
                      </button>

                    </td>

                  </tr>
                ))}

              </tbody>

            </table>

          </div>

        )}

      </section>


      {/* =================================================
          EDIT COURSE
      ================================================= */}

      {editingCourse && (

        <section className="card" ref={editRef}>

          <div className="dash-panel-head">
            <h3>
              Edit Course{" "}
              {editingCourse.courseCode || ""}
            </h3>
          </div>

          <form
            className="admin-form"
            onSubmit={updateCourse}
          >

            <div className="form-grid">

              <div className="form-field">
                <label>Course Code</label>
                <input
                  value={editingCourse.courseCode || ""}
                  onChange={e =>
                    setEditingCourse({
                      ...editingCourse,
                      courseCode: e.target.value
                    })
                  }
                />
              </div>

              <div className="form-field">
                <label>Course Name</label>
                <input
                  value={editingCourse.courseName || ""}
                  onChange={e =>
                    setEditingCourse({
                      ...editingCourse,
                      courseName: e.target.value
                    })
                  }
                  required
                />
              </div>

              <div className="form-field">
                <label>Duration</label>
                <input
                  value={editingCourse.duration || ""}
                  onChange={e =>
                    setEditingCourse({
                      ...editingCourse,
                      duration: e.target.value
                    })
                  }
                />
              </div>

            </div>

            <div className="form-field">
              <label>Description</label>
              <textarea
                value={editingCourse.description || ""}
                onChange={e =>
                  setEditingCourse({
                    ...editingCourse,
                    description: e.target.value
                  })
                }
                rows="2"
              />
            </div>

            <div className="admin-actions">
              <button className="primary" type="submit">
                Save Changes
              </button>
              <button
                className="secondary"
                type="button"
                onClick={() => setEditingCourse(null)}
              >
                Cancel
              </button>
            </div>

          </form>

        </section>

      )}


      {/* =================================================
          SELECTED COURSE MANAGEMENT
      ================================================= */}

      {selectedCourse && (

        <section className="card" ref={manageRef}>

          <div className="dash-panel-head">
            <h3>
              {selectedCourse.courseCode || ""}{" "}
              {selectedCourse.courseName || ""}
            </h3>

          </div>

          {/* ---------- enrolled students ---------- */}

          <h4 className="admin-section-title">
            👥 Enrolled Students
          </h4>

          {students.length === 0 ? (

            <Empty text="No students enrolled in this course." />

          ) : (

            <div className="data-table-wrap">

              <table className="data-table">

                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                  </tr>
                </thead>

                <tbody>

                  {students.map(student => (
                    <tr key={student.id}>
                      <td>{student.name}</td>
                      <td>{student.email}</td>
                      <td>{student.phone || "—"}</td>
                    </tr>
                  ))}

                </tbody>

              </table>

            </div>

          )}


          {/* ---------- subjects ---------- */}

          <h4 className="admin-section-title">
            📚 Subjects
          </h4>

          <form
            className="admin-form"
            onSubmit={editingSubject
              ? updateSubject
              : createSubject}
          >

            <div className="form-grid">

              <div className="form-field">
                <label>Subject Name</label>
                <input
                  value={editingSubject
                    ? editingSubject.subjectName
                    : subjectForm.subjectName}
                  onChange={e => {
                    if (editingSubject) {
                      setEditingSubject({
                        ...editingSubject,
                        subjectName: e.target.value
                      });
                    } else {
                      setSubjectForm({
                        ...subjectForm,
                        subjectName: e.target.value
                      });
                    }
                  }}
                  placeholder="e.g. Java Programming"
                  required
                />
              </div>

              <div className="form-field">
                <label>Subject Code</label>
                <input
                  value={editingSubject
                    ? editingSubject.subjectCode || ""
                    : subjectForm.subjectCode}
                  onChange={e => {
                    if (editingSubject) {
                      setEditingSubject({
                        ...editingSubject,
                        subjectCode: e.target.value
                      });
                    } else {
                      setSubjectForm({
                        ...subjectForm,
                        subjectCode: e.target.value
                      });
                    }
                  }}
                  placeholder="e.g. BCA-3-1"
                />
              </div>

              <div className="form-field">
                <label>Description</label>
                <input
                  value={editingSubject
                    ? editingSubject.description || ""
                    : subjectForm.description}
                  onChange={e => {
                    if (editingSubject) {
                      setEditingSubject({
                        ...editingSubject,
                        description: e.target.value
                      });
                    } else {
                      setSubjectForm({
                        ...subjectForm,
                        description: e.target.value
                      });
                    }
                  }}
                  placeholder="Short description"
                />
              </div>

            </div>

            <div className="admin-actions">

              <button className="primary" type="submit">
                {editingSubject
                  ? "Save Subject"
                  : "+ Add Subject"}
              </button>

              {editingSubject && (
                <button
                  className="secondary"
                  type="button"
                  onClick={() =>
                    setEditingSubject(null)
                  }
                >
                  Cancel
                </button>
              )}

            </div>

          </form>          {subjects.length === 0 ? (

            <Empty text="No subjects added to this course yet." />

          ) : (

            <div className="subject-chip-list">

              {subjects.map(subject => (

                <div
                  className={
                    `subject-chip ${
                      Number(selectedSubjectId) ===
                      Number(subject.id)
                        ? "active"
                        : ""
                    }`
                  }
                  key={subject.id}
                >

                  <button
                    type="button"
                    className="subject-chip-main"
                    onClick={() =>
                      selectSubject(subject.id)
                    }
                    title="Manage lessons"
                  >
                    <strong>{subject.subjectName}</strong>
                    <small>
                      {subject.subjectCode || ""}
                      {" • "}
                      {subject.lessons?.length || 0} lessons
                    </small>
                  </button>

                  <button
                    className="chip-action"
                    onClick={() =>
                      setEditingSubject({
                        ...subject
                      })
                    }
                    title="Edit subject"
                  >
                    ✏️
                  </button>

                  <button
                    className="chip-action danger"
                    onClick={() =>
                      deleteSubject(subject)
                    }
                    title="Delete subject"
                  >
                    🗑️
                  </button>

                </div>

              ))}

            </div>

          )}


          {/* ---------- lessons of selected subject ---------- */}

          {selectedSubject && (

            <div className="lessons-admin">

              <h4 className="admin-section-title">
                📖 Lessons — {selectedSubject.subjectName}
              </h4>

              <form
                className="admin-form"
                onSubmit={editingLesson
                  ? updateLesson
                  : createLesson}
              >

                <div className="form-grid">

                  <div className="form-field">
                    <label>Lesson Title</label>
                    <input
                      value={editingLesson
                        ? editingLesson.title
                        : lessonForm.title}
                      onChange={e => {
                        if (editingLesson) {
                          setEditingLesson({
                            ...editingLesson,
                            title: e.target.value
                          });
                        } else {
                          setLessonForm({
                            ...lessonForm,
                            title: e.target.value
                          });
                        }
                      }}
                      placeholder="e.g. Introduction to Java"
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label>Duration (minutes)</label>
                    <input
                      type="number"
                      min="1"
                      value={editingLesson
                        ? editingLesson.durationMinutes
                        : lessonForm.durationMinutes}
                      onChange={e => {
                        if (editingLesson) {
                          setEditingLesson({
                            ...editingLesson,
                            durationMinutes: e.target.value
                          });
                        } else {
                          setLessonForm({
                            ...lessonForm,
                            durationMinutes: e.target.value
                          });
                        }
                      }}
                    />
                  </div>

                </div>

                <div className="form-field">
                  <label>Description</label>
                  <input
                    value={editingLesson
                      ? editingLesson.description || ""
                      : lessonForm.description}
                    onChange={e => {
                      if (editingLesson) {
                        setEditingLesson({
                          ...editingLesson,
                          description: e.target.value
                        });
                      } else {
                        setLessonForm({
                          ...lessonForm,
                          description: e.target.value
                        });
                      }
                    }}
                    placeholder="Short description"
                  />
                </div>

                <div className="form-field">
                  <label>Content</label>
                  <textarea
                    value={editingLesson
                      ? editingLesson.content || ""
                      : lessonForm.content}
                    onChange={e => {
                      if (editingLesson) {
                        setEditingLesson({
                          ...editingLesson,
                          content: e.target.value
                        });
                      } else {
                        setLessonForm({
                          ...lessonForm,
                          content: e.target.value
                        });
                      }
                    }}
                    rows="4"
                    placeholder="Lesson content (one paragraph per line)"
                  />
                </div>

                <div className="admin-actions">

                  <button className="primary" type="submit">
                    {editingLesson
                      ? "Save Lesson"
                      : "+ Add Lesson"}
                  </button>

                  {editingLesson && (
                    <button
                      className="secondary"
                      type="button"
                      onClick={() =>
                        setEditingLesson(null)
                      }
                    >
                      Cancel
                    </button>
                  )}

                </div>

              </form>


              {lessons.length === 0 ? (

                <Empty text="No lessons in this subject yet." />

              ) : (

                <div className="data-table-wrap">

                  <table className="data-table">

                    <thead>
                      <tr>
                        <th>Order</th>
                        <th>Title</th>
                        <th>Duration</th>
                        <th>Actions</th>
                      </tr>
                    </thead>

                    <tbody>

                      {lessons.map(lesson => (
                        <tr key={lesson.id}>
                          <td>{lesson.lessonOrder}</td>
                          <td>{lesson.title}</td>
                          <td>{lesson.durationMinutes || 0} min</td>
                          <td>

                            <button
                              className="secondary small"
                              onClick={() =>
                                setEditingLesson({
                                  ...lesson
                                })
                              }
                            >
                              Edit
                            </button>

                            <button
                              className="danger small"
                              onClick={() =>
                                deleteLesson(lesson)
                              }
                            >
                              Delete
                            </button>

                          </td>
                        </tr>
                      ))}

                    </tbody>

                  </table>

                </div>

              )}

            </div>

          )}

        </section>

      )}

    </Page>
  );
}

export default AdminCourseManagement;
