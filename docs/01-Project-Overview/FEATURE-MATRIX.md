# AI-Smart-LMS — Feature Matrix

**Status values**:

- `IMPLEMENTED` — feature exists end-to-end (frontend page + backend endpoint + persistence where applicable)
- `PARTIALLY IMPLEMENTED` — some layers exist, others are placeholders, local-only, or missing
- `NOT IMPLEMENTED` — claimed somewhere in text/UI but **no code**
- `NOT FOUND` — no trace anywhere in the repository

**AI column** = whether that feature uses AI logic; `—` means no AI involved.

---

## 1. Authentication & Accounts

| Module | Feature | Status | Frontend | Backend | Database | AI |
|---|---|---|---|---|---|---|
| Auth | Student self-registration (role forced STUDENT, auto-enrol) | IMPLEMENTED | `pages/Register.jsx` | `POST /api/auth/register` (`AuthService`) | `users`, `enrollments` | — |
| Auth | Login → JWT (24 h) + role-based redirect | IMPLEMENTED | `pages/Login.jsx` | `POST /api/auth/login` | `users` | — |
| Auth | Staff login with role tabs (Admin/Instructor/HOD) | IMPLEMENTED | `pages/StaffLogin.jsx` | same login endpoint | `users` | — |
| Auth | Instructor self-signup pending admin approval | IMPLEMENTED | `pages/Register.jsx` | `POST /api/auth/register/instructor` | `users.active=false` | — |
| Auth | JWT filter + BCrypt + stateless security chain | IMPLEMENTED | `src/api.js` | `security/*` | — | — |
| Auth | Token refresh | IMPLEMENTED | — (not called by UI) | `POST /api/auth/refresh` | — | — |
| Auth | Forgot/reset password | PARTIALLY IMPLEMENTED | (no dedicated page found using it) | `POST /api/auth/forgot-password`, `/reset-password` — token returned in body, no email; both endpoints sit behind JWT | `password_reset_tokens` | — |
| Auth | Account activate/deactivate | IMPLEMENTED | `pages/AdminTeachers.jsx` | `PUT /api/admin/users/{id}/active` | `users.active` | — |
| Accounts | Default demo accounts seeded on first run | IMPLEMENTED | — | `config/DataSeeder.java` | `users` | — |
| Accounts | Phone-number validation (optional field: digits `+ - space`, 7–15 digits) | IMPLEMENTED | `src/utils/phone.js` used by Register, Profile, settings pages, AdminTeachers | `util/PhoneValidator.java` in `AuthService.register`, `registerInstructor`, `PUT /api/profile`, `PUT /api/instructor/profile` | `users.phone` | — |
| Accounts | Academic structure seeded on first run (semesters per course, previous + current academic year) | IMPLEMENTED | — | `config/DataSeeder.java` → `seedAcademicStructure()`, `backfillAssignmentAcademicFields()` | `semesters`, `academic_years` | — |

## 2. User Roles

| Module | Feature | Status | Frontend | Backend | Database | AI |
|---|---|---|---|---|---|---|
| Roles | 4 roles (`STUDENT`,`INSTRUCTOR`,`HOD`,`ADMIN`) | IMPLEMENTED | role badges in all 4 layouts | `entity/Role.java`, `ROLE_` authority | `users.role` | — |
| Roles | Per-endpoint role enforcement (manual, server-side) | IMPLEMENTED | buttons hidden per role | `role()`, `requireRole()`, `requireHOD()`, `requireHODOrAdmin()`, `InstructorAccessService` | — | — |
| Roles | Route guard (`Protected`) | PARTIALLY IMPLEMENTED | `ui.jsx` — checks **token only, not role** | — | — | — |
| Roles | Admin role management UI | PARTIALLY IMPLEMENTED | `pages/admin/AdminRoles.jsx` (role list is a local `BUILTIN` constant) | `PUT /api/admin/users/{id}/role` | `users.role` | — |
| Roles | Audit log of role changes | NOT IMPLEMENTED | `pages/admin/AdminAuditLogs.jsx` uses a **hard-coded `auditLogs` array** | no audit endpoint | no audit table | — |

