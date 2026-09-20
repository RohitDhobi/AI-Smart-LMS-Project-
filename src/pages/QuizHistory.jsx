import React from "react";

function QuizHistory({ attempts, quizId }) {

  const list =
    (Array.isArray(attempts)
      ? attempts
      : [])
      .filter(
        a =>
          Number(
            a.quiz?.id
          ) ===
          Number(quizId)
      )
      .sort(
        (a, b) =>
          new Date(
            b.attemptedAt || 0
          ) -
          new Date(
            a.attemptedAt || 0
          )
      );

  if (list.length === 0) {

    return (
      <div className="history-empty">
        No attempts yet for this quiz.
      </div>
    );
  }

  return (
    <div className="history-list">

      {list.map((a, i) => (

        <div
          className={
            a.passed
              ? "history-item passed"
              : "history-item failed"
          }
          key={a.id || i}
        >

          <div>

            <strong>
              Attempt #{list.length - i}
            </strong>

            <span>
              {a.attemptedAt
                ? new Date(
                    a.attemptedAt
                  ).toLocaleString()
                : ""}
            </span>

          </div>

          <div className="history-score">

            <strong>
              {a.score} / {a.totalMarks}
            </strong>

            <span>
              {Number(
                a.percentage || 0
              ).toFixed(1)}
              % ·{" "}
              {a.passed
                ? "✅ Passed"
                : "❌ Failed"}
            </span>

          </div>

        </div>

      ))}

    </div>
  );
}


// =====================================================
// WISHLIST
// =====================================================


export default QuizHistory;
