import React, { useEffect, useState } from "react";
import { api } from "../../services/api";
import { getWeeklyActivity } from "../../store/gamification";
import { Loading } from "../../components/ui";

function Analytics() {

  const [data, setData] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {

    async function load() {

      try {

        const result =
          await api.analyticsStudent();

        setData(result);

      } catch (e) {

        console.error(e);

      } finally {

        setLoading(false);

      }
    }

    load();

  }, []);


  // Full weak-topics list — this page is where the dashboard's
  // Weak Topics "View All" link (to="/analytics") lands, so it has to
  // use the SAME source as that card (quiz weak topics, then subjects
  // that are behind on progress) and show every entry, not just the 3
  // the card has room for.
  const [weakTopics, setWeakTopics] =
    useState([]);

  const [subjects, setSubjects] =
    useState([]);

  useEffect(() => {

    api.weakTopics()

      .then(r =>
        setWeakTopics(
          Array.isArray(r) ? r : []
        )
      )

      .catch(() => {});

    api.mySubjects()

      .then(r =>
        setSubjects(
          Array.isArray(r?.subjects) ? r.subjects : []
        )
      )

      .catch(() => {});

  }, []);


  const [weekly, setWeekly] =
    useState(() =>
      getWeeklyActivity()
    );

  useEffect(() => {

    const refresh = () =>
      setWeekly(
        getWeeklyActivity()
      );

    window.addEventListener(
      "lms-gamification-update",
      refresh
    );

    return () =>
      window.removeEventListener(
        "lms-gamification-update",
        refresh
      );

  }, []);

  if (loading) {
    return <Loading />;
  }

  const maxDay = Math.max(
    ...weekly.days.map(d => d.total),
    1
  );

  const avgQuiz =
    Number(
      data?.averageQuizScore || 0
    );

  const quizDonut =
    `conic-gradient(#7c3aed ${avgQuiz * 1.8}deg, #a855f7 ${avgQuiz * 3.6}deg, #e2e8f0 0)`;

  const stats = [
    {
      icon: "📚",
      tint: "blue",
      label: "Courses",
      value:
        data?.totalCourses ||
        data?.enrolledCourses ||
        0,
      suffix: ""
    },
    {
      icon: "✅",
      tint: "green",
      label: "Completed",
      value:
        data?.completedCourses ||
        0,
      suffix: ""
    },
    {
      icon: "🎯",
      tint: "orange",
      label: "Avg Progress",
      value:
        data?.averageCourseProgress ||
        data?.averageProgress ||
        data?.progress ||
        0,
      suffix: "%"
    },
    {
      icon: "🏅",
      tint: "purple",
      label: "Highest Quiz",
      value:
        data?.highestQuizScore ||
        data?.averageQuizScore ||
        0,
      suffix: "%"
    }
  ];

  // Same rules as the dashboard card (Dashboard.jsx): quiz-based weak
  // topics win; if the API has none, fall back to subjects below 80%
  // progress. The card slices that list to 3 — this page shows all.
  const quizWeak = weakTopics.map(w => {

    const score =
      Math.round(
        Number(
          w.score ||
          w.percentage ||
          w.progressPercentage ||
          0
        ) || 0
      );

    return {
      name: w.topic || w.name || w.subjectName || "Topic",
      score,
      priority:
        (Number(w.score || w.percentage || 50) || 0) < 50
          ? "High"
          : "Medium",
      recommendation:
        w.recommendation ||
        "Review this topic and retry the quiz."
    };

  });

  const behindSubjects = subjects

    .filter(s => (s.progressPercentage || 0) < 80)

    .map(s => {

      const score = Math.round(s.progressPercentage || 0);

      return {
        name: s.subjectName || s.name || "Subject",
        score,
        priority: score < 60 ? "High" : "Medium",
        recommendation:
          "Work on this subject — it is still below 80% progress."
      };

    });

  const weakFromQuiz = quizWeak.length > 0;

  const displayWeak = weakFromQuiz ? quizWeak : behindSubjects;

  return (

    <div className="page analytics-page">

      <div className="analytics-hero">

        <div>

          <h2>📊 Analytics</h2>

          <p>
            Track your learning performance
            and weekly activity.
          </p>

        </div>

      </div>

      {/* stat cards */}

      <div className="analytics-stats">

        {stats.map(stat => (

          <div
            className={`card analytics-stat tint-${stat.tint}`}
            key={stat.label}
            role="button"
            tabIndex={0}
            style={{ cursor: 'pointer' }}
          >

            <span className="analytics-stat-icon">
              {stat.icon}
            </span>

            <div className="analytics-stat-text">
              <strong>
                {stat.value}
                {stat.suffix}
              </strong>
              <span>{stat.label}</span>
            </div>

          </div>

        ))}

      </div>

      {/* =============================================
          WEEKLY ACTIVITY + QUIZ SCORE
      ============================================= */}

      <div className="analytics-mid">

      <section className="card activity-card">

        <div className="dash-panel-head">

          <h3>Weekly Activity</h3>

          <p className="section-note">
            Lessons and quizzes over the last 7 days.
          </p>

        </div>

          <div className="activity-summary">

            <span>
              ⚡ {weekly.state.xp || 0} XP
            </span>

            <span>
              🔥 {weekly.state.streak || 0} day streak
            </span>

            <span>
              🍅 {weekly.state.focusMinutes || 0} min focus
            </span>

          </div>

        <div className="activity-chart">

          {weekly.days.map((d, i) => {

            const lessonsH =
              d.lessons
                ? (d.lessons / maxDay) * 100
                : 0;

            const quizH =
              d.quizzes
                ? (d.quizzes / maxDay) * 100
                : 0;

            return (

              <div
                className="activity-col"
                key={i}
              >

                <div className="activity-bars">

                  <div
                    className="activity-bar lesson"
                    style={{
                      height: `${lessonsH}%`
                    }}
                    title={`${d.lessons} lessons`}
                  />

                  <div
                    className="activity-bar quiz"
                    style={{
                      height: `${quizH}%`
                    }}
                    title={`${d.quizzes} quizzes`}
                  />

                </div>

                <span className="activity-day">
                  {d.label}
                </span>

                <small>
                  {d.total || ""}
                </small>

              </div>

            );

          })}

        </div>

        <div className="activity-legend">

          <span>
            <i className="legend-dot lesson"></i>
            Lessons
          </span>

          <span>
            <i className="legend-dot quiz"></i>
            Quizzes
          </span>

        </div>

      </section>

      {/* quiz score donut */}

      <section className="card quiz-score-panel">

        <div className="dash-panel-head">
          <h3>Quiz Performance</h3>
        </div>

        <p className="dash-subhead">
          Average score across your attempts.
        </p>

        <div
          className="donut-wrap"
          style={{ cursor: 'pointer' }}
          role="button"
          tabIndex={0}
        >
          <div className="donut-ring-outer" />
          <div
            className="donut donut-animate"
            style={{
              background: quizDonut
            }}
          >

            <div className="donut-hole">
              <strong>{avgQuiz.toFixed(0)}%</strong>
              <span>avg score</span>
            </div>

          </div>
        </div>

        <div className="quiz-score-stats">

          <div>
            <span className="quiz-stat-icon">🎯</span>
            <strong>
              {data?.totalQuizAttempts || 0}
            </strong>
            <span>Attempts</span>
          </div>

          <div>
            <span className="quiz-stat-icon">📚</span>
            <strong>
              {data?.completedLessons || 0}
            </strong>
            <span>Lessons done</span>
          </div>

          <div>
            <span className="quiz-stat-icon">🏆</span>
            <strong>
              {data?.highestQuizScore || 0}%
            </strong>
            <span>Best score</span>
          </div>

        </div>

      </section>

      </div>

      {/* =============================================
          ALL WEAK TOPICS — target of the dashboard's
          Weak Topics "View All" link
      ============================================= */}

      <section className="card analytics-weak-topics">

        <div className="dash-panel-head">

          <h3>⚠️ Weak Topics</h3>

          <p className="section-note">

            {displayWeak.length === 0
              ? "Quizzes scored below 60%."
              : weakFromQuiz
                ? `${displayWeak.length} topic${displayWeak.length === 1 ? "" : "s"} scored below 60% — review these first.`
                : `${displayWeak.length} subject${displayWeak.length === 1 ? "" : "s"} below 80% progress — catch up on these.`}

          </p>

        </div>

        {displayWeak.length === 0 ? (

          <p className="dash-empty">

            No weak topics found. Great job! 🎉

          </p>

        ) : (

          <div className="weak-list">

            {displayWeak.map((topic, i) => {

              const score = topic.score;

              const priority = topic.priority;

              return (

                <div
                  className="weak-item"
                  key={topic.name || i}
                >

                  <div className="weak-item-head">

                    <strong>

                      {i + 1}. {topic.name}

                    </strong>

                    <span>

                      {score}%

                    </span>

                  </div>

                  <div className="progress score-bar">

                    <span
                      style={{
                        width: `${Math.min(100, Math.max(0, score))}%`
                      }}
                    />

                  </div>

                  <p>

                    <span className={`dash-v2-weak-badge ${priority.toLowerCase()}`}>

                      {priority} Priority

                    </span>

                    {topic.recommendation}

                  </p>

                </div>

              );

            })}

          </div>

        )}

      </section>

    </div>
  );
}


// =====================================================
// CERTIFICATES
// =====================================================


export default Analytics;