## 3. Course Management

| Module | Feature | Status | Frontend | Backend | Database | AI |
|---|---|---|---|---|---|---|
| Courses | Degree programs (BCA, MBA …) with code/duration/semesters | IMPLEMENTED | `pages/Courses.jsx`, `pages/admin/AdminSemesters.jsx` | `GET /api/courses`, `/api/admin/courses` | `courses` | — |
| Courses | Subjects per semester | IMPLEMENTED | `pages/admin/AdminSubjects.jsx`, `AdminSemesters.jsx` | `/api/admin/subjects*`, `GET /api/courses/{id}/subjects` | `subjects` | — |
| Courses | Lessons (content, video, order, duration) | IMPLEMENTED | `pages/admin/AdminLessons.jsx`, `pages/StudentLearning.jsx` | `/api/admin/lessons*`, `/api/lessons/*` | `lessons` | — |
| Courses | Public catalogue + search + category + filter | IMPLEMENTED | `pages/Courses.jsx` | `GET /api/courses` (public), `/courses/search`, `/category/{c}`, `/filter`, `/categories` | `courses` | — |
| Courses | Course approval workflow (status) | IMPLEMENTED | `pages/AdminCourseManagement.jsx` | `PUT /api/courses/{id}/status` (ADMIN), `GET /api/admin/pending-courses` | `courses.status` | — |
| Courses | Instructor creates/edits own courses & lessons | IMPLEMENTED | `pages/instructor/InstructorCourseCreate.jsx`, `InstructorLessons.jsx` | `POST /api/instructor/courses`, `/instructor/subjects/{id}/lessons` | `courses`, `lessons` | — |
| Courses | Plain `POST/PUT/DELETE /api/courses` | PARTIALLY IMPLEMENTED | — | `CourseController` — **no role check; POST is public** (see SECURITY.md) | `courses` | — |
| Courses | Categories management page | PARTIALLY IMPLEMENTED | `pages/admin/AdminCategories.jsx` | `GET /api/categories` (read-only, derived) | `courses.category` | — |

## 4. Enrollment

| Module | Feature | Status | Frontend | Backend | Database | AI |
|---|---|---|---|---|---|---|
| Enrolment | Enrol in a course | IMPLEMENTED | `pages/CourseDetails.jsx` | `POST /api/enrollments` | `enrollments` | — |
| Enrolment | My enrolments | IMPLEMENTED | `pages/Dashboard.jsx` | `GET /api/enrollments/my` | `enrollments` | — |
| Enrolment | Auto-enrolment at registration (degree course) | IMPLEMENTED | — | `AuthService.register` | `enrollments` | — |

## 5. Learning Progress

| Module | Feature | Status | Frontend | Backend | Database | AI |
|---|---|---|---|---|---|---|
| Progress | Start / update / read lesson progress | IMPLEMENTED | `pages/StudentLearning.jsx`, `SubjectLearning.jsx` | `POST|PUT /api/progress/lesson/{id}`, `GET /api/progress/my`, `/course/{id}` | `progress` | — |
| Progress | Continue Learning (last 10 unfinished) | IMPLEMENTED | `pages/Dashboard.jsx` | `GET /api/continue-learning` | `progress` | — |
| Progress | Course completion % | IMPLEMENTED | `components/ProgressRing.jsx` | `GET /api/progress/course/{id}` | `progress` | — |
| Progress | Learning heatmap / study planner / streak | PARTIALLY IMPLEMENTED | `components/LearningHeatmap.jsx`, `StudyPlanner.jsx`, `StudyStreak.jsx` — **local data** | none | none | — |

## 6. Quiz System

