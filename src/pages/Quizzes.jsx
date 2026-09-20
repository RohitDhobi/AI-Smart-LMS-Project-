import React, { useEffect, useRef, useState } from "react";
import { api } from "../api";
import { awardActivity } from "../gamification";
import { formatTime, Loading, Empty, Page } from "../ui";
import { celebratePass } from "../utils/confetti";

function Quizzes() {

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [quizList, setQuizList] =
    useState([]);

  const [searchInput, setSearchInput] =
    useState("");

  // Debounced filter term, so results only update
  // after the user stops typing for a moment.

  const [search, setSearch] =
    useState("");

  const [searching, setSearching] =
    useState(false);

  const searchTimerRef =
    useRef(null);

  const [attempts, setAttempts] =
    useState({});

  const [passedQuizzes, setPassedQuizzes] =
    useState({});

  const [selectedQuiz, setSelectedQuiz] =
    useState(null);

  const [answers, setAnswers] =
    useState({});

  const [quizResult, setQuizResult] =
    useState(null);

  const [saving, setSaving] =
    useState(false);

  const [notice, setNotice] =
    useState("");

  // ---------- quiz timer ----------

  const SECONDS_PER_QUESTION = 60;

  const [secondsLeft, setSecondsLeft] =
    useState(0);

  const [timerDone, setTimerDone] =
    useState(false);

  const submitRef = useRef(null);

  useEffect(() => {
    submitRef.current = submitQuiz;
  });

  useEffect(() => {
    loadQuizzes();
  }, []);

  useEffect(() => {

    return () => {

      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }

    };

  }, []);

  // Reset the countdown when a quiz opens

  useEffect(() => {

    if (!selectedQuiz) {
      return;
    }

    const questionCount =
      selectedQuiz.questions?.length || 1;

    setSecondsLeft(
      questionCount * SECONDS_PER_QUESTION
    );

    setTimerDone(false);

  }, [selectedQuiz?.id]);

  // Tick down every second; auto-submit at zero

  useEffect(() => {

    if (
      !selectedQuiz ||
      quizResult ||
      secondsLeft <= 0
    ) {
      return;
    }

    const timer = setTimeout(() => {

      setSecondsLeft(s => {

        const next = s - 1;

        if (next === 0) {
          setTimerDone(true);
        }

        return next;

      });

    }, 1000);

    return () =>
      clearTimeout(timer);

  }, [secondsLeft, selectedQuiz, quizResult]);

  // Auto-submit when the timer hits zero

  useEffect(() => {

    if (
      timerDone &&
      selectedQuiz &&
      !quizResult &&
      !saving
    ) {
      submitRef.current(null);
    }

  }, [timerDone, selectedQuiz, quizResult, saving]);


  async function loadQuizzes() {

    try {

      setLoading(true);
      setError("");

      // The /quizzes endpoint doesn't expose the
      // course, so map quizzes to courses by
      // fetching each course's quizzes.

      const courses =
        await api.courses();

      const entries = [];

      for (const course of
        (Array.isArray(courses)
          ? courses
          : [])) {

        try {

          const courseQuizzes =
            await api.quizzesByCourse(
              course.id
            );

          for (const quiz of
            (Array.isArray(courseQuizzes)
              ? courseQuizzes
              : [])) {

            entries.push({
              ...quiz,
              courseId: course.id,
              courseTitle: course.title
            });

          }

        } catch (e) {
          // skip courses that fail
        }

      }

      // Fallback: if no course mapping worked,
      // show the flat list.

      if (entries.length === 0) {

        const all =
          await api.quizzes();

        for (const quiz of
          (Array.isArray(all)
            ? all
            : [])) {

          entries.push({
            ...quiz,
            courseTitle: "General"
          });

        }

      }

      setQuizList(entries);

      // Best score per quiz from attempt history

      try {

        const history =
          await api.quizAttempts();

        const best = {};
        const passed = {};

        for (const attempt of
          (Array.isArray(history)
            ? history
            : [])) {

          const quizId =
            attempt?.quiz?.id;

          if (!quizId) {
            continue;
          }

          const pct =
            Number(
              attempt.percentage || 0
            );

          if (
            best[quizId] ===
              undefined ||
            pct > best[quizId]
          ) {
            best[quizId] = pct;
          }

          if (attempt.passed) {
            passed[quizId] = true;
          }

        }

        setAttempts(best);
        setPassedQuizzes(passed);

      } catch (e) {
        // attempt history is optional
      }

    } catch (e) {

      setError(
        e.message ||
        "Unable to load quizzes."
      );

    } finally {

      setLoading(false);

    }

  }


  function openQuiz(quiz) {

    setSelectedQuiz(quiz);

    setAnswers({});

    setQuizResult(null);

    setNotice("");

    setError("");

  }


  function chooseAnswer(
    questionId,
    answer
  ) {

    setAnswers(
      current => ({
        ...current,
        [questionId]: answer
      })
    );

  }


  async function submitQuiz(
    event
  ) {

    if (event?.preventDefault) {
      event.preventDefault();
    }

    if (!selectedQuiz) {
      return;
    }

    try {

      setSaving(true);
      setError("");

      const result =
        await api.submitQuiz(
          selectedQuiz.id,
          answers
        );

      setQuizResult(result);

      if (result?.passed) {
        celebratePass();
      }

      setNotice(
        result?.passed
          ? "Congratulations! You passed the quiz. 🎉"
          : "Quiz submitted. You can try again."
      );

      awardActivity({
        type: result?.passed
          ? "quiz-pass"
          : "quiz",
        xp: result?.passed
          ? 25
          : 5
      });

      // refresh best scores
      loadQuizzes();

    } catch (e) {

      setError(
        e.message ||
        "Unable to submit the quiz."
      );

    } finally {

      setSaving(false);

    }

  }


  function handleSearchChange(event) {

    const value =
      event.target.value;

    setSearchInput(value);
    setSearching(true);

    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    searchTimerRef.current =
      setTimeout(() => {
        setSearch(value);
        setSearching(false);
      }, 250);
  }


  const filtered = quizList.filter(
    quiz =>
      !search.trim() ||
      quiz.title
        .toLowerCase()
        .includes(
          search.trim().toLowerCase()
        ) ||
      (quiz.courseTitle || "")
        .toLowerCase()
        .includes(
          search.trim().toLowerCase()
        )
  );


  if (loading) {
    return <Loading />;
  }


  // ---------- inline quiz taking ----------

  if (selectedQuiz) {

    return (

      <Page
        title="Take a Quiz"
        subtitle={
          selectedQuiz.courseTitle ||
          "Course quiz"
        }
      >

        <button
          className="secondary back-button"
          onClick={() =>
            setSelectedQuiz(null)
          }
        >
          ← All Quizzes
        </button>

        {notice && (
          <div className="notice">
            {notice}
          </div>
        )}

        {error && (
          <div className="error">
            {error}
          </div>
        )}

        <section className="card quiz-viewer">

          <div className="quiz-title-row">

            <div>

              <span className="eyebrow">
                {selectedQuiz.courseTitle ||
                  "Course Quiz"}
              </span>

              <h2>
                {selectedQuiz.title}
              </h2>

              <p>
                {selectedQuiz.description ||
                  "Test your understanding."}
              </p>

            </div>

            <div className="quiz-count-wrap">

              <span className="quiz-count">

                {selectedQuiz.questions
                  ?.length || 0}

                {" "}questions

              </span>

              {!quizResult && secondsLeft > 0 && (

                <span
                  className={
                    `quiz-timer ${
                      secondsLeft <= 15
                        ? "urgent"
                        : ""
                    }`
                  }
                  title="Time remaining (auto-submits at 0:00)"
                >
                  ⏱ {formatTime(secondsLeft)}
                </span>

              )}

            </div>

          </div>


          <form
            onSubmit={submitQuiz}
          >

            {(selectedQuiz.questions ||
              [])
              .map(
                (
                  question,
                  index
                ) => {

                  const options = [
                    [
                      "A",
                      question.optionA
                    ],
                    [
                      "B",
                      question.optionB
                    ],
                    [
                      "C",
                      question.optionC
                    ],
                    [
                      "D",
                      question.optionD
                    ]
                  ];

                  return (

                    <div
                      className="quiz-question"
                      key={
                        question.id
                      }
                    >

                      <h3>
                        {index + 1}.
                        {" "}
                        {
                          question.questionText
                        }
                      </h3>

                      <div className="quiz-options">

                        {options.map(
                          ([
                            letter,
                            text
                          ]) => (

                            <label
                              className={
                                `quiz-option ${
                                  answers[
                                    question.id
                                  ] ===
                                  letter
                                    ? "selected"
                                    : ""
                                }`
                              }
                              key={
                                letter
                              }
                            >

                              <input
                                type="radio"
                                name={
                                  `question-${question.id}`
                                }
                                value={
                                  letter
                                }
                                checked={
                                  answers[
                                    question.id
                                  ] ===
                                  letter
                                }
                                onChange={() =>
                                  chooseAnswer(
                                    question.id,
                                    letter
                                  )
                                }
                              />

                              <span className="option-letter">
                                {letter}
                              </span>

                              <span>
                                {text}
                              </span>

                            </label>

                          )
                        )}

                      </div>

                    </div>

                  );

                }
              )}

            {selectedQuiz.questions
              ?.length > 0 && (

              <button
                className="primary"
                disabled={saving}
              >
                {saving
                  ? "Submitting..."
                  : "Submit Quiz"}
              </button>

            )}

          </form>


          {quizResult && (

            <div
              className={
                `quiz-result ${
                  quizResult.passed
                    ? "passed"
                    : "failed"
                }`
              }
            >

              <div className="quiz-result-icon">
                {quizResult.passed
                  ? "🏆"
                  : "📋"}
              </div>

              <h3>
                {quizResult.passed
                  ? "Quiz Passed!"
                  : "Quiz Not Passed"}
              </h3>

              <p>
                Score:
                {" "}
                <strong>
                  {quizResult.score}
                </strong>
                {" / "}
                {quizResult.totalMarks}
              </p>

              <p>
                Percentage:
                {" "}
                <strong>
                  {Number(
                    quizResult.percentage ||
                    0
                  ).toFixed(1)}
                  %
                </strong>
              </p>

              <div className="quiz-result-actions">

                <button
                  className="secondary"
                  onClick={() => {
                    setQuizResult(null);
                    setAnswers({});
                  }}
                >
                  Try Again
                </button>

                <button
                  className="primary"
                  onClick={() =>
                    setSelectedQuiz(null)
                  }
                >
                  Back to Quizzes
                </button>

              </div>

            </div>

          )}

        </section>

      </Page>

    );

  }


  // ---------- quiz list ----------

  return (

    <Page
      title="Quizzes"
      subtitle="Test your knowledge with quizzes from every course."
    >

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      <div className="course-search">

        <input
          value={searchInput}
          onChange={handleSearchChange}
          placeholder="Search quizzes or courses..."
        />

        {searching && (
          <span className="search-status">
            Searching…
          </span>
        )}

      </div>

      {filtered.length === 0 ? (

        <Empty
          text="No quizzes found."
        />

      ) : (

        <div className="quizzes-grid">

          {filtered.map(quiz => {

            const best =
              attempts[quiz.id];

            return (

              <div
                className="card quiz-card"
                key={quiz.id}
              >

                <div className="quiz-card-icon">
                  📝
                </div>

                <div className="quiz-card-head">

                  <span className="quiz-card-course">
                    {quiz.courseTitle ||
                      "General"}
                  </span>

                  {passedQuizzes[
                    quiz.id
                  ] && (

                    <span className="passed-badge"
                      title="You passed this quiz"
                    >
                      ✓ Passed
                    </span>

                  )}

                </div>

                <h2>
                  {quiz.title}
                </h2>

                <p>
                  {quiz.description ||
                    "Test your understanding of this topic."}
                </p>

                <div className="quiz-card-meta">

                  <span>
                    {quiz.questions
                      ?.length || 0}{" "}
                    questions
                  </span>

                  {best !==
                    undefined && (

                    <span
                      className={
                        best >= 50
                          ? "best-score pass"
                          : "best-score"
                      }
                    >
                      Best: {best.toFixed(0)}%
                    </span>

                  )}

                </div>

                <button
                  className="primary quiz-take-btn"
                  onClick={() =>
                    openQuiz(quiz)
                  }
                >
                  {best !==
                    undefined
                    ? "Retake Quiz"
                    : "Take Quiz"}
                </button>

              </div>

            );

          })}

        </div>

      )}

    </Page>

  );
}


// =====================================================
// LEADERBOARD
// =====================================================


export default Quizzes;
