import React, { useEffect, useState } from "react";
import { api } from "../api";
import { getWeeklyActivity } from "../gamification";
import { Loading } from "../ui";

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

    </div>
  );
}


// =====================================================
// CERTIFICATES
// =====================================================


export default Analytics;