| Module | Feature | Status | Frontend | Backend | Database | AI |
|---|---|---|---|---|---|---|
| Quiz | Quiz CRUD per course | IMPLEMENTED | `pages/instructor/InstructorQuizzes.jsx`, `pages/Quizzes.jsx` | `POST/GET/DELETE /api/quizzes/...` (course-manage gated) | `quizzes` | — |
| Quiz | MCQ questions (4 options + answer + marks + order) | IMPLEMENTED | instructor quiz pages | `POST/PUT/DELETE /api/questions/...` (course-manage gated) | `questions` | — |
| Quiz | Attempt submission & server-side grading | IMPLEMENTED | `pages/Quizzes.jsx` | `POST /api/quiz-attempts/submit` (`QuizAttemptService`) | `quiz_attempts` | — |
| Quiz | Attempt history / quiz history | IMPLEMENTED | `pages/QuizHistory.jsx` | `GET /api/quiz-attempts/my` | `quiz_attempts` | — |
| Quiz | Non-MCQ question types | NOT IMPLEMENTED | AI Tools can build 1/2/3/5-marker text, but only inside an **exam paper JSON** | `questions` table has MCQ columns only | — | — |

## 7. Exam System

| Module | Feature | Status | Frontend | Backend | Database | AI |
|---|---|---|---|---|---|---|
| Exam | Exam CRUD (duration, marks, passing, negative marking, schedule) | IMPLEMENTED | `pages/instructor/InstructorExams.jsx`, `pages/Exams.jsx`, `pages/admin/AdminExams.jsx` | `POST/PUT/DELETE /api/exams` | `exams` | — |
| Exam | JSON question paper upload (from AI Tools) | IMPLEMENTED | `InstructorAITools.jsx` → `questionPaper: JSON.stringify(...)` | `ExamController.createExam` | `exams.question_paper` (TEXT) | rule-based (client) |
| Exam | **HOD approval state machine** (DRAFT→PENDING→APPROVED/PUBLISHED, REJECTED loop) | IMPLEMENTED | `pages/hod/HODExamApprovals.jsx`, `InstructorExams.jsx` | `ExamApprovalService` + `/api/hod/exam-approvals/*` + `/api/exams/{id}/submit-for-approval|publish` | `exams.status`, `submittedAt`, `approvedBy`, `rejectionReason`, `publishedAt` | — |
| Exam | Publish gate (403 unless APPROVED) | IMPLEMENTED | button hidden in UI | `ExamApprovalService.publish` | — | — |
| Exam | Admin status override | IMPLEMENTED | admin exam page | `PUT /api/exams/{id}/status` | `exams.status` | — |
| Exam | Student sees only published exams; paper hidden outside the slot | IMPLEMENTED | `pages/Exams.jsx` | `ExamController.visibleToStudent` + `ExamService.visibleToStudent` | — | — |
| Exam | Server-side grading (MCQ + negative marking + `pendingManual`) | IMPLEMENTED | `pages/Exams.jsx` | `ExamService.gradeSubmission` | reads `exams.question_paper` | — |
| Exam | **Exam result persistence / history** | **NOT IMPLEMENTED** | result shown transiently | grading returns a `Map`; **nothing is saved** | no exam-attempt table | — |
| Exam | Exam results page for students | PARTIALLY IMPLEMENTED | shows quiz results; no persisted exam results | — | — | — |

## 8. Question Bank

| Module | Feature | Status | Frontend | Backend | Database | AI |
|---|---|---|---|---|---|---|
| Question bank | HOD question bank listing | PARTIALLY IMPLEMENTED | `pages/hod/HODQuestions.jsx` | `GET /api/hod/questions` — `type`/`difficulty`/`status` are **hard-coded literals** | `questions` (only `marks`, text, quiz/course are real) | — |
| Question bank | AI generation into a quiz (persists with `quizId`) | IMPLEMENTED | `HODQuestions.jsx` | `POST /api/hod/questions/generate` | `questions` | ✅ rule-based |
| Question bank | Question approval status / reviewer | NOT IMPLEMENTED | — | no field, no endpoint | no columns | — |
| Question bank | Standalone bank entity (independent of a quiz) | NOT FOUND | — | — | `Question.quiz_id` is NOT NULL | — |

