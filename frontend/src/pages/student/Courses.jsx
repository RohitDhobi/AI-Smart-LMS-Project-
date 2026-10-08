import React, { useEffect, useRef, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { api } from "../../services/api";
import { Loading, Empty } from "../../components/ui";
import { highlightSegments } from "../../store/highlight";
import {
  enrolledCourseIds,
  resolveEnrolledCourses,
  enrollmentCourseId,
} from "../../store/enrollment";

function Highlighted({ text, keyword }) {

  if (!keyword || !keyword.trim()) {
    return text;
  }

  return highlightSegments(text, keyword).map((segment, index) =>
    segment.match
      ? (
          <mark
            key={index}
            className="search-highlight"
          >
            {segment.text}
          </mark>
        )
      : (
          <span key={index}>
            {segment.text}
          </span>
        )
  );
}

function CourseCard({
  course,
  tint,
  enrolled = false,
  keyword = "",
  onEnroll = null,
  enrolling = false,
  onLeave = null,
  leaving = false,
}) {
  return (
    <Link
      to={`/courses/${course.id}`}
      className={`card course-card tint-${tint}`}
    >
      <div className="course-card-top">

        <div className="course-icon">
          📘
        </div>

        {enrolled ? (
          <span className="course-enrolled-chip">
            ✓ Enrolled
          </span>
        ) : (
          <span className="course-price">
            {course.price != null
              ? `₹${course.price}`
              : "Free"}
          </span>
        )}

      </div>

      <h2>
        <Highlighted
          text={course.title || "Enrolled Course"}
          keyword={keyword}
        />
      </h2>

      <p>
        <Highlighted
          text={course.description ||
            "No description available."}
          keyword={keyword}
        />
      </p>

      <div className="course-meta">

        <span>
          {course.category || "General"}
        </span>

        <span>
          {course.difficulty || "Beginner"}
        </span>

        {course.totalSemesters != null &&
          course.totalSemesters > 0 && (
            <span className="semester-badge">
              {course.totalSemesters} Sem
            </span>
        )}

      </div>

      {course.duration && (
        <span className="course-duration">
          ⏱ {course.duration}
        </span>
      )}

      <div className="course-card-footer">

        <span className="course-instructor">
          👨‍🏫 {course.instructor || "Instructor"}
        </span>

        {enrolled ? (
          <span className="course-view">
            Continue →
          </span>
        ) : onEnroll ? (
          <span
            role="button"
            tabIndex={0}
            className={
              enrolling
                ? "course-enroll-btn is-loading"
                : "course-enroll-btn"
            }
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              if (!enrolling) onEnroll(course);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !enrolling) {
                event.preventDefault();
                onEnroll(course);
              }
            }}
          >
            {enrolling ? "Enrolling..." : "🎓 Enroll"}
          </span>
        ) : (
          <span className="course-view">
            View →
          </span>
        )}

      </div>

      {enrolled && onLeave && (
        <span
          role="button"
          tabIndex={0}
          className={
            leaving
              ? "course-leave-btn is-loading"
              : "course-leave-btn"
          }
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            if (!leaving) onLeave(course);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !leaving) {
              event.preventDefault();
              onLeave(course);
            }
          }}
        >
          {leaving ? "Leaving..." : "✕ Leave course"}
        </span>
      )}

    </Link>
  );
}

