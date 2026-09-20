import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { awardActivity } from "../gamification";
import { Loading, Page } from "../ui";

function SubjectLearning() {

  const { id } = useParams();
  const navigate = useNavigate();

  const [subject, setSubject] =
    useState(null);

  const [lessons, setLessons] =
    useState([]);

  const [progressList, setProgressList] =
    useState([]);

  const [selectedLesson, setSelectedLesson] =
    useState(null);

  const [quizzes, setQuizzes] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [notice, setNotice] =
    useState("");

  useEffect(() => {
    loadSubject();
  }, [id]);

  async function loadSubject() {

    try {

      setLoading(true);
      setError("");
      setNotice("");

      const data = await api.subject(id);

      setSubject(data);

      const sortedLessons =
        (Array.isArray(data.lessons)
          ? data.lessons
          : [])
          .slice()
          .sort(
            (a, b) =>
              Number(a.lessonOrder || 0) -
              Number(b.lessonOrder || 0)
          );

      setLessons(sortedLessons);

      if (sortedLessons.length > 0) {
        setSelectedLesson(sortedLessons[0]);
      }

      // existing per-lesson progress
      try {

        const myProgress =
          await api.myProgress();

        const subjectLessons =
          (Array.isArray(myProgress)
            ? myProgress
            : [])
            .filter(item =>
              item.lesson?.subject?.id != null &&
              Number(item.lesson.subject.id) ===
                Number(id)
            );

        setProgressList(subjectLessons);

      } catch (e) {
        setProgressList([]);
      }

      // quizzes for the subject's course
      try {

        const quizData =
          await api.quizzesByCourse(
            data.courseId
          );

        setQuizzes(
          Array.isArray(quizData)
            ? quizData
            : []
        );

      } catch (e) {
        setQuizzes([]);
      }

    } catch (e) {

      setError(
        e.message ||
        "Unable to load the subject."
      );

    } finally {

      setLoading(false);

    }
  }

  function lessonProgress(lessonId) {

    return progressList.find(
      item =>
        Number(item.lesson?.id) ===
        Number(lessonId)
    );
  }

  async function openLesson(lesson) {

    setSelectedLesson(lesson);
    setNotice("");
    setError("");

    if (!lessonProgress(lesson.id)) {

      try {

        const started =
          await api.startLesson(lesson.id);

        setProgressList(current => [
          ...current,
          started
        ]);

      } catch (e) {

        setError(
          e.message ||
          "Unable to start the lesson."
        );

      }
    }
  }

  async function markComplete() {

    if (!selectedLesson) {
      return;
    }

    try {

      setSaving(true);
      setError("");

      const updated =
        await api.updateLessonProgress(
          selectedLesson.id,
          100
        );

      setProgressList(current => {

        const exists =
          current.some(
            item =>
              Number(item.lesson?.id) ===
              Number(selectedLesson.id)
          );

        if (exists) {

          return current.map(item =>
            Number(item.lesson?.id) ===
            Number(selectedLesson.id)
              ? updated
              : item
          );
        }

        return [...current, updated];
      });

      setNotice(
        "Lesson completed successfully! 🎉"
      );

      awardActivity({
        type: "lesson",
        xp: 10
      });

      const index = lessons.findIndex(
        lesson =>
          Number(lesson.id) ===
          Number(selectedLesson.id)
      );

      if (
        index >= 0 &&
        index < lessons.length - 1
      ) {

        setTimeout(() => {
          openLesson(lessons[index + 1]);
        }, 500);
      }

    } catch (e) {

      setError(
        e.message ||
        "Unable to update lesson progress."
      );

    } finally {

      setSaving(false);

    }
  }

  if (loading) {
    return <Loading />;
  }

  if (!subject) {

    return (
      <Page title="Subject" subtitle="">
        <div className="error">
          {error || "Subject not found."}
        </div>
        <button
          className="secondary"
          onClick={() => navigate("/dashboard")}
        >
          ← Back to Dashboard
        </button>
      </Page>
    );
  }

  const completedCount =
    lessons.filter(
      lesson =>
        Boolean(
          lessonProgress(lesson.id)?.completed
        )
    ).length;

  const percentage =
    lessons.length > 0
      ? (completedCount / lessons.length) * 100
      : 0;

  const currentProgress =
    selectedLesson
      ? lessonProgress(selectedLesson.id)
      : null;

  return (
    <Page
      title={subject.subjectName}
      subtitle={
        `${subject.courseCode || ""}`
      }
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

      {/* =================================================
          SUBJECT HEADER
      ================================================= */}

      <section className="card learning-header">

        <div>

          <button
            className="back-link"
            onClick={() =>
              navigate(-1)
            }
          >
            ← Back
          </button>

          <h2>
            {subject.subjectName}
          </h2>

          <p>
            {subject.description ||
              `${subject.courseName || ""}`}
          </p>

        </div>

        <div className="learning-progress-box">

          <div className="progress-label">

            <strong>Subject Progress</strong>

            <span>
              {Math.round(percentage)}%
            </span>

          </div>

          <div className="progress large">

            <span
              style={{
                width: `${Math.min(
                  100,
                  Math.max(0, percentage)
                )}%`
              }}
            />

          </div>

          <small>
            {completedCount} of{" "}
            {lessons.length} lessons completed
          </small>

        </div>

      </section>


      {lessons.length === 0 ? (

        <section className="card empty-learning">

          <div className="learning-empty-icon">
            📚
          </div>

          <h3>No lessons added yet</h3>

          <p>
            The administrator has not added
            lessons to this subject yet.
          </p>

        </section>

      ) : (

        <div className="learning-layout">

          {/* =============================================
              LESSON SIDEBAR
          ============================================= */}

          <aside className="card lesson-sidebar">

            <div className="lesson-sidebar-header">

              <h3>Subject Content</h3>

              <span>{lessons.length} lessons</span>

            </div>

            <div className="lesson-list">

              {lessons.map((lesson, index) => {

                const item =
                  lessonProgress(lesson.id);

                const isActive =
                  Number(selectedLesson?.id) ===
                  Number(lesson.id);

                return (

                  <button
                    type="button"
                    key={lesson.id}
                    className={
                      `lesson-item ${
                        isActive ? "active" : ""
                      }`
                    }
                    onClick={() =>
                      openLesson(lesson)
                    }
                  >

                    <span
                      className={
                        `lesson-status ${
                          item?.completed
                            ? "completed"
                            : ""
                        }`
                      }
                    >
                      {item?.completed
                        ? "✓"
                        : index + 1}
                    </span>

                    <span className="lesson-item-text">

                      <strong>
                        {lesson.title}
                      </strong>

                      <small>
                        {lesson.durationMinutes || 0} min
                        {item?.progressPercentage != null
                          ? ` • ${item.progressPercentage}%`
                          : ""}
                      </small>

                    </span>

                  </button>

                );
              })}

            </div>

          </aside>

          {/* =============================================
              MAIN LEARNING AREA
          ============================================= */}

          <main className="learning-main">

            {selectedLesson && (

              <section className="card lesson-viewer">

                <div className="lesson-viewer-top">

                  <div>

                    <span className="eyebrow">
                      Lesson {selectedLesson.lessonOrder || ""}
                    </span>

                    <h2>
                      {selectedLesson.title}
                    </h2>

                    <p className="lesson-description">
                      {selectedLesson.description || ""}
                    </p>

                  </div>

                  <div className="lesson-viewer-progress">

                    {currentProgress?.completed
                      ? "Completed ✓"
                      : `${currentProgress?.progressPercentage || 0}% complete`}

                  </div>

                </div>

                <article className="lesson-content">

                  {(selectedLesson.content ||
                    "No lesson content is available.")
                    .split("\n")
                    .map((paragraph, index) => (
                      <p key={index}>
                        {paragraph}
                      </p>
                    ))}

                </article>

                <div className="lesson-actions">

                  <button
                    className="primary"
                    onClick={markComplete}
                    disabled={
                      saving ||
                      currentProgress?.completed
                    }
                  >
                    {saving
                      ? "Saving..."
                      : currentProgress?.completed
                        ? "✅ Lesson Completed"
                        : "✓ Mark Lesson Complete"}
                  </button>

                </div>

              </section>

            )}

            {/* =============================================
                QUIZZES FOR THE SUBJECT'S COURSE
            ============================================= */}

            {quizzes.length > 0 && (

              <section className="card subject-quizzes">

                <div className="dash-panel-head">
                  <h3>Quizzes & Assessments</h3>
                  <Link
                    to={`/courses/${subject.courseId}/learn`}
                  >
                    Open course →
                  </Link>
                </div>

                {quizzes.map(quiz => (
                  <div
                    className="result-row"
                    key={quiz.id}
                  >
                    <div className="result-info">
                      <span>{quiz.title}</span>
                      <small>
                        {quiz.questions?.length || 0} questions
                      </small>
                    </div>

                    <Link
                      className="secondary small"
                      to={`/courses/${subject.courseId}/learn`}
                    >
                      Take Quiz
                    </Link>

                  </div>
                ))}

              </section>

            )}

          </main>

        </div>

      )}

    </Page>
  );
}

export default SubjectLearning;