## 9. Instructor Functionality

| Module | Feature | Status | Frontend | Backend | Database | AI |
|---|---|---|---|---|---|---|
| Instructor | Dashboard KPIs | IMPLEMENTED | `pages/instructor/InstructorDashboard.jsx` | `GET /api/instructor/dashboard` (INSTRUCTOR/ADMIN) | aggregates | — |
| Instructor | My subjects / my courses / course detail | IMPLEMENTED | `InstructorMySubjects.jsx`, `InstructorCourses.jsx`, `InstructorCourseDetails.jsx` | `/api/instructor/my-subjects`, `/api/instructor/courses*` | `subjects`, `courses` | — |
| Instructor | Assignments create/manage/grade | IMPLEMENTED | `InstructorAssignments.jsx` | `/api/assignments/**` (course-manage) | `assignments`, assignment submissions | — |
| Instructor | Attendance marking | IMPLEMENTED | `InstructorAttendance.jsx` | `POST /api/attendance` (course-manage) | `attendance` | — |
| Instructor | Grade book / students / analytics / announcements / discussions / calendar / settings | IMPLEMENTED | `InstructorGradeBook.jsx`, `InstructorStudents.jsx`, `InstructorAnalytics.jsx`, `InstructorAnnouncements.jsx`, `InstructorDiscussions.jsx`, `InstructorCalendar.jsx`, `InstructorSettings.jsx` | matching endpoints | various | — |
| Instructor | Course materials upload (50 MB) | IMPLEMENTED | `InstructorResources.jsx` | `POST /api/resources/course/{id}/upload` | `resources` + `uploads/resources` | — |
| Instructor | Certificates: stats, eligibility, generate, revoke, verify | PARTIALLY IMPLEMENTED | `InstructorCertificates.jsx` | `/api/instructor/certificates/**` — **no instructor role check** | `certificates` | — |
| Instructor | AI Tools (question paper generator) | IMPLEMENTED | `InstructorAITools.jsx` (fully local generator) | `POST /api/exams` with `questionPaper` | `exams.question_paper` | ✅ client-side rule-based |
| Instructor | Coding practice management | IMPLEMENTED | `InstructorCodingPractice.jsx` | `/api/coding/admin/problems*` (**no admin role check**) | `coding_problems`, `coding_test_cases` | — |
| Instructor | Restricted to HOD-assigned courses | IMPLEMENTED | UI hides unassigned courses | `InstructorAccessService.requireCourseManage` | `instructor_course_assignments` | — |

## 10. HOD Functionality

| Module | Feature | Status | Frontend | Backend | Database | AI |
|---|---|---|---|---|---|---|
| HOD | Dashboard & analytics | IMPLEMENTED | `pages/hod/HODDashboard.jsx`, `HODAnalytics.jsx` | `GET /api/hod/dashboard` | aggregates | — |
| HOD | Assign instructors ↔ course/subject | IMPLEMENTED | `HODAssignments.jsx` | `POST/PUT/DELETE /api/hod/assignments*` | `instructor_course_assignments` | — |
| HOD | Assignment scoped by semester + academic year | IMPLEMENTED | `HODAssignments.jsx` (columns, filters) | `HODRequest.semesterId/academicYearId`, `HODAssignmentView.semesterNumber/academicYear` | `instructor_course_assignments.semester_id`, `.academic_year_id` | — |
| HOD | Academic years: list + create | IMPLEMENTED | `HODAssignments.jsx` drop-down/filter | `GET/POST /api/hod/academic-years` (HOD); `GET /api/academic-years` (any signed-in user) | `academic_years` | — |
| HOD | Semesters drop-down per course | IMPLEMENTED | `HODAssignments.jsx` | `GET /api/hod/semesters?courseId=` | `semesters` | — |
| HOD | Courses & subjects view | IMPLEMENTED | `HODCoursesSubjects.jsx` | `GET /api/hod/courses`, `/hod/subjects` | `courses`, `subjects` | — |
| HOD | Students view | IMPLEMENTED | `HODStudents.jsx` | `GET /api/hod/students` | `users` | — |
| HOD | Divisions CRUD + assign/remove students | IMPLEMENTED | `HODDivisions.jsx` | `/api/hod/divisions*` (HOD **or** ADMIN) | `divisions`, `users.division_id` | — |
| HOD | Question bank | PARTIALLY IMPLEMENTED | `HODQuestions.jsx` | `GET /api/hod/questions` (see §8) | `questions` | ✅ (generate) |
| HOD | **Exam approvals (approve/reject with reason)** | IMPLEMENTED | `HODExamApprovals.jsx` | `POST /api/hod/exam-approvals/{id}/approve|reject` + `ExamApprovalService` | `exams` workflow columns | — |
| HOD | Announcements | IMPLEMENTED | `HODAnnouncements.jsx` | `GET/POST /api/hod/announcements` | `announcements` | — |
| HOD | HOD settings page | PARTIALLY IMPLEMENTED | `HODSettings.jsx` | uses profile endpoints | `users` | — |
| HOD | ADMIN access to HOD dashboard endpoints | PARTIALLY IMPLEMENTED | — | `requireHOD()` accepts **only** `Role.HOD` (divisions accept HOD or ADMIN) | — | — |

