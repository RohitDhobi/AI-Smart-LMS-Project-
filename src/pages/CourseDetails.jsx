import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { Loading, Empty, Page } from "../ui";

function CourseDetails() {

  const { id } =
    useParams();

  const navigate =
    useNavigate();

  const [course, setCourse] =
    useState(null);

  const [enrolled, setEnrolled] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [enrolling, setEnrolling] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");


  useEffect(() => {

    async function load() {

      try {

        setLoading(true);
        setError("");

        const courseData =
          await api.course(id);

        setCourse(courseData);

        const enrollments =
          await api.myEnrollments();

        const found =
          Array.isArray(enrollments) &&
          enrollments.some(
            item =>
              Number(
                item.course?.id ||
                item.courseId
              ) === Number(id)
          );

        setEnrolled(found);

      } catch (e) {

        setError(
          e.message ||
          "Unable to load course."
        );

      } finally {

        setLoading(false);

      }
    }

    load();

  }, [id]);


  async function handleEnroll() {

    if (enrolled) {

      navigate(
        `/courses/${id}/learn`
      );

      return;
    }

    try {

      setEnrolling(true);
      setMessage("");
      setError("");

      await api.enroll(id);

      setEnrolled(true);

      setMessage(
        "You have successfully enrolled in this course!"
      );

    } catch (e) {

      setError(
        e.message ||
        "Unable to enroll in this course."
      );

    } finally {

      setEnrolling(false);

    }
  }


  if (loading) {
    return <Loading />;
  }


  if (error && !course) {

    return (
      <Page
        title="Course"
        subtitle=""
      >

        <div className="error">
          {error}
        </div>

        <button
          className="primary"
          onClick={() =>
            navigate("/courses")
          }
        >
          ← Back to Courses
        </button>

      </Page>
    );
  }


  if (!course) {

    return (
      <Empty
        text="Course not found."
      />
    );
  }


  return (

    <Page
      title={course.title}
      subtitle={course.category || "Course"}
    >

      <section className="card course-details">

        <div className="course-icon big">
          📘
        </div>

        <h2>
          {course.title}
        </h2>

        <p>
          {course.description ||
            "No course description available."}
        </p>


        <div className="course-info">

          <div>
            <b>Category</b>
            <span>
              {course.category ||
                "General"}
            </span>
          </div>

          <div>
            <b>Difficulty</b>
            <span>
              {course.difficulty ||
                "Beginner"}
            </span>
          </div>

          <div>
            <b>Instructor</b>
            <span>
              {course.instructor ||
                "Instructor"}
            </span>
          </div>

          <div>
            <b>Price</b>
            <span>
              {course.price != null
                ? `₹${course.price}`
                : "Free"}
            </span>
          </div>

        </div>


        {message && (
          <div className="notice">
            {message}
          </div>
        )}


        {error && (
          <div className="error">
            {error}
          </div>
        )}


        {enrolled ? (

          <div>

            <button
              className="primary"
              onClick={() =>
                navigate(
                  `/courses/${id}/learn`
                )
              }
            >
              ▶ Start Learning
            </button>

            <p>
              You are already enrolled in this
              course. Continue learning from
              where you left off.
            </p>

          </div>

        ) : (

          <button
            className="primary"
            onClick={handleEnroll}
            disabled={enrolling}
          >
            {enrolling
              ? "Enrolling..."
              : "🎓 Enroll Now"}
          </button>

        )}


        <button
          className="secondary"
          onClick={() =>
            navigate("/courses")
          }
        >
          ← Back to Courses
        </button>

      </section>

    </Page>
  );
}


// =====================================================
// STUDENT LEARNING PAGE
// =====================================================


export default CourseDetails;
