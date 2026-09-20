import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { awardActivity } from "../gamification";
import { getCards, addCard, autoCards, rateCard } from "../flashcards";
import { formatTime, Loading, Page } from "../ui";
import QuizHistory from "./QuizHistory";

function StudentLearning() {

  const { id } =
    useParams();

  const navigate =
    useNavigate();

  const [course, setCourse] =
    useState(null);

  const [lessons, setLessons] =
    useState([]);

  const [progress, setProgress] =
    useState(null);

  const [progressList, setProgressList] =
    useState([]);

  const [quizzes, setQuizzes] =
    useState([]);

  const [selectedLesson, setSelectedLesson] =
    useState(null);

  const [selectedQuiz, setSelectedQuiz] =
    useState(null);

  const [answers, setAnswers] =
    useState({});

  const [quizResult, setQuizResult] =
    useState(null);

  const [certificate, setCertificate] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

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

  // ---------- quiz history ----------

  const [attempts, setAttempts] =
    useState([]);

  const [showHistory, setShowHistory] =
    useState(false);

  // ---------- flashcards ----------

  const [cards, setCards] =
    useState([]);

  const [autoAdded, setAutoAdded] =
    useState(0);

  const [flashcardsOpen, setFlashcardsOpen] =
    useState(false);

  const [cardView, setCardView] =
    useState("review");

  const [cardIndex, setCardIndex] =
    useState(0);

  const [flipped, setFlipped] =
    useState(false);

  const [newFront, setNewFront] =
    useState("");

  const [newBack, setNewBack] =
    useState("");

  // ---------- semester system ----------

  const [semesters, setSemesters] = useState([]);

  const [activeSemester, setActiveSemester] = useState(null);

  const [subjectsBySemester, setSubjectsBySemester] = useState([]);

  const [totalSemesters, setTotalSemesters] = useState(0);


  useEffect(() => {

    loadLearningPage();

  }, [id]);

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


  async function loadLearningPage() {

    try {

      setLoading(true);
      setError("");

      const courseData =
        await api.course(id);

      const lessonData =
        await api.lessonsByCourse(id);

      const courseProgress =
        await api.courseProgress(id);

      const myProgress =
        await api.myProgress();

      let quizData = [];

      try {

        quizData =
          await api.quizzesByCourse(id);

      } catch (e) {

        console.warn(
          "Quiz API unavailable:",
          e
        );

      }


      const sortedLessons =
        (
          Array.isArray(lessonData)
            ? lessonData
            : []
        )
          .slice()
          .sort(
            (a, b) =>
              Number(
                a.lessonOrder || 0
              ) -
              Number(
                b.lessonOrder || 0
              )
          );


      setCourse(courseData);

      setLessons(sortedLessons);

      setProgress(
        courseProgress || null
      );

      // Load semester data
      try {
        const semData = await api.courseSemesters(id);
        const semList = Array.isArray(semData) ? semData : [];
        setSemesters(semList);
        const ts = courseData?.totalSemesters || semList.length || 0;
        setTotalSemesters(ts);
        if (ts > 0) {
          setActiveSemester(1);
          const subData = await api.courseSubjectsBySemester(id, 1);
          setSubjectsBySemester(Array.isArray(subData) ? subData : []);
        }
      } catch (e) {
        console.warn("Semester API unavailable:", e);
      }

      setProgressList(
        Array.isArray(myProgress)
          ? myProgress
          : []
      );

      setQuizzes(
        Array.isArray(quizData)
          ? quizData
          : []
      );

      // quiz attempt history
      try {

        const myAttempts =
          await api.quizAttempts();

        setAttempts(
          Array.isArray(myAttempts)
            ? myAttempts
            : []
        );

      } catch (e) {

        console.warn(
          "Attempts API unavailable:",
          e
        );

      }

      // flashcards (auto-generate from lessons)
      try {

        const result =
          autoCards(
            id,
            sortedLessons
          );

        setAutoAdded(
          result?.added || 0
        );

        setCards(
          getCards(id)
        );

      } catch (e) {

        console.warn(
          "Flashcards unavailable:",
          e
        );

      }


      if (sortedLessons.length > 0) {

        setSelectedLesson(
          sortedLessons[0]
        );

        const firstProgress =
          (
            Array.isArray(myProgress)
              ? myProgress
              : []
          ).find(
            item =>
              Number(
                item.lesson?.id
              ) ===
              Number(
                sortedLessons[0].id
              )
          );


        if (!firstProgress) {

          try {

            const started =
              await api.startLesson(
                sortedLessons[0].id
              );

            setProgressList(
              current => [
                ...current,
                started
              ]
            );

          } catch (e) {

            console.warn(
              "Unable to start first lesson:",
              e
            );

          }
        }
      }

    } catch (e) {

      setError(
        e.message ||
        "Unable to load the learning page."
      );

    } finally {

      setLoading(false);

    }
  }


  function lessonProgress(
    lessonId
  ) {

    return progressList.find(
      item =>
        Number(
          item.lesson?.id
        ) === Number(lessonId)
    );
  }

  async function switchSemester(sem) {
    setActiveSemester(sem);
    try {
      const subData = await api.courseSubjectsBySemester(id, sem);
      setSubjectsBySemester(Array.isArray(subData) ? subData : []);
    } catch (e) {
      console.warn("Unable to load subjects for semester:", e);
      setSubjectsBySemester([]);
    }
  }


  function completed(
    lessonId
  ) {

    return Boolean(
      lessonProgress(
        lessonId
      )?.completed
    );
  }


  async function openLesson(
    lesson
  ) {

    setSelectedQuiz(null);

    setQuizResult(null);

    setAnswers({});

    setSelectedLesson(lesson);

    setNotice("");

    setError("");


    if (
      !lessonProgress(
        lesson.id
      )
    ) {

      try {

        const started =
          await api.startLesson(
            lesson.id
          );

        setProgressList(
          current => [
            ...current,
            started
          ]
        );

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
              Number(
                item.lesson?.id
              ) ===
              Number(
                selectedLesson.id
              )
          );


        if (exists) {

          return current.map(item =>

            Number(
              item.lesson?.id
            ) ===
            Number(
              selectedLesson.id
            )
              ? updated
              : item

          );
        }


        return [
          ...current,
          updated
        ];

      });


      const newProgress =
        await api.courseProgress(id);

      setProgress(
        newProgress
      );

      setNotice(
        "Lesson completed successfully! 🎉"
      );

      awardActivity({
        type: "lesson",
        xp: 10
      });


      const index =
        lessons.findIndex(
          lesson =>
            Number(lesson.id) ===
            Number(
              selectedLesson.id
            )
        );


      if (
        index >= 0 &&
        index < lessons.length - 1
      ) {

        setTimeout(() => {

          openLesson(
            lessons[index + 1]
          );

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


  function openQuiz(quiz) {

    setSelectedQuiz(quiz);

    setSelectedLesson(null);

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

    } catch (e) {

      setError(
        e.message ||
        "Unable to submit the quiz."
      );

    } finally {

      setSaving(false);

    }
  }


  async function createCertificate() {

    try {

      setSaving(true);
      setError("");

      const result =
        await api.createCertificate(id);

      setCertificate(result);

      setNotice(
        "Certificate generated successfully! 🏆"
      );

    } catch (e) {

      setError(
        e.message ||
        "Complete all lessons before generating the certificate."
      );

    } finally {

      setSaving(false);

    }
  }


  function videoUrl(url) {

    if (!url) {
      return "";
    }

    try {

      const parsed =
        new URL(url);

      const host =
        parsed.hostname.replace(
          "www.",
          ""
        );


      if (
        host === "youtube.com" ||
        host === "m.youtube.com"
      ) {

        const videoId =
          parsed.searchParams.get("v");

        return videoId
          ? `https://www.youtube.com/embed/${videoId}`
          : url;
      }


      if (host === "youtu.be") {

        const videoId =
          parsed.pathname.replace(
            "/",
            ""
          );

        return videoId
          ? `https://www.youtube.com/embed/${videoId}`
          : url;
      }

    } catch {

      return url;

    }

    return url;
  }


  // ---------- flashcards helpers ----------

  function localToday() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  const queue =
    cards.filter(
      c => c.due <= localToday()
    );

  function openFlashcards() {
    setCards(getCards(id));
    setCardIndex(0);
    setFlipped(false);
    setCardView("review");
    setFlashcardsOpen(true);
  }

  function handleRate(rating) {
    const current =
      queue[cardIndex];
    if (!current) return;
    rateCard(
      id,
      current.id,
      rating
    );
    setCards(getCards(id));
    setFlipped(false);
    setCardIndex(i => i + 1);
  }

  function handleAddCard(event) {
    event.preventDefault();
    if (
      !newFront.trim() ||
      !newBack.trim()
    ) {
      return;
    }
    addCard(
      id,
      newFront.trim(),
      newBack.trim()
    );
    setCards(getCards(id));
    setNewFront("");
    setNewBack("");
  }


  if (loading) {
    return <Loading />;
  }


  if (!course) {

    return (
      <Page
        title="Learning"
        subtitle=""
      >

        <div className="error">
          {error ||
            "Course not found."}
        </div>

        <button
          className="secondary"
          onClick={() =>
            navigate("/courses")
          }
        >
          ← Back to Courses
        </button>

      </Page>
    );
  }


  const completedCount =
    lessons.filter(
      lesson =>
        completed(lesson.id)
    ).length;


  const percentage =
    Number(
      progress?.progressPercentage ??
      (
        lessons.length
          ? (
              completedCount /
              lessons.length
            ) * 100
          : 0
      )
    );


  const allCompleted =
    lessons.length > 0 &&
    completedCount === lessons.length;


  const currentProgress =
    selectedLesson
      ? lessonProgress(
          selectedLesson.id
        )
      : null;


  return (

    <Page
      title={course.title}
      subtitle="Student Learning"
    >

      {/* =================================================
          LEARNING HEADER
      ================================================= */}

      <section className="card learning-header">

        <div>

          <button
            className="back-link"
            onClick={() =>
              navigate(
                `/courses/${id}`
              )
            }
          >
            ← Course Details
          </button>

          <h2>
            {course.title}
          </h2>

          <p>
            {course.description ||
              "Continue your learning journey."}
          </p>

        </div>


        <div className="learning-progress-box">

          <div className="progress-label">

            <strong>
              Course Progress
            </strong>

            <span>
              {Math.round(
                percentage
              )}%
            </span>

          </div>


          <div className="progress large">

            <span
              style={{
                width:
                  `${Math.min(
                    100,
                    Math.max(
                      0,
                      percentage
                    )
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


      {/* ── SEMESTER TABS ── */}
      {totalSemesters > 0 && (
        <div className="semester-filter-row" style={{ marginBottom: 20 }}>
          <span className="semester-filter-label">Semesters:</span>
          <div className="semester-filter-tabs">
            {Array.from({ length: totalSemesters }, (_, i) => i + 1).map((sem) => (
              <button
                key={sem}
                className={`semester-tab ${Number(activeSemester) === Number(sem) ? "active" : ""}`}
                onClick={() => switchSemester(sem)}
              >
                Sem {sem}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── SUBJECTS FOR ACTIVE SEMESTER ── */}
      {activeSemester && subjectsBySemester.length > 0 && (
        <section className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ margin: '0 0 12px', color: '#e2e8f0' }}>📘 Semester {activeSemester} Subjects</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
            {subjectsBySemester.map((sub) => (
              <Link
                key={sub.id}
                to={`/subject/${sub.id}`}
                style={{
                  display: 'block',
                  padding: '14px 16px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.05)',
                  textDecoration: 'none',
                  color: 'inherit',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(59,130,246,0.5)';
                  e.currentTarget.style.background = 'rgba(59,130,246,0.1)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <strong style={{ color: '#e2e8f0', display: 'block', marginBottom: 4 }}>{sub.subjectName}</strong>
                <small style={{ color: '#94a3b8', display: 'block', marginBottom: 6 }}>{sub.subjectCode || ''}</small>
                <span style={{ color: '#3b82f6', fontSize: 12, fontWeight: 600 }}>View Subject →</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {!lessons.length ? (

        <section className="card empty-learning">

          <div className="learning-empty-icon">
            📚
          </div>

          <h3>
            No lessons available yet
          </h3>

          <p>
            Your instructor has not added lessons
            to this course yet.
          </p>

        </section>

      ) : (

        <div className="learning-layout">

          {/* =================================================
              LESSON SIDEBAR
          ================================================= */}

          <aside className="card lesson-sidebar">

            <div className="lesson-sidebar-header">

              <h3>
                Semester Subject Content
              </h3>

              <span>
                {lessons.length} lessons
              </span>

            </div>


            <div className="lesson-list">

              {lessons.map(
                (lesson, index) => {

                  const item =
                    lessonProgress(
                      lesson.id
                    );

                  const isActive =
                    Number(
                      selectedLesson?.id
                    ) ===
                    Number(
                      lesson.id
                    );


                  return (

                    <button
                      type="button"
                      key={lesson.id}
                      className={
                        `lesson-item ${
                          isActive
                            ? "active"
                            : ""
                        }`
                      }
                      onClick={() =>
                        openLesson(
                          lesson
                        )
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

                          {lesson.durationMinutes ||
                            0}
                          {" "}min

                          {item?.progressPercentage != null
                            ? ` • ${item.progressPercentage}%`
                            : ""}

                        </small>

                      </span>

                    </button>

                  );

                }
              )}

            </div>


            {quizzes.length > 0 && (

              <div className="quiz-sidebar-section">

                <h4>
                  Assessments
                </h4>


                {quizzes.map(
                  quiz => (

                    <button
                      type="button"
                      key={quiz.id}
                      className={
                        `quiz-nav-item ${
                          Number(
                            selectedQuiz?.id
                          ) ===
                          Number(
                            quiz.id
                          )
                            ? "active"
                            : ""
                        }`
                      }
                      onClick={() =>
                        openQuiz(
                          quiz
                        )
                      }
                      disabled={
                        !allCompleted
                      }
                    >

                      <span>
                        📝
                      </span>

                      <span>

                        <strong>
                          {quiz.title}
                        </strong>

                        <small>
                          {allCompleted
                            ? "Ready to attempt"
                            : "Complete lessons first"}
                        </small>

                      </span>

                    </button>

                  )
                )}

              </div>

            )}


            {/* =============================================
                FLASHCARDS SIDEBAR
            ============================================= */}

            <div className="flashcards-section">

              <div className="flashcards-head">

                <h4>
                  🃏 Flashcards
                </h4>

                <span>
                  {queue.length} due
                </span>

              </div>

              <button
                className="secondary"
                onClick={openFlashcards}
              >
                Review Cards
              </button>

              <small className="flashcards-count">
                {cards.length} cards
                {autoAdded > 0
                  ? ` · ${autoAdded} auto-created`
                  : ""}
              </small>

            </div>

          </aside>


          {/* =================================================
              MAIN LEARNING AREA
          ================================================= */}

          <main className="learning-main">

            {selectedLesson && (

              <section className="card lesson-viewer">

                <div className="lesson-viewer-top">

                  <div>

                    <span className="eyebrow">
                      Lesson{" "}
                      {selectedLesson.lessonOrder ||
                        ""}
                    </span>

                    <h2>
                      {selectedLesson.title}
                    </h2>

                    <p className="lesson-description">
                      {selectedLesson.description ||
                        ""}
                    </p>

                  </div>


                  <div className="lesson-viewer-progress">

                    {currentProgress?.completed
                      ? "Completed ✓"
                      : `${currentProgress?.progressPercentage || 0}% complete`}

                  </div>

                </div>


                {selectedLesson.videoUrl && (

                  <div className="video-wrapper">

                    <iframe
                      src={videoUrl(
                        selectedLesson.videoUrl
                      )}
                      title={
                        selectedLesson.title
                      }
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />

                  </div>

                )}


                <article className="lesson-content">

                  {(
                    selectedLesson.content ||
                    "No lesson content is available."
                  )
                    .split("\n")
                    .map(
                      (
                        paragraph,
                        index
                      ) => (

                        <p
                          key={index}
                        >
                          {paragraph}
                        </p>

                      )
                    )}

                </article>


                <div className="lesson-actions">

                  <button
                    className="primary"
                    onClick={
                      markComplete
                    }
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


                  {(() => {

                    const index =
                      lessons.findIndex(
                        lesson =>
                          Number(
                            lesson.id
                          ) ===
                          Number(
                            selectedLesson.id
                          )
                      );


                    const next =
                      lessons[
                        index + 1
                      ];


                    return next ? (

                      <button
                        className="secondary"
                        onClick={() =>
                          openLesson(
                            next
                          )
                        }
                      >
                        Next Lesson →
                      </button>

                    ) : null;

                  })()}

                </div>

              </section>

            )}


            {/* =================================================
                QUIZ
            ================================================= */}

            {selectedQuiz && (

              <section className="card quiz-viewer">

                <div className="quiz-title-row">

                  <div>

                    <span className="eyebrow">
                      Course Quiz
                    </span>

                    <h2>
                      {selectedQuiz.title}
                    </h2>

                    <p>
                      {selectedQuiz.description ||
                        "Test your understanding of this course."}
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
                        className={`quiz-timer ${
                          secondsLeft <= 15
                            ? "urgent"
                            : ""
                        }`}
                        title="Time remaining (auto-submits at 0:00)"
                      >
                        ⏱ {formatTime(secondsLeft)}
                      </span>

                      )}

                  </div>

                </div>


                <form
                  onSubmit={
                    submitQuiz
                  }
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
                                (
                                  [
                                    letter,
                                    text
                                  ]
                                ) => (

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
                      disabled={
                        saving
                      }
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

                  </div>

                )}


                {/* =============================================
                    QUIZ ATTEMPT HISTORY
                ============================================= */}

                <div className="quiz-history">

                  <button
                    className="secondary history-toggle"
                    onClick={() =>
                      setShowHistory(
                        s => !s
                      )
                    }
                  >
                    📜 Attempt History
                    {" "}
                    (
                    {
                      attempts.filter(
                        a =>
                          Number(
                            a.quiz?.id
                          ) ===
                          Number(
                            selectedQuiz?.id
                          )
                      ).length
                    }
                    )
                  </button>

                  {showHistory && (

                    <QuizHistory
                      attempts={attempts}
                      quizId={selectedQuiz?.id}
                    />

                  )}

                </div>

              </section>

            )}


            {/* =================================================
                COURSE COMPLETION
            ================================================= */}

            {allCompleted &&
              quizzes.length > 0 &&
              !selectedQuiz && (

                <section className="card completion-card">

                  <div className="completion-icon">
                    🎉
                  </div>

                  <h2>
                    All lessons completed!
                  </h2>

                  <p>
                    Take the quiz and then
                    generate your certificate.
                  </p>


                  <div className="completion-actions">

                    <button
                      className="primary"
                      onClick={() =>
                        openQuiz(
                          quizzes[0]
                        )
                      }
                    >
                      📝 Take Quiz
                    </button>

                    <button
                      className="secondary"
                      onClick={
                        createCertificate
                      }
                      disabled={
                        saving
                      }
                    >
                      {saving
                        ? "Generating..."
                        : "🏆 Generate Certificate"}
                    </button>

                  </div>

                </section>

              )}


            {allCompleted &&
              quizzes.length === 0 && (

                <section className="card completion-card">

                  <div className="completion-icon">
                    🏆
                  </div>

                  <h2>
                    Course completed!
                  </h2>

                  <p>
                    You have completed all
                    lessons. You can now
                    generate your certificate.
                  </p>

                  <button
                    className="primary"
                    onClick={
                      createCertificate
                    }
                    disabled={
                      saving
                    }
                  >
                    {saving
                      ? "Generating..."
                      : "🏆 Generate Certificate"}
                  </button>

                </section>

              )}


            {/* =================================================
                CERTIFICATE
            ================================================= */}

            {certificate && (

              <section className="card certificate learning-certificate">

                <div className="medal">
                  🏆
                </div>

                <h2>
                  Certificate Generated
                </h2>

                <p>
                  Congratulations on completing{" "}
                  {course.title}.
                </p>

                <strong>
                  {certificate.certificateId ||
                    certificate.id ||
                    "Certificate Generated"}
                </strong>

                <div>

                  <button
                    className="secondary"
                    onClick={() =>
                      navigate(
                        "/certificates"
                      )
                    }
                  >
                    View My Certificates
                  </button>

                </div>

              </section>

            )}

          </main>

        </div>

      )}


      {/* =================================================
          FLASHCARDS MODAL
      ================================================= */}

      {flashcardsOpen && (

        <div
          className="modal-overlay"
          onClick={() =>
            setFlashcardsOpen(false)
          }
        >

          <div
            className="modal"
            onClick={e =>
              e.stopPropagation()
            }
          >

            <div className="modal-head">

              <h3>
                🃏 Flashcards
              </h3>

              <button
                className="modal-close"
                onClick={() =>
                  setFlashcardsOpen(false)
                }
              >
                ✕
              </button>

            </div>

            <div className="modal-tabs">

              <button
                className={
                  cardView === "review"
                    ? "tab active"
                    : "tab"
                }
                onClick={() =>
                  setCardView("review")
                }
              >
                Review
              </button>

              <button
                className={
                  cardView === "add"
                    ? "tab active"
                    : "tab"
                }
                onClick={() =>
                  setCardView("add")
                }
              >
                Add Card
              </button>

            </div>

            {cardView === "review" ? (

              queue.length === 0 ? (

                <div className="flashcard-done">

                  <span>🎉</span>

                  <h4>All caught up!</h4>

                  <p>
                    No cards are due right now.
                    Come back later or add
                    new cards.
                  </p>

                </div>

              ) : cardIndex >=
                queue.length ? (

                <div className="flashcard-done">

                  <span>✅</span>

                  <h4>Session complete!</h4>

                  <p>
                    You reviewed all due cards.
                  </p>

                </div>

              ) : (

                <>

                  <div className="flashcard-counter">
                    Card {cardIndex + 1}{" "}
                    of {queue.length}
                  </div>

                  <div
                    className={
                      flipped
                        ? "flashcard flipped"
                        : "flashcard"
                    }
                    onClick={() =>
                      setFlipped(
                        f => !f
                      )
                    }
                  >

                    <div className="flashcard-inner">

                      <div className="flashcard-face front">
                        <span>
                          {queue[cardIndex].front}
                        </span>
                        <small>
                          Tap to reveal
                        </small>
                      </div>

                      <div className="flashcard-face back">
                        <span>
                          {queue[cardIndex].back}
                        </span>
                      </div>

                    </div>

                  </div>

                  {flipped && (

                    <div className="flashcard-rating">

                      <button
                        onClick={() =>
                          handleRate("again")
                        }
                      >
                        🔄 Again
                      </button>

                      <button
                        onClick={() =>
                          handleRate("hard")
                        }
                      >
                        😓 Hard
                      </button>

                      <button
                        onClick={() =>
                          handleRate("good")
                        }
                      >
                        👍 Good
                      </button>

                      <button
                        onClick={() =>
                          handleRate("easy")
                        }
                      >
                        ⚡ Easy
                      </button>

                    </div>

                  )}

                </>

              )

            ) : (

              <form
                className="flashcard-add"
                onSubmit={handleAddCard}
              >

                <input
                  value={newFront}
                  onChange={e =>
                    setNewFront(
                      e.target.value
                    )
                  }
                  placeholder="Front — question or term"
                  required
                />

                <textarea
                  value={newBack}
                  onChange={e =>
                    setNewBack(
                      e.target.value
                    )
                  }
                  placeholder="Back — answer or definition"
                  rows="3"
                  required
                />

                <button
                  className="primary"
                  type="submit"
                >
                  ➕ Add Card
                </button>

              </form>

            )}

          </div>

        </div>

      )}

    </Page>
  );
}


// =====================================================
// QUIZ HISTORY
// =====================================================


export default StudentLearning;