## 11. Admin Functionality

| Module | Feature | Status | Frontend | Backend | Database | AI |
|---|---|---|---|---|---|---|
| Admin | Dashboard KPIs | IMPLEMENTED | `pages/AdminDashboard.jsx` | `GET /api/admin/dashboard` | aggregates | — |
| Admin | User list / create / delete / role / activate / force-reset | IMPLEMENTED | `AdminTeachers.jsx`, `AdminStudents.jsx`, admin pages | `/api/admin/users/**` (ADMIN) | `users` | — |
| Admin | Course/subject/lesson CRUD | IMPLEMENTED | `AdminCourseManagement.jsx`, `AdminSubjects.jsx`, `AdminLessons.jsx` | `/api/admin/courses*`, `/admin/subjects*`, `/admin/lessons*` | `courses`, `subjects`, `lessons` | — |
| Admin | Semesters management | IMPLEMENTED | `AdminSemesters.jsx` | `GET/POST/PUT/DELETE` subjects per semester | `subjects.semester` | — |
| Admin | Quizzes / Exams / Assignments / Results / Progress views | IMPLEMENTED | `AdminQuizzes.jsx`, `AdminExams.jsx`, `AdminAssignments.jsx`, `AdminResults.jsx`, `AdminProgress.jsx` | `GET /api/quiz-attempts`, `/api/admin/*` | attempts, progress | — |
| Admin | Certificates & leaderboard | IMPLEMENTED | `AdminCertificates.jsx`, `AdminLeaderboard.jsx` | certificate + user endpoints | `certificates`, `users` | — |
| Admin | Announcements & discussions moderation | IMPLEMENTED | `AdminAnnouncements.jsx`, `AdminDiscussions.jsx` | discussion/announcement endpoints | `announcements`, `discussions` | — |
| Admin | Reports | IMPLEMENTED | `AdminReports.jsx` (report cards partly local) | `GET /api/admin/reports` | aggregates | — |
| Admin | Platform analytics | IMPLEMENTED | `AdminAnalytics.jsx` | `GET /api/analytics/admin` | aggregates | — |
| Admin | Resources management | IMPLEMENTED | `AdminResources.jsx` | `/api/resources/**` | `resources` | — |
| Admin | Settings | PARTIALLY IMPLEMENTED | `AdminSettings.jsx` (profile edit only) | `GET/PUT /api/profile` | `users` | — |
| Admin | **Audit logs** | NOT IMPLEMENTED | `AdminAuditLogs.jsx` renders a **hard-coded array** | no endpoint | no table | — |
| Admin | AI assistant / AI analytics / AI insights pages | PARTIALLY IMPLEMENTED | `AdminAIAssistant.jsx`, `AdminAIAnalytics.jsx`, `AdminAIInsights.jsx` | reuses `/api/ai/*`, `/api/analytics/admin` + local presentation logic | aggregates | ✅ rule-based |
| Admin | Override exam status | IMPLEMENTED | admin exam page | `PUT /api/exams/{id}/status` (ADMIN only) | `exams.status` | — |

