import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";

function Register() {

  const navigate = useNavigate();

  // ---------- form fields ----------

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [courseId, setCourseId] = useState("");

  // ---------- dynamic data ----------

  const [courses, setCourses] = useState([]);
  const [previewSubjects, setPreviewSubjects] = useState([]);
  const [previewLoading, setPreviewLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ---------- load degree courses ----------

  useEffect(() => {

    let cancelled = false;

    api.courses()
      .then(list => {

        if (cancelled) return;

        const degreeCourses =
          (Array.isArray(list) ? list : [])
            .filter(c =>
              c.courseCode ||
              (c.totalSemesters != null && c.totalSemesters > 0)
            );

        setCourses(degreeCourses);

      })
      .catch(() => {
        // course list unavailable - user can retry on submit
      });

    return () => {
      cancelled = true;
    };

  }, []);

  const selectedCourse =
    courses.find(c =>
      Number(c.id) === Number(courseId)
    ) || null;

  // ---------- subject preview for the selected course (all semesters) ----------

  useEffect(() => {

    let cancelled = false;

    if (!courseId) {
      setPreviewSubjects([]);
      return;
    }

    setPreviewLoading(true);

    api.courseSubjects(courseId)
      .then(list => {

        if (!cancelled) {
          setPreviewSubjects(
            Array.isArray(list) ? list : []
          );
        }

      })
      .catch(() => {
        if (!cancelled) {
          setPreviewSubjects([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setPreviewLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };

  }, [courseId]);



  // ---------- submit ----------

  async function handleRegister(event) {

    event.preventDefault();

    if (password !== confirmPassword) {

      setError(
        "Password and confirm password do not match."
      );
      return;
    }

    try {

      setLoading(true);
      setError("");
      setSuccess("");

      const response =
        await api.register({
          name,
          email,
          password,
          confirmPassword,
          phone,
          dateOfBirth: dateOfBirth || null,
          gender,
          courseId: Number(courseId)
        });

      if (response?.token) {

        localStorage.setItem("token", response.token);

        const user =
          response.user || {
            name,
            email
          };

        localStorage.setItem(
          "user",
          JSON.stringify(user)
        );

        // Redirect admin/teacher users to their own dashboards
        const userRole = response?.user?.role || response?.role || user?.role;
        if (userRole === "ADMIN") {
          navigate("/admin");
        } else if (userRole === "INSTRUCTOR") {
          navigate("/instructor");
        } else {
          navigate("/dashboard");
        }

      } else {

        setSuccess(
          "Registration successful. Please login."
        );

        setTimeout(() => {
          navigate("/login");
        }, 1000);
      }

    } catch (e) {

      setError(
        e.message ||
        "Registration failed."
      );

    } finally {

      setLoading(false);

    }
  }

  return (
    <div className="auth-page">

      <div className="auth-card auth-card-wide">

        <div className="auth-logo">
          🤖
        </div>

        <h1>Create Account</h1>

        <p>
          Join AI Smart LMS
        </p>


        {error && (
          <div className="error">
            {error}
          </div>
        )}


        {success && (
          <div className="notice">
            {success}
          </div>
        )}


        <form onSubmit={handleRegister}>

          <div className="form-grid">

            <div className="form-field">
              <label>Full Name</label>
              <input
                value={name}
                onChange={e =>
                  setName(e.target.value)
                }
                placeholder="Enter your full name"
                required
              />
            </div>

            <div className="form-field">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={e =>
                  setEmail(e.target.value)
                }
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="form-field">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={e =>
                  setPassword(e.target.value)
                }
                placeholder="Create password"
                minLength="6"
                required
              />
            </div>

            <div className="form-field">
              <label>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e =>
                  setConfirmPassword(e.target.value)
                }
                placeholder="Confirm your password"
                required
              />
            </div>

            <div className="form-field">
              <label>Phone Number</label>
              <input
                value={phone}
                onChange={e =>
                  setPhone(e.target.value)
                }
                placeholder="Enter your phone number"
              />
            </div>

            <div className="form-field">
              <label>Date of Birth</label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={e =>
                  setDateOfBirth(e.target.value)
                }
              />
            </div>

            <div className="form-field">
              <label>Gender</label>
              <select
                value={gender}
                onChange={e =>
                  setGender(e.target.value)
                }
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-field">
              <label>Course</label>
              <select
                value={courseId}
                onChange={e => {
                  setCourseId(e.target.value);
                  setPreviewSubjects([]);
                }}
                required
              >
                <option value="">
                  Select Course
                </option>

                {courses.map(course => (
                  <option
                    key={course.id}
                    value={course.id}
                  >
                    {course.courseCode || course.title}
                    {" – "}
                    {course.courseName || course.title}
                  </option>
                ))}

              </select>
            </div>

          </div>


          {courseId && (
            <div className="register-preview">

              <h3>Your Subjects</h3>

              {previewLoading ? (
                <p className="preview-hint">
                  Loading subjects...
                </p>
              ) : previewSubjects.length === 0 ? (
                <p className="preview-hint">
                  No subjects added for{" "}
                  {selectedCourse?.courseCode || "this course"}
                  {" "}yet.
                </p>
              ) : (
                <ul className="preview-list">
                  {previewSubjects.map(subject => (
                    <li key={subject.id}>
                      <span className="preview-check">✓</span>
                      {subject.subjectName}
                    </li>
                  ))}
                </ul>
              )}

            </div>
          )}


          <button
            className="primary full-width"
            disabled={loading}
          >
            {loading
              ? "Creating account..."
              : "Register"}
          </button>

        </form>


        <p className="auth-switch">

          Already have an account?{" "}

          <Link to="/login">
            Login
          </Link>

        </p>

      </div>

    </div>
  );
}


// =====================================================
// DASHBOARD
// =====================================================


export default Register;
