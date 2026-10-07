import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { Loading, Empty, Page } from "../ui";

function InstructorDashboard() {

  const [role, setRole] =
    useState(null);

  const [stats, setStats] =
    useState(null);

  const [courses, setCourses] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {

    loadAll();

  }, []);


  async function loadAll() {

    try {

      setLoading(true);
      setError("");

      const profile =
        await api.profile();

      setRole(profile?.role || null);

      const allowed =
        profile?.role === "INSTRUCTOR" ||
        profile?.role === "ADMIN";

      if (!allowed) {
        setError(
          "Access denied. Instructor role required."
        );
        return;
      }

      const [dash, allCourses] =
        await Promise.all([
          api.instructorDashboard(),
          api.courses()
        ]);

      setStats(dash);

      setCourses(
        (Array.isArray(allCourses)
          ? allCourses
          : [])
          .filter(course =>
            (course.instructor || "")
              .toLowerCase() ===
            (profile?.name || "")
              .toLowerCase()
          )
      );

    } catch (e) {

      setError(
        e.message ||
        "Unable to load instructor dashboard."
      );

    } finally {

      setLoading(false);

    }

  }


  if (loading) {
    return <Loading />;
  }

  const statCards = [
    {
      icon: "📚",
      tint: "blue",
      label: "Courses",
      value: stats?.courses ?? 0
    },
    {
      icon: "🎓",
      tint: "green",
      label: "Students",
      value: stats?.students ?? 0
    },
    {
      icon: "📖",
      tint: "orange",
      label: "Lessons",
      value: stats?.lessons ?? 0
    },
    {
      icon: "✅",
      tint: "purple",
      label: "Approved",
      value: stats?.approvedCourses ?? 0
    },
    {
      icon: "⏳",
      tint: "orange",
      label: "Pending",
      value: stats?.pendingCourses ?? 0
    }
  ];

  return (
    <Page
      title="Instructor Dashboard"
      subtitle="Your courses and their reach."
    >

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      <div className="analytics-stats">

        {statCards.map(stat => (

          <div
            className={`card analytics-stat tint-${stat.tint}`}
            key={stat.label}
          >

            <span className="analytics-stat-icon">
              {stat.icon}
            </span>

            <div className="analytics-stat-text">
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </div>

          </div>

        ))}

      </div>

      <section className="card">

        <div className="dash-panel-head">
          <h3>My Courses</h3>
          <span>{courses.length} total</span>
        </div>

        {courses.length === 0 ? (

          <Empty
            text="No courses found under your name."
          />

        ) : (

          <div className="courses-grid">

            {courses.map(course => (

              <Link
                key={course.id}
                to={`/courses/${course.id}`}
                className={`card course-card tint-blue`}
              >

                <h2>{course.title}</h2>

                <p>
                  {course.description ||
                    "No description available."}
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

                </div>

              </Link>

            ))}

          </div>

        )}

      </section>

    </Page>
  );
}


// =====================================================
// APP ROUTER
// =====================================================


export default InstructorDashboard;