## 12. Student Functionality

| Module | Feature | Status | Frontend | Backend | Database | AI |
|---|---|---|---|---|---|---|
| Student | Dashboard | IMPLEMENTED | `pages/Dashboard.jsx` | `GET /api/dashboard` | aggregates | — |
| Student | Course browsing / details / learning view | IMPLEMENTED | `Courses.jsx`, `CourseDetails.jsx`, `StudentLearning.jsx` | course + lesson + progress endpoints | `courses`, `lessons`, `progress` | — |
| Student | Quizzes & exams & assignments & attendance & discussions | IMPLEMENTED | `Quizzes.jsx`, `Exams.jsx`, `Assignments.jsx`, `Attendance.jsx`, `Discussions.jsx` | §6, §7, §13 | respective tables | — |
| Student | Profile edit & password change | IMPLEMENTED | `Profile.jsx`, `StudentSettings.jsx` | `GET/PUT /api/profile`, `PUT /api/profile/password` | `users` | — |
| Student | Coding arena + playground (offline fallback) | PARTIALLY IMPLEMENTED | `CodingArena.jsx`, `CodingPlayground.jsx`, `mockCodingData.js` | `/api/coding/**` — **simulated judge, not a real compiler** | `coding_*` | ✅ rule-based `ai-assist` |
| Student | Gamification (XP, levels, badges, streak, theme) | PARTIALLY IMPLEMENTED | `gamification.js`, `Leaderboard.jsx` — **localStorage only, never persisted** | none | none | — |
| Student | Flashcards | PARTIALLY IMPLEMENTED | `flashcards.js` — local only | none | none | — |
| Student | 3D campus tour / stats / badges / courses / classroom | IMPLEMENTED | `CampusTour.jsx`, `pages/three/*` | none (visual only) | none | — |
| Student | Leaderboard | PARTIALLY IMPLEMENTED | `Leaderboard.jsx` (local gamification + attempts) | quiz-attempt endpoints | `quiz_attempts` | — |

## 13. Reviews & Wishlist

| Module | Feature | Status | Frontend | Backend | Database | AI |
|---|---|---|---|---|---|---|
| Wishlist | Add / remove / list | IMPLEMENTED | `pages/Wishlist.jsx` | `POST|DELETE|GET /api/wishlist/{courseId}` | `wishlists` (unique user+course) | — |
| Reviews | Post rating + comment (1 per user per course) | IMPLEMENTED | `pages/CourseDetails.jsx` | `POST/GET /api/courses/{id}/reviews` | `reviews` (unique user+course) | — |

## 14. Certificates

| Module | Feature | Status | Frontend | Backend | Database | AI |
|---|---|---|---|---|---|---|
| Certificates | Student self-issue after 100 % lessons (+ notification) | IMPLEMENTED | `pages/Certificates.jsx`, `CertificateGenerator.jsx` | `POST /api/certificates/course/{courseId}` | `certificates`, `notifications` | — |
| Certificates | List + public verification | IMPLEMENTED | `Certificates.jsx` | `GET /api/certificates`, `/certificates/verify/{id}` | `certificates` | — |
| Certificates | Instructor generate / revoke / eligibility / stats | PARTIALLY IMPLEMENTED | `InstructorCertificates.jsx` | `/api/instructor/certificates/**` — no role check | `certificates` | — |

## 15. Notifications

