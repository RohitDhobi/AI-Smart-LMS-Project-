import React, { useEffect, useRef, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { Loading, Empty } from "../ui";
import { highlightSegments } from "../highlight";

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

  useEffect(() => {

    loadCourses();

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

  if (loading) {
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
          {filteredCourses.length} available
        </span>

      </div>

      {filteredCourses.length === 0 ? (

        <Empty
          text={
            semesterFilter !== null
              ? `No ${semesterFilter}-semester courses found.`
              : "No courses found."
          }
        />

      ) : (

        <div className="courses-grid">

          {filteredCourses.map((course, index) => {

            const tint =
              cardTints[index % cardTints.length];

            return (

              <Link
                key={course.id}
                to={`/courses/${course.id}`}
                className={`card course-card tint-${tint}`}
              >

                <div className="course-card-top">

                  <div className="course-icon">
                    📘
                  </div>

                  <span className="course-price">
                    {course.price != null
                      ? `₹${course.price}`
                      : "Free"}
                  </span>

                </div>

                <h2>
                  <Highlighted
                    text={course.title}
                    keyword={search}
                  />
                </h2>

                <p>
                  <Highlighted
                    text={course.description ||
                      "No description available."}
                    keyword={search}
                  />
                </p>

                <div className="course-meta">

                  <span>
                    {course.category ||
                      "General"}
                  </span>

                  <span>
                    {course.difficulty ||
                      "Beginner"}
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
                    👨‍🏫 {course.instructor ||
                      "Instructor"}
                  </span>

                  <span className="course-view">
                    View →
                  </span>

                </div>

              </Link>
            );

          })}

        </div>

      )}

    </div>
  );
}


// =====================================================
// QUIZZES
// =====================================================


export default Courses;
