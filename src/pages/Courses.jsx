import React, { useEffect, useRef, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { Loading, Empty } from "../ui";
import { highlightSegments } from "../highlight";
import { enrolledCourseIds, resolveEnrolledCourses } from "../enrollment";

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

function CourseCard({ course, tint, enrolled = false, keyword = "" }) {
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

        <span className="course-view">
          {enrolled ? "Continue →" : "View →"}
        </span>

      </div>

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