function Courses() {

  const [courses, setCourses] =
    useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [semesterFilter, setSemesterFilter] =
    useState(null);

  // Guard against stale responses

  const searchReqRef = useRef(0);

  // Debounce

  const searchTimerRef = useRef(null);

  // Rows from GET /enrollments/my - null until the first response arrives.
  const [enrollments, setEnrollments] = useState(null);

  // Quick "Enroll" / "Leave" actions on the course cards.
  const [enrollingId, setEnrollingId] = useState(null);
  const [leavingId, setLeavingId] = useState(null);

  useEffect(() => {

    loadCourses();

  }, []);

  // Enrolments power the "My Enrolled Courses" section. A failure here must
  // never break the catalogue, so it degrades to an empty list instead.
  useEffect(() => {

    let cancelled = false;

    api.myEnrollments()
      .then(rows => {
        if (!cancelled) {
          setEnrollments(Array.isArray(rows) ? rows : []);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setEnrollments([]);
        }
      });

    return () => {
      cancelled = true;
    };

  }, []);

  useEffect(() => {

    return () => {

      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }

    };

  }, []);

  async function loadCourses(silent = false) {

    const reqId =
      ++searchReqRef.current;

    try {

      if (!silent) {
        setLoading(true);
      }

      setError("");

      const result =
        await api.courses();

      if (reqId !==
          searchReqRef.current) {
        return;
      }

      setCourses(
        Array.isArray(result)
          ? result
          : []
      );

    } catch (e) {

      if (reqId !==
          searchReqRef.current) {
        return;
      }

      setError(
        e.message ||
        "Unable to load courses."
      );

    } finally {

      if (reqId ===
          searchReqRef.current &&
          !silent) {
        setLoading(false);
      }

    }
  }

  function handleSearch(event) {

    const value =
      event.target.value;

    setSearch(value);

    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    if (!value.trim()) {

      loadCourses(true);
      return;
    }

    setError("");

    searchTimerRef.current =
      setTimeout(() => {
        runSearch(value);
      }, 300);
  }

  async function runSearch(value) {

    const reqId =
      ++searchReqRef.current;

    try {

      const result =
        await api.searchCourses(value);

      if (reqId !==
          searchReqRef.current) {
        return;
      }

      setCourses(
        Array.isArray(result)
          ? result
          : []
      );

    } catch (e) {

      if (reqId !==
          searchReqRef.current) {
        return;
      }

      setError(
        e.message ||
        "Search failed."
      );
    }
  }

  // =====================================================
  // SEMESTER FILTERING
  // =====================================================

  // Discover all unique semester counts across courses
  const semesterOptions = useMemo(() => {
    const counts = new Set();
    courses.forEach(c => {
      if (c.totalSemesters && c.totalSemesters > 0) {
        counts.add(c.totalSemesters);
      }
    });
    return Array.from(counts).sort((a, b) => a - b);
  }, [courses]);

  // Filtered courses based on semester selection
  const filteredCourses = useMemo(() => {
    if (semesterFilter === null) {
      return courses;
    }
    return courses.filter(c => c.totalSemesters === semesterFilter);
  }, [courses, semesterFilter]);

  // =====================================================
  // ENROLLED COURSES (student's "assigned" list)
  // =====================================================

  // Always shown in full - search and semester filters only affect the
  // catalogue grid below.
  const enrolledCourses = useMemo(
    () => resolveEnrolledCourses(enrollments, courses),
    [enrollments, courses]
  );

  const enrolledIds = useMemo(
    () => enrolledCourseIds(enrollments),
    [enrollments]
  );

  // Catalogue rows the student can still enrol in (already-enrolled ones
  // live in their own section above, so they are not listed twice).
  const browseCourses = useMemo(
    () => filteredCourses.filter(c => !enrolledIds.has(Number(c.id))),
    [filteredCourses, enrolledIds]
  );

  // Quick-enroll straight from the browse grid: the new row is appended to
  // the local enrolments state, so the card flips to "✓ Enrolled" and moves
  // into "My Enrolled Courses" without a refetch.
  async function handleQuickEnroll(course) {

    if (enrollingId !== null) return;

    setEnrollingId(Number(course.id));
    setError("");

    try {

      const row = await api.enroll(course.id);

      setEnrollments(prev => {
        const base = Array.isArray(prev) ? prev : [];
        return [
          ...base,
          row && typeof row === "object" ? row : { course },
        ];
      });

    } catch (e) {

      setError(
        e.message ||
        "Unable to enroll in this course."
      );

    } finally {

      setEnrollingId(null);

    }
  }

  // Leave a course from "My Enrolled Courses": drops the row locally once
  // the backend confirms, so the card returns to the browse grid.
  async function handleLeave(course) {

    if (leavingId !== null) return;

    const courseId = Number(course.id);

    setLeavingId(courseId);
    setError("");

    try {

      await api.unenroll(courseId);

      setEnrollments(prev =>
        (Array.isArray(prev) ? prev : [])
          .filter(row => enrollmentCourseId(row) !== courseId)
      );

    } catch (e) {

      setError(
        e.message ||
        "Unable to leave this course."
      );

    } finally {

      setLeavingId(null);

    }
  }

  if (loading || enrollments === null) {
    return <Loading />;
  }

  const cardTints = [
    "blue",
    "orange",
    "purple",
    "green"
  ];

  return (

    <div className="page courses-page">

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      {/* hero banner with search */}

      <div className="courses-hero">

        <div className="courses-hero-text">

          <h2>Explore Courses</h2>

          <p>
            Find a course, start learning, and
            track your progress.
          </p>

        </div>

        <div className="dash-search hero-search">

          <span>🔍</span>

          <input
            value={search}
            onChange={handleSearch}
            placeholder="Search courses..."
          />

        </div>

      </div>

      {/* my enrolled courses - always visible, mirroring the instructor's
          "Assigned Subjects" view */}

      <div className="courses-enrolled-section">

        <div className="courses-heading-row">

          <h3>🎓 My Enrolled Courses</h3>

          <span>
            {enrolledCourses.length} enrolled
          </span>

        </div>

        {enrolledCourses.length === 0 ? (

          <Empty
            text={
              "You haven't enrolled in any course yet. " +
              "Open a course below and click Enroll to get started."
            }
          />

        ) : (

          <div className="courses-grid">

            {enrolledCourses.map((course, index) => (

              <CourseCard
                key={course.id}
                course={course}
                tint={cardTints[index % cardTints.length]}
                enrolled
                onLeave={handleLeave}
                leaving={leavingId === Number(course.id)}
              />

            ))}

          </div>

        )}

      </div>

      {/* semester filter tabs */}

      {semesterOptions.length > 0 && (

        <div className="semester-filter-row">

          <span className="semester-filter-label">
            📚 Filter by semesters:
          </span>

          <div className="semester-filter-tabs">

            <button
              className={
                semesterFilter === null
                  ? "semester-tab active"
                  : "semester-tab"
              }
              onClick={() => setSemesterFilter(null)}
            >
              All
            </button>

            {semesterOptions.map(count => (
              <button
                key={count}
                className={
                  semesterFilter === count
                    ? "semester-tab active"
                    : "semester-tab"
                }
                onClick={() => setSemesterFilter(count)}
              >
                {count} Semesters
              </button>
            ))}

          </div>

        </div>
      )}

      <div className="courses-heading-row">

        <h3>
          {semesterFilter !== null
            ? `${semesterFilter}-Semester Courses`
            : "All Courses"}
        </h3>

        <span>
          {browseCourses.length} available
        </span>

      </div>

      {browseCourses.length === 0 ? (

        <Empty
          text={
            filteredCourses.length === 0
              ? semesterFilter !== null
                ? `No ${semesterFilter}-semester courses found.`
                : "No courses found."
              : search.trim()
                ? "No other courses match your search."
                : "You're enrolled in every available course. 🎉"
          }
        />

      ) : (

        <div className="courses-grid">

          {browseCourses.map((course, index) => (

            <CourseCard
              key={course.id}
              course={course}
              tint={cardTints[index % cardTints.length]}
              keyword={search}
              onEnroll={handleQuickEnroll}
              enrolling={enrollingId === Number(course.id)}
            />

          ))}

        </div>

      )}

    </div>
  );
}


// =====================================================
// QUIZZES
// =====================================================


export default Courses;
