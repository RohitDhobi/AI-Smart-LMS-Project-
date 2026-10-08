import React, { useEffect, useMemo, useState } from "react";
import { api } from "../../services/api";
import { Loading, Page, getStoredUser } from "../../components/ui";

// =====================================================
// ENROLLMENT MANAGEMENT (shared by the Admin and HOD panels)
// =====================================================
// Admin and HOD both hit role-checked endpoints on the backend
// (GET /enrollments/all, POST /enrollments/manage,
//  DELETE /enrollments/manage/{id}), so one page serves both panels.
// Students are fetched per role: admins get /admin/users (filtered to
// STUDENT rows), HODs get /hod/students.

function AdminEnrollments() {

  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [enrollments, setEnrollments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [pickedStudentId, setPickedStudentId] = useState("");

  async function refresh() {
    const user = getStoredUser();

    const [courseRows, enrollmentRows, userRows] = await Promise.all([
      api.courses(),
      api.allEnrollments(),
      user && user.role === "HOD"
        ? api.hodStudents()
        : api.adminUsers(),
    ]);

    const courseList = Array.isArray(courseRows) ? courseRows : [];

    setCourses(courseList);
    setEnrollments(
      Array.isArray(enrollmentRows) ? enrollmentRows : []
    );

    const studentList = (Array.isArray(userRows) ? userRows : [])
      .filter(row => (row.role || "STUDENT") === "STUDENT");

    setStudents(studentList);

    // Default to the first course so the table is never empty-on-load.
    setSelectedCourseId(prev =>
      prev ||
      (courseList[0] ? String(courseList[0].id) : "")
    );

    return courseList;
  }

  useEffect(() => {

    let cancelled = false;

    setLoading(true);
    setError("");

    refresh()
      .catch(e => {
        if (!cancelled) {
          setError(
            e.message ||
            "Unable to load enrollment data."
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => { cancelled = true; };

  }, []);

  // ----- derived view data -----

  const courseEnrollments = useMemo(
    () =>
      enrollments.filter(row =>
        String(row.course?.id ?? row.courseId) === selectedCourseId
      ),
    [enrollments, selectedCourseId]
  );

  const enrolledStudentIds = useMemo(
    () =>
      new Set(
        courseEnrollments
          .map(row => Number(row.user?.id ?? row.userId))
          .filter(id => Number.isFinite(id))
      ),
    [courseEnrollments]
  );

  // Students that can still be added to the selected course.
  const addableStudents = useMemo(
    () =>
      students.filter(
        student => !enrolledStudentIds.has(Number(student.id))
      ),
    [students, enrolledStudentIds]
  );

  const selectedCourseName = (() => {
    const course = courses.find(
      c => String(c.id) === selectedCourseId
    );
    return course ? (course.title || course.courseName) : "";
  })();

  // ----- actions -----

  async function handleAdd() {

    if (busy || !pickedStudentId || !selectedCourseId) return;

    setBusy(true);
    setError("");
    setNotice("");

    try {

      await api.manageEnroll(pickedStudentId, selectedCourseId);

      setNotice("Student enrolled successfully.");
      setPickedStudentId("");

      await refresh();

    } catch (e) {

      setError(
        e.message ||
        "Unable to enroll the student."
      );

    } finally {

      setBusy(false);

    }
  }

  async function handleRemove(enrollment) {

    if (busy) return;

    setBusy(true);
    setError("");
    setNotice("");

    try {

      await api.manageRemove(enrollment.id);

      setNotice(
        `Removed ${
          enrollment.user?.name ||
          enrollment.user?.email ||
          "student"
        } from this course.`
      );

      await refresh();

    } catch (e) {

      setError(
        e.message ||
        "Unable to remove the enrollment."
      );

    } finally {

      setBusy(false);

    }
  }

  // ----- render -----

  if (loading) {
    return <Loading />;
  }

  return (
    <Page
      title="Enrollment Management"
      subtitle="Enroll students into courses and manage existing enrollments."
    >

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      {notice && (
        <div className="notice">
          {notice}
        </div>
      )}

      {/* course picker + summary */}
      <section className="card">

        <div className="enroll-heading-row">

          <h3>Course</h3>

          <span>
            {enrollments.length} enrollments ·{" "}
            {students.length} students ·{" "}
            {courses.length} courses
          </span>

        </div>

        {courses.length === 0 ? (
          <p>No courses available.</p>
        ) : (
          <select
            value={selectedCourseId}
            onChange={event => {
              setSelectedCourseId(event.target.value);
              setPickedStudentId("");
            }}
          >
            {courses.map(course => (
              <option
                key={course.id}
                value={String(course.id)}
              >
                {course.title || course.courseName}
              </option>
            ))}
          </select>
        )}

      </section>

      {/* add a student */}
      <section className="card">

        <h3>Enroll a student</h3>

        {addableStudents.length === 0 ? (
          <p>
            Every student is already enrolled in
            {selectedCourseName ? ` ${selectedCourseName}` : " this course"}.
          </p>
        ) : (

          <div className="enroll-controls">

            <select
              value={pickedStudentId}
              onChange={event =>
                setPickedStudentId(event.target.value)
              }
            >
              <option value="">
                Choose a student...
              </option>
              {addableStudents.map(student => (
                <option
                  key={student.id}
                  value={String(student.id)}
                >
                  {student.name || student.email}
                  {student.email && student.name
                    ? ` (${student.email})`
                    : ""}
                </option>
              ))}
            </select>

            <button
              className="primary"
              onClick={handleAdd}
              disabled={busy || !pickedStudentId}
            >
              {busy
                ? "Working..."
                : "＋ Enroll student"}
            </button>

          </div>

        )}

      </section>

      {/* enrolled students in the selected course */}
      <section className="card">

        <div className="enroll-heading-row">

          <h3>
            Enrolled in{" "}
            {selectedCourseName || "this course"}
          </h3>

          <span>
            {courseEnrollments.length} students
          </span>

        </div>

        {courseEnrollments.length === 0 ? (
          <p>No students are enrolled yet.</p>
        ) : (

          <table className="data-table">

            <thead>
              <tr>
                <th>Student</th>
                <th>Email</th>
                <th>Enrollment</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {courseEnrollments.map(enrollment => (
                <tr key={enrollment.id}>
                  <td>
                    {enrollment.user?.name || "—"}
                  </td>
                  <td>
                    {enrollment.user?.email || "—"}
                  </td>
                  <td>
                    #{enrollment.id}
                  </td>
                  <td>
                    <button
                      className="secondary"
                      onClick={() => handleRemove(enrollment)}
                      disabled={busy}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>

          </table>

        )}

      </section>

    </Page>
  );
}

export default AdminEnrollments;
