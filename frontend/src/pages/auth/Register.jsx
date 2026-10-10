import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, Presentation, Check } from "lucide-react";
import { api } from "../../services/api";
import { sanitizePhone, phoneError } from "../../utils/phone";

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

  // "student" registers immediately; "instructor" creates an account that
  // waits for admin approval (see api.registerInstructor).
  const [accountType, setAccountType] = useState("student");

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

    const phoneErr = phoneError(phone);

    if (phoneErr) {
      setError(phoneErr);
      return;
    }

    try {

      setLoading(true);
      setError("");
      setSuccess("");

      const payload = {
        name,
        email,
        password,
        confirmPassword,
        phone,
        dateOfBirth: dateOfBirth || null,
        gender,
        courseId: courseId ? Number(courseId) : null,
      };

      // Instructor accounts are created INACTIVE and must be approved by an
      // admin (Admin -> Teachers -> Activate) before they can log in.
      if (accountType === "instructor") {

        await api.registerInstructor(payload);

        setSuccess(
          "Instructor account created. Your account is pending admin approval. " +
          "You can log in at Staff Login once an admin activates it."
        );

        setTimeout(() => {
          navigate("/staff-login");
        }, 2500);

        return;
      }

      const response =
        await api.register(payload);

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

        // Redirect admin/teacher/HOD users to their own dashboards
        const userRole = response?.user?.role || response?.role || user?.role;
        if (userRole === "ADMIN") {
          navigate("/admin");
        } else if (userRole === "INSTRUCTOR") {
          navigate("/instructor");
        } else if (userRole === "HOD") {
          navigate("/hod");
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
    <div className="auth-split auth-split-wide">

      {/* Brand panel: same identity block as the login page. */}
      <aside className="auth-brand">
        <div className="auth-brand-inner">
          <div className="auth-brand-mark">
            <GraduationCap size={30} strokeWidth={1.75} aria-hidden="true" />
          </div>
          <p className="auth-brand-name">AI Smart LMS</p>
          <p className="auth-brand-tagline">Learn Smarter, Grow Faster</p>
        </div>
      </aside>

      {/* Form panel */}
      <main className="auth-main">

        <div className="auth-panel">

          <div className="auth-brand-mobile">
            <span className="auth-brand-mark auth-brand-mark-sm">
              <GraduationCap size={20} strokeWidth={1.75} aria-hidden="true" />
            </span>
            <span className="auth-brand-mobile-name">AI Smart LMS</span>
          </div>

          <h1>Create Account</h1>

          <p className="auth-subtitle">Join AI Smart LMS</p>

          {error && (
            <div className="error" role="alert">
              {error}
            </div>
          )}

          {success && (
            <div className="notice">
              {success}
            </div>
          )}

          <div className="auth-account-toggle" role="tablist" aria-label="Account type">
            <button
              type="button"
              role="tab"
              aria-selected={accountType === "student"}
              className={accountType === "student" ? "active" : ""}
              onClick={() => setAccountType("student")}
            >
              <GraduationCap size={16} strokeWidth={1.75} aria-hidden="true" />
              Student
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={accountType === "instructor"}
              className={accountType === "instructor" ? "active" : ""}
              onClick={() => setAccountType("instructor")}
            >
              <Presentation size={16} strokeWidth={1.75} aria-hidden="true" />
              Instructor
            </button>
          </div>

          {accountType === "instructor" && (
            <p className="auth-hint">
              Instructor accounts are reviewed by an admin. You can log in at
              Staff Login once your account is activated.
            </p>
          )}


          <form onSubmit={handleRegister}>

            <div className="form-grid">

              <div className="form-field">
                <label htmlFor="reg-name">Full Name</label>
                <input
                  id="reg-name"
                  autoComplete="name"
                  value={name}
                  onChange={e =>
                    setName(e.target.value)
                  }
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="reg-email">Email</label>
                <input
                  id="reg-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={e =>
                    setEmail(e.target.value)
                  }
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="reg-password">Password</label>
                <input
                  id="reg-password"
                  type="password"
                  autoComplete="new-password"
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
                <label htmlFor="reg-confirm">Confirm Password</label>
                <input
                  id="reg-confirm"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={e =>
                    setConfirmPassword(e.target.value)
                  }
                  placeholder="Confirm your password"
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="reg-phone">Phone Number</label>
                <input
                  id="reg-phone"
                  autoComplete="tel"
                  value={phone}
                  onChange={e =>
                    setPhone(sanitizePhone(e.target.value))
                  }
                  maxLength={18}
                  inputMode="tel"
                  placeholder="Enter your phone number"
                />
              </div>

              <div className="form-field">
                <label htmlFor="reg-dob">Date of Birth</label>
                <input
                  id="reg-dob"
                  type="date"
                  autoComplete="bday"
                  value={dateOfBirth}
                  onChange={e =>
                    setDateOfBirth(e.target.value)
                  }
                />
              </div>

              <div className="form-field">
                <label htmlFor="reg-gender">Gender</label>
                <select
                  id="reg-gender"
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
                <label htmlFor="reg-course">Course</label>
                <select
                  id="reg-course"
                  value={courseId}
                  onChange={e => {
                    setCourseId(e.target.value);
                    setPreviewSubjects([]);
                  }}
                  required={accountType === "student"}
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
                      {" - "}
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
                        <Check size={14} strokeWidth={2.25} aria-hidden="true" />
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
                : accountType === "instructor"
                  ? "Request Instructor Account"
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

      </main>

    </div>
  );
}


// =====================================================
// REGISTER
// =====================================================


export default Register;