| Module | Feature | Status | Frontend | Backend | Database | AI |
|---|---|---|---|---|---|---|
| Notifications | In-app list + unread badge + mark read | IMPLEMENTED | `pages/Notifications.jsx`, header badge | `GET /api/notifications`, `PUT /{id}/read` | `notifications` | — |
| Notifications | Learning reminders | IMPLEMENTED | `Notifications.jsx` | `POST /api/notifications/reminders` | `notifications` | — |
| Notifications | Certificate-issued notification | IMPLEMENTED | — | `AdvancedFeatureController` (certificate flow) | `notifications` | — |
| Notifications | Email / push / WebSocket / scheduler | NOT IMPLEMENTED | — | no mail sender, no WS, no job | — | — |

## 16. Analytics

| Module | Feature | Status | Frontend | Backend | Database | AI |
|---|---|---|---|---|---|---|
| Analytics | Student analytics | IMPLEMENTED | `pages/Analytics.jsx` | `GET /api/analytics/student` | `quiz_attempts`, `progress`, `enrollments` | ✅ aggregates presented as AI |
| Analytics | Course analytics | IMPLEMENTED | instructor analytics page | `GET /api/analytics/course/{courseId}` (INSTRUCTOR/ADMIN) | aggregates | — |
| Analytics | Admin analytics | IMPLEMENTED | `AdminAnalytics.jsx` | `GET /api/analytics/admin` (ADMIN) | aggregates | — |

## 17. AI features

| Module | Feature | Status | Frontend | Backend | Database | AI |
|---|---|---|---|---|---|---|
| AI | AI Study Assistant (chat-style Q&A) | IMPLEMENTED | `pages/AIAssistant.jsx` | `POST /api/ai/study-assistant` | — | ✅ **keyword knowledge base (`mode:"simple-ai"`) by default; external OpenAI-compatible LLM (`mode:"ai"`) when `app.ai.api-key` is set** |
| AI | AI Question Generator (server) | IMPLEMENTED | `AIAssistant.jsx` | `POST /api/ai/generate-questions` → `AIQuestionService` | — | ✅ **curated bank + string templates** |
| AI | AI Question Generator (browser fallback) | IMPLEMENTED | `src/ai-question-engine.js` | — | — | ✅ rule-based |
| AI | HOD AI question generation (persists) | IMPLEMENTED | `HODQuestions.jsx` | `POST /api/hod/questions/generate` | `questions` | ✅ rule-based |
| AI | AI course recommendations | IMPLEMENTED | `Analytics.jsx` | `GET /api/ai/recommendations` | `courses`, `enrollments`, `quiz_attempts` | ✅ keyword ranking |
| AI | AI weak-topic detection | IMPLEMENTED | `Analytics.jsx` | `GET /api/ai/weak-topics` | `quiz_attempts` | ✅ `< 60 %` rule |
| AI | AI learning path | IMPLEMENTED | `pages/LearningPath.jsx` | `GET /api/ai/learning-path` | `progress`, `enrollments`, `courses` | ✅ completion rule |
| AI | AI quiz recommendations | IMPLEMENTED | `Analytics.jsx` | `GET /api/ai/quiz-recommendations` | `quiz_attempts` | ✅ derived |
| AI | Coding AI assist (hint/explain/complexity/debug) | IMPLEMENTED | `CodingPlayground.jsx` | `POST /api/coding/ai-assist` | `coding_problems.hints_json` | ✅ templates |
| AI | Instructor AI Tools (paper builder) | IMPLEMENTED | `InstructorAITools.jsx` (local) | `POST /api/exams` | `exams.question_paper` | ✅ client-side templates |
| AI | Python (FastAPI) AI micro-service | NOT IMPLEMENTED | footer text in `Dashboard.jsx` claims it | **no Python source, no `ai-service/` folder** | — | — |
| AI | TensorFlow / trained ML model | NOT IMPLEMENTED | mentioned inside answer text only | **no dependency, no model file** | — | — |
| AI | **External LLM mode for the study assistant** | IMPLEMENTED (off by default) | `AIAssistant.jsx` renders either mode | `POST /api/ai/study-assistant` → `AdvancedFeatureController.askFullAI()` (JDK `HttpClient`, OpenAI-compatible `/chat/completions`) when `app.ai.api-key` is set; committed config leaves it commented out | — (no table) | ✅ `mode:"ai"` vs `mode:"simple-ai"` |
| AI | **Voice assistant / speech input** | NOT IMPLEMENTED | no mic/speech code | no token endpoint | — | — |
| AI | AI-generated feedback on submissions | NOT FOUND | — | — | — | — |

