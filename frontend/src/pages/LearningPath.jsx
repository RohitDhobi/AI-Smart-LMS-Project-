import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { Loading, Empty, Page } from "../ui";

function LearningPath() {

  const [path, setPath] =
    useState([]);

  const [recommendations, setRecommendations] =
    useState([]);

  const [weakTopics, setWeakTopics] =
    useState([]);

  const [quizRecs, setQuizRecs] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    load();
  }, []);

  async function safeGet(fn) {
    try {
      return await fn();
    } catch {
      return [];
    }
  }

  async function load() {

    try {

      setLoading(true);
      setError("");

      const [p, r, w, q] =
        await Promise.all([
          safeGet(api.learningPath),
          safeGet(api.recommendations),
          safeGet(api.weakTopics),
          safeGet(api.quizRecommendations)
        ]);

      setPath(
        Array.isArray(p)
          ? p
          : []
      );

      setRecommendations(
        Array.isArray(r)
          ? r
          : []
      );

      setWeakTopics(
        Array.isArray(w)
          ? w
          : []
      );

      setQuizRecs(
        Array.isArray(q)
          ? q
          : []
      );

    } catch (e) {

      setError(
        e.message ||
        "Unable to load your learning path."
      );

    } finally {

      setLoading(false);

    }
  }

  if (loading) {
    return <Loading />;
  }

  return (
    <Page
      title="My Learning Path"
      subtitle="A personalized roadmap built from your progress, quiz scores, and AI recommendations."
    >

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      {/* =============================================
          PATH STEPS
      ============================================= */}

      <section className="card">

        <h2>🧭 Your Roadmap</h2>

        {path.length === 0 ? (

          <Empty
            text="No courses available yet."
          />

        ) : (

          <div className="path-steps">

            {path.map((step, index) => {

              const done =
                step.status ===
                "COMPLETED";

              return (

                <div
                  className={
                    done
                      ? "path-step done"
                      : "path-step"
                  }
                  key={`${step.courseId}-${index}`}
                >

                  <div className="path-step-node">
                    {done
                      ? "✓"
                      : index + 1}
                  </div>

                  <div className="path-step-body">

                    <strong>
                      {step.title ||
                        `Course ${step.courseId}`}
                    </strong>

                    <span>
                      {done
                        ? "Completed"
                        : "Recommended next"}
                    </span>

                  </div>

                  {!done && (
                    <Link
                      className="primary small-link"
                      to={`/courses/${step.courseId}`}
                    >
                      Start
                    </Link>
                  )}

                </div>
              );
            })}

          </div>

        )}

      </section>

      {/* =============================================
          RECOMMENDED COURSES
      ============================================= */}

      <section className="card">

        <h2>✨ Recommended for You</h2>

        <p className="section-note">
          Based on your interests and
          quiz performance.
        </p>

        {recommendations.length === 0 ? (

          <Empty
            text="No recommendations yet — enroll in more courses."
          />

        ) : (

          <div className="courses-grid">

            {recommendations.map(course => (

              <Link
                key={course.id}
                to={`/courses/${course.id}`}
                className="card course-card"
              >

                <div className="course-icon">
                  📘
                </div>

                <h2>
                  {course.title}
                </h2>

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

                <strong>
                  {course.price != null
                    ? `₹${course.price}`
                    : "Free"}
                </strong>

              </Link>

            ))}

          </div>

        )}

      </section>

      <div className="two-col-grid">

        {/* =============================================
            WEAK TOPICS
        ============================================= */}

        <section className="card">

          <h2>🎯 Focus on Weak Topics</h2>

          {weakTopics.length === 0 ? (

            <Empty
              text="No weak topics — great job!"
            />

          ) : (

            <div className="weak-list">

              {weakTopics.map((topic, i) => (

                <div
                  className="weak-item"
                  key={i}
                >

                  <div className="weak-item-head">

                    <strong>
                      {topic.topic}
                    </strong>

                    <span>
                      {Math.round(
                        Number(topic.score) || 0
                      )}%
                    </span>

                  </div>

                  <div className="progress score-bar">
                    <span
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(
                            0,
                            Number(topic.score) || 0
                          )
                        )}%`
                      }}
                    />
                  </div>

                  <p>
                    {topic.recommendation ||
                      "Review this topic and retry the quiz."}
                  </p>

                </div>

              ))}

            </div>

          )}

        </section>

        {/* =============================================
            QUIZ RECOMMENDATIONS
        ============================================= */}

        <section className="card">

          <h2>📝 Quiz Practice</h2>

          {quizRecs.length === 0 ? (

            <Empty
              text="No quiz suggestions right now."
            />

          ) : (

            <div className="quiz-recs">

              {quizRecs.map((rec, i) => (

                <div
                  className="quiz-rec"
                  key={i}
                >

                  <strong>
                    {rec.topic}
                  </strong>

                  <span>
                    {rec.reason ||
                      "Low quiz score"}
                  </span>

                  <small>
                    {rec.action ||
                      "Practice again"}
                  </small>

                </div>

              ))}

            </div>

          )}

        </section>

      </div>

    </Page>
  );
}


// =====================================================
// ADMIN DASHBOARD
// =====================================================


export default LearningPath;