## 18. Other implemented modules

| Module | Feature | Status | Frontend | Backend | Database | AI |
|---|---|---|---|---|---|---|
| Assignments | Student submit (text/file) + instructor grade | IMPLEMENTED | `Assignments.jsx`, instructor pages | `POST /api/assignments/{id}/submit`, `PUT /submissions/{id}/grade` (**no course check on grading**) | `assignment_submissions` | — |
| Attendance | Mark + read (per course/date/subject) | IMPLEMENTED | `Attendance.jsx`, `InstructorAttendance.jsx` | `/api/attendance/**` | `attendance` | — |
| Resources | Upload / download / list / filter by type & category | IMPLEMENTED | `InstructorResources.jsx`, `AdminResources.jsx` | `/api/resources/**` | `resources` + `uploads/` | — |
| Discussions | Threads, replies, likes, "solve", teacher response flag | IMPLEMENTED | `Discussions.jsx` | `/api/discussions/**` | `discussions`, `discussion_replies` | — |
| Announcements | HOD posts, admin views | IMPLEMENTED | `HODAnnouncements.jsx`, `AdminAnnouncements.jsx` | `POST /api/hod/announcements` | `announcements` | — |
| Divisions | Sections with capacity + class teacher | IMPLEMENTED | `HODDivisions.jsx` | `/api/hod/divisions*` | `divisions` | — |
| Coding arena | Problems, run/submit, stats, submissions, daily challenge | PARTIALLY IMPLEMENTED | `CodingArena.jsx`, `CodingPlayground.jsx` | `/api/coding/**` — **simulated/interpreted judge** | `coding_problems`, `coding_test_cases`, `coding_submissions` | ✅ `ai-assist` |
| PWA | Service worker + manifest | IMPLEMENTED | `public/sw.js`, `public/manifest.json` | — | — | — |
| Desktop | Electron wrapper | IMPLEMENTED | `electron/main.cjs`, `electron-builder` config | — | — | — |
| Mobile | Capacitor Android/iOS shell | IMPLEMENTED | `capacitor.config.json` | — | — | — |
| Testing | Backend JUnit tests (6 classes) | IMPLEMENTED | — | `backend/src/test/**` | — | — |
| Testing | Frontend unit tests (node:test) | IMPLEMENTED | `src/*.test.js`, `npm test` | — | — | — |
| Testing | Headless-browser audit scripts | IMPLEMENTED | `tests/*.mjs` (git-ignored) | — | — | — |
| CI/CD | GitHub Actions / pipeline | NOT FOUND | — | — | — | — |
| Deployment | Docker / Kubernetes / Procfile | NOT FOUND | — | — | — | — |

---

## 19. Distribution

Reading the matrix above (one row = one feature):

- **104 rows are `IMPLEMENTED`** — auth, roles, curriculum, enrolment,
  progress, quizzes, the exam approval workflow, HOD assignment/division/academic-structure
  management, admin user management, reviews, wishlist, certificates, in-app notifications,
  analytics, assignments, attendance, resources, discussions and the shell/packaging layers
  (plus the study assistant's optional external LLM mode, which is off in the committed config).
- **20 rows are `PARTIALLY IMPLEMENTED`** — question-bank metadata,
  certificate instructor endpoints (no role check), audit-logs page, admin/HOD settings pages,
  gamification/flashcards/leaderboard (localStorage only), the coding judge, and the
  client-side route guard.
- **8 rows are `NOT IMPLEMENTED`** — Python AI service, TensorFlow, voice assistant,
  non-MCQ persisted questions, email/push notifications, question approval,
  audit logging, exam-result history.
- **4 rows are `NOT FOUND`** — standalone question-bank entity, AI submission feedback,
  CI/CD, container deployment.
