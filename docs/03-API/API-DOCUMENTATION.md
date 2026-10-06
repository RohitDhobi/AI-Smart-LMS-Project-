# AI-Smart-LMS — API Documentation

Extracted directly from the 19 `@RestController` classes (plus one `@RestControllerAdvice`) under
`backend/src/main/java/com/aismartlms/backend/controller/`.
No endpoint is listed here unless it exists in the source.

**Column meanings**

| Column | Meaning |
|---|---|
| **Auth** | `Public` = in `SecurityConfig`'s `permitAll` list · `JWT` = any valid Bearer token required (`anyRequest().authenticated()`) |
| **Role / rule** | The check actually performed **inside the controller or service**. "JWT only" means *no role check exists* for that endpoint. |

**Global rule:** everything not listed as `Public` requires `Authorization: Bearer <JWT>`.
Missing/invalid token → **401** `{"error":"Unauthorized. Please login again."}`
Authenticated but forbidden → **403** `{"error":"Access denied. You don't have permission."}`
Business errors → **400** `{"error":"<message>"}` (via `ApiExceptionHandler`).

---

## 1. Authentication — `/api/auth` (`AuthController` + `AdvancedFeatureController`)

| Method | Endpoint | Purpose | Auth | Role / rule |
|---|---|---|---|---|
| POST | `/api/auth/register` | Self-register (role forced to `STUDENT`) + auto-enrol + JWT | Public | — |
| POST | `/api/auth/register/instructor` | Instructor self-signup → created **inactive**, no token | Public | — |
| POST | `/api/auth/login` | Verify credentials → JWT (24 h) + `user` object | Public | — |
| POST | `/api/auth/refresh` | Issue a fresh token for the current identity | JWT | Any |
| POST | `/api/auth/forgot-password` | Create `PasswordResetToken` (30 min) — **token returned in the body** | JWT ⚠ | Any |
| POST | `/api/auth/reset-password` | Consume token, BCrypt-save new password, delete token | JWT ⚠ | Any |

> ⚠ The two password endpoints are **not** in the `permitAll` list, so they can only be called
> with a valid JWT. Documented as an observation in SECURITY.md.

---

## 2. Users / Profile

| Method | Endpoint | Purpose | Auth | Role / rule |
|---|---|---|---|---|
| GET | `/api/user/profile` | Current user profile | JWT | Any |
| GET | `/api/profile` | Profile + role + course info | JWT | Any |
| PUT | `/api/profile` | Update own profile | JWT | Any |
| PUT | `/api/profile/password` | Change own password (BCrypt) | JWT | Any |
| PUT | `/api/instructor/profile` | Instructor profile update | JWT | INSTRUCTOR, ADMIN |
| PUT | `/api/instructor/profile/password` | Instructor password change | JWT | INSTRUCTOR, ADMIN |
| GET | `/api/instructor/users` | Users list for instructor panel | JWT | INSTRUCTOR, ADMIN |

---

## 3. Courses, Semesters, Subjects, Lessons

| Method | Endpoint | Purpose | Auth | Role / rule |
|---|---|---|---|---|
| GET | `/api/courses` | Full course catalogue | **Public** | — |
| GET | `/api/courses/{id}` | Course detail (incl. lessons/subjects) | JWT | Any |
| POST | `/api/courses` | Create course | **Public** ⚠ | **none** |
| PUT | `/api/courses/{id}` | Update course fields | JWT ⚠ | **none** |
| DELETE | `/api/courses/{id}` | Delete course | JWT ⚠ | **none** |
| GET | `/api/courses/search?keyword=` | Keyword search | JWT | Any |
| GET | `/api/courses/category/{category}` | Courses by category | JWT | Any |
| GET | `/api/courses/filter` | Filter by difficulty/category/max-price | JWT | Any |
| GET | `/api/categories` | Distinct categories | JWT | Any |
| PUT | `/api/courses/{id}/status?status=` | Approve/reject a course | JWT | **ADMIN** |
| GET | `/api/admin/pending-courses` | Courses awaiting approval | JWT | **ADMIN** |
| GET | `/api/courses/{courseId}/semesters` | Semester list of a degree | **Public** | — |
| GET | `/api/courses/{courseId}/subjects` | Subjects of a degree | **Public** | — |
| GET | `/api/courses/{courseId}/subjects/{semester}` | Subjects of one semester | **Public** | — |
| GET | `/api/subjects/{id}` | Subject detail | JWT | Any (detail restricted for students) |
| GET | `/api/academic-years` | Academic-year list (drives the "Academic Year" context on course/subject pages) | JWT | Any signed-in user |
| GET | `/api/admin/courses` | Admin course list | JWT | **ADMIN** |
| POST | `/api/admin/courses` | Create degree program | JWT | **ADMIN** |
| PUT | `/api/admin/courses/{id}` | Update degree program | JWT | **ADMIN** |
| DELETE | `/api/admin/courses/{id}` | Delete degree program | JWT | **ADMIN** |
| GET | `/api/admin/courses/{courseId}/students` | Students in a course | JWT | **ADMIN** |
| POST | `/api/admin/subjects` | Create subject | JWT | **ADMIN** |
| PUT | `/api/admin/subjects/{id}` | Update subject | JWT | **ADMIN** |
| DELETE | `/api/admin/subjects/{id}` | Delete subject | JWT | **ADMIN** |
| POST | `/api/admin/subjects/{subjectId}/lessons` | Add lesson | JWT | **ADMIN** |
| PUT | `/api/admin/lessons/{id}` | Update lesson | JWT | **ADMIN** |
| DELETE | `/api/admin/lessons/{id}` | Delete lesson | JWT | **ADMIN** |
| GET | `/api/instructor/courses` | Courses the instructor may manage | JWT | INSTRUCTOR, ADMIN |
| GET | `/api/instructor/courses/{id}` | One such course | JWT | INSTRUCTOR, ADMIN |
| POST | `/api/instructor/courses` | Instructor creates a course | JWT | INSTRUCTOR, ADMIN |
| GET | `/api/instructor/my-subjects` | Subjects assigned to the instructor | JWT | INSTRUCTOR, ADMIN |
| POST | `/api/instructor/subjects/{subjectId}/lessons` | Instructor adds a lesson | JWT | INSTRUCTOR, ADMIN (assignment check) |
| POST | `/api/instructor/assignments` | HOD/instructor course assignment helper | JWT | INSTRUCTOR, ADMIN |
| GET | `/api/students/me` | Own course/division info | JWT | Any |
| GET | `/api/students/me/subjects` | Own subjects | JWT | Any |

### Lessons — `/api/lessons` (`LessonController`)

| Method | Endpoint | Purpose | Auth | Role / rule |
|---|---|---|---|---|
| POST | `/api/lessons/course/{courseId}` | Create lesson | JWT | course-manage |
| GET | `/api/lessons` | All lessons | JWT | Any |
| GET | `/api/lessons/{id}` | Lesson detail | JWT | Any |
| GET | `/api/lessons/course/{courseId}` | Lessons of a course | JWT | Any |
| PUT | `/api/lessons/{id}` | Update lesson | JWT | subject/course-manage |
| DELETE | `/api/lessons/{id}` | Delete lesson | JWT | subject/course-manage |

> **course-manage** = `InstructorAccessService.requireCourseManage(courseId)` → allowed for
> `ADMIN`, `HOD`, and an `INSTRUCTOR` holding an **ACTIVE** `InstructorCourseAssignment` for that
> course (or a subject belonging to it). Students always get **403**.

---

## 4. Dashboard, Enrolment & Progress

| Method | Endpoint | Purpose | Auth | Role / rule |
|---|---|---|---|---|
| GET | `/api/dashboard` | Student dashboard KPIs (enrolments, completed courses, progress, attempts) | JWT | Any |
| POST | `/api/enrollments` | Enrol self in a course | JWT | Any |
| GET | `/api/enrollments/my` | Own enrolments | JWT | Any |
| POST | `/api/progress/lesson/{lessonId}` | Start a lesson (creates `Progress`) | JWT | Any |
| PUT | `/api/progress/lesson/{lessonId}` | Update % / completed | JWT | Any |
| GET | `/api/progress/my` | Own progress rows | JWT | Any |
| GET | `/api/progress/course/{courseId}` | Progress for one course | JWT | Any |
| GET | `/api/continue-learning` | Latest 10 unfinished lessons | JWT | Any |

---

## 5. Quizzes, Questions, Attempts

| Method | Endpoint | Purpose | Auth | Role / rule |
|---|---|---|---|---|
| GET | `/api/quizzes` | All quizzes | JWT | Any |
| GET | `/api/quizzes/{id}` | Quiz with questions | JWT | Any |
| GET | `/api/quizzes/course/{courseId}` | Quizzes of a course | JWT | Any |
| POST | `/api/quizzes/course/{courseId}` | Create quiz | JWT | course-manage |
| DELETE | `/api/quizzes/{id}` | Delete quiz | JWT | course-manage |
| GET | `/api/questions` | All questions | JWT | Any |
| GET | `/api/questions/{id}` | Question detail | JWT | Any |
| GET | `/api/questions/quiz/{quizId}` | Questions of a quiz | JWT | Any |
| POST | `/api/questions/quiz/{quizId}` | Create question | JWT | course-manage (quiz's course) |
| PUT | `/api/questions/{id}` | Update question | JWT | course-manage |
| DELETE | `/api/questions/{id}` | Delete question | JWT | course-manage |
| POST | `/api/quiz-attempts/submit` | Submit answers → graded + persisted | JWT | Any |
| GET | `/api/quiz-attempts` | All attempts | JWT | Any |
| GET | `/api/quiz-attempts/quiz/{quizId}` | Attempts of a quiz | JWT | Any |
| GET | `/api/quiz-attempts/{id}` | One attempt | JWT | Any |
| GET | `/api/quiz-attempts/my` | Own attempt history | JWT | Any |

---

## 6. Exams — `/api/exams` (`ExamController`)

| Method | Endpoint | Purpose | Auth | Role / rule |
|---|---|---|---|---|
| GET | `/api/exams` | List exams (students: only published; paper stripped outside slot) | JWT | Any |
| GET | `/api/exams/mine` | "My Exams" (creator; staff see all) | JWT | Any authenticated |
| GET | `/api/exams/{id}` | Exam detail | JWT | Any |
| GET | `/api/exams/course/{courseId}` | Exams of a course | JWT | Any |
| POST | `/api/exams` | Create exam | JWT | course-manage; instructors forced to `DRAFT` + `createdBy` set |
| PUT | `/api/exams/{id}` | Update exam | JWT | course-manage + status restrictions (DRAFT/REJECTED only for instructors) |
| DELETE | `/api/exams/{id}` | Delete exam | JWT | course-manage + creator-only for instructors |
| POST | `/api/exams/{id}/submit-for-approval` | `DRAFT`/`REJECTED` → `PENDING_HOD_APPROVAL` | JWT | creator or staff, assigned course |
| POST | `/api/exams/{id}/publish` | `APPROVED` → `PUBLISHED` (403 otherwise) | JWT | creator or staff, assigned course |
| PUT | `/api/exams/{id}/status` | Force any workflow status | JWT | **ADMIN only** |
| POST | `/api/exams/{id}/submit` | Student sits the paper (graded in-slot) | JWT | student; exam must be published + within `startTime..endTime` |

---

## 7. HOD — `/api/hod` (`HODController`)

| Method | Endpoint | Purpose | Auth | Role / rule |
|---|---|---|---|---|
| GET | `/api/hod/dashboard` | HOD dashboard KPIs | JWT | **HOD** |
| GET | `/api/hod/assignments` | Instructor assignments | JWT | **HOD** |
| GET | `/api/hod/assignments/instructor/{instructorId}` | Assignments of one instructor | JWT | **HOD** |
| GET | `/api/hod/assignments/course/{courseId}` | Assignments of one course | JWT | **HOD** |
| POST | `/api/hod/assignments` | Assign instructor ↔ course/subject; body `HODRequest` also takes `semesterId`, `academicYearId` (missing year defaults to the active `academic_years` row) | JWT | **HOD** |
| PUT | `/api/hod/assignments/{id}` | Update assignment (same body) | JWT | **HOD** |
| DELETE | `/api/hod/assignments/{id}` | Remove assignment | JWT | **HOD** |
| DELETE | `/api/hod/assignments/instructor/{i}/subject/{s}` | Remove assignment by pair | JWT | **HOD** |
| GET | `/api/hod/courses` | Courses in department | JWT | **HOD** |
| GET | `/api/hod/subjects` | Subjects | JWT | **HOD** |
| GET | `/api/hod/instructors` | Instructors | JWT | **HOD** |
| GET | `/api/hod/students` | Students | JWT | **HOD** |
| GET | `/api/hod/questions` | **Question bank** listing | JWT | **HOD** |
| POST | `/api/hod/questions/generate` | **AI question generation** (persists when `quizId` given) | JWT | **HOD** |
| GET | `/api/hod/exams` | All exams (HOD view) | JWT | **HOD** |
| GET | `/api/hod/exam-approvals?status=` | Approval queue (department-scoped) | JWT | **HOD** |
| GET | `/api/hod/exam-approvals/{id}` | Full review incl. `questionPaper` | JWT | **HOD** + department scope |
| POST | `/api/hod/exam-approvals/{id}/approve` | `PENDING_HOD_APPROVAL` → `APPROVED` | JWT | **HOD** + scope + not self |
| POST | `/api/hod/exam-approvals/{id}/reject` | → `REJECTED`, `reason` mandatory | JWT | **HOD** + scope + not self |
| GET | `/api/hod/semesters?courseId=` | Semester drop-down for the instructor-assignment form | JWT | **HOD** |
| GET | `/api/hod/academic-years` | Academic-year drop-down + search filter | JWT | **HOD** |
| POST | `/api/hod/academic-years` | Add an academic year, body `{ "yearName": "2027-2028", "active": false }` | JWT | **HOD** |
| GET | `/api/hod/announcements` | List announcements | JWT | **HOD** |
| POST | `/api/hod/announcements` | Post announcement | JWT | **HOD** |
| GET | `/api/hod/divisions` | List divisions | JWT | **HOD or ADMIN** |
| GET | `/api/hod/courses/{courseId}/divisions` | Divisions of a course | JWT | **HOD or ADMIN** |
| GET | `/api/hod/divisions/{id}` | Division detail | JWT | **HOD or ADMIN** |
| POST | `/api/hod/divisions` | Create division | JWT | **HOD or ADMIN** |
| PUT | `/api/hod/divisions/{id}` | Update division | JWT | **HOD or ADMIN** |
| DELETE | `/api/hod/divisions/{id}` | Delete division | JWT | **HOD or ADMIN** |
| POST | `/api/hod/divisions/{id}/assign-students` | Bulk assign students | JWT | **HOD or ADMIN** |
| POST | `/api/hod/divisions/{id}/remove-students` | Bulk remove students | JWT | **HOD or ADMIN** |
| POST | `/api/hod/divisions/{id}/assign-students/{studentId}` | Assign one student | JWT | **HOD or ADMIN** |

> `requireHOD()` accepts **only** `Role.HOD`; an ADMIN is rejected on these routes except divisions.

---

## 8. Instructor panel

| Method | Endpoint | Purpose | Auth | Role / rule |
|---|---|---|---|---|
| GET | `/api/instructor/dashboard` | Instructor KPIs | JWT | INSTRUCTOR, ADMIN |
| GET | `/api/analytics/course/{courseId}` | Per-course analytics | JWT | INSTRUCTOR, ADMIN |

### Instructor certificates — `/api/instructor/certificates`

| Method | Endpoint | Purpose | Auth | Role / rule |
|---|---|---|---|---|
| GET | `/stats` | Certificate statistics | JWT | **JWT only** ⚠ |
| GET | `/courses` | Courses to issue for | JWT | **JWT only** ⚠ |
| GET | `/course/{courseId}/students` | Students in course | JWT | **JWT only** ⚠ |
| GET | `/course/{courseId}/student/{studentId}/eligibility` | Eligibility check | JWT | **JWT only** ⚠ |
| POST | `/generate` | Issue a certificate for a student | JWT | **JWT only** ⚠ |
| PUT | `/{id}/revoke` | Revoke + reason | JWT | **JWT only** ⚠ |
| GET | `/verify/{certId}` | Verify by certificate id | JWT | **JWT only** ⚠ |
| GET | `/` | List certificates | JWT | **JWT only** ⚠ |

---

## 9. Admin — `/api/admin`

| Method | Endpoint | Purpose | Auth | Role / rule |
|---|---|---|---|---|
| GET | `/api/admin/dashboard` | Admin KPIs (students/instructors counts) | JWT | **ADMIN** |
| GET | `/api/admin/users` | All users | JWT | **ADMIN** |
| POST | `/api/admin/users` | Create staff account (role forced to INSTRUCTOR) | JWT | **ADMIN** |
| PUT | `/api/admin/users/{id}/role` | Change role (self-demotion guarded) | JWT | **ADMIN** |
| PUT | `/api/admin/users/{id}/active` | Activate/deactivate (approves instructors) | JWT | **ADMIN** |
| DELETE | `/api/admin/users/{id}` | Delete user | JWT | **ADMIN** |
| PUT | `/api/admin/users/{id}/reset-password` | Force-reset a password | JWT | **ADMIN** |
| GET | `/api/admin/reports` | Platform report | JWT | **ADMIN** |
| GET | `/api/analytics/admin` | Admin analytics | JWT | **ADMIN** |

---

## 10. AI — `/api/ai` + AI-adjacent endpoints

| Method | Endpoint | Purpose | Auth | Role / rule |
|---|---|---|---|---|
| GET | `/api/ai/recommendations` | 5 un-enrolled approved courses ranked by keyword signal | JWT | Any |
| GET | `/api/ai/weak-topics` | Quiz attempts with `< 60 %` | JWT | Any |
| GET | `/api/ai/learning-path` | Approved courses marked COMPLETED / RECOMMENDED | JWT | Any |
| GET | `/api/ai/quiz-recommendations` | Derived from weak topics | JWT | Any |
| POST | `/api/ai/study-assistant` | Answer a question: external OpenAI-compatible model when `app.ai.api-key` is set (`mode:"ai"`), otherwise the built-in keyword knowledge base (`mode:"simple-ai"`) | JWT | Any |
| POST | `/api/ai/generate-questions` | Curated + algorithmic MCQ generation (max 200) | JWT | Any |
| POST | `/api/hod/questions/generate` | Same engine; persists into a quiz when `quizId` supplied | JWT | **HOD** |
| POST | `/api/coding/ai-assist` | Hint/analysis text for a coding problem | JWT | Any |

> **External AI call:** only `POST /api/ai/study-assistant` can call outside the system. When
> `app.ai.api-key` is configured in `application.properties`, the controller POSTs to an
> OpenAI-compatible `/chat/completions` endpoint (JDK `HttpClient`, 25 s timeout) and returns
> `mode:"ai"`; with the committed config (all `app.ai.*` lines commented out) — and on any
> failure — it uses the built-in offline knowledge base and returns `mode:"simple-ai"`.
> See AI-ARCHITECTURE.md.

---

## 11. Analytics

| Method | Endpoint | Purpose | Auth | Role / rule |
|---|---|---|---|---|
| GET | `/api/analytics/student` | Own quiz/progress analytics | JWT | Any |
| GET | `/api/analytics/course/{courseId}` | Course analytics | JWT | INSTRUCTOR, ADMIN |
| GET | `/api/analytics/admin` | Platform analytics | JWT | **ADMIN** |

---

## 12. Notifications, Certificates, Wishlist & Reviews

| Method | Endpoint | Purpose | Auth | Role / rule |
|---|---|---|---|---|
| GET | `/api/notifications` | Own notifications | JWT | Any |
| PUT | `/api/notifications/{id}/read` | Mark read | JWT | Any |
| POST | `/api/notifications/reminders` | Create reminders for unfinished courses | JWT | Any |
| POST | `/api/notifications/test` | Create an arbitrary notification for self | JWT | Any |
| POST | `/api/certificates/course/{courseId}` | Self-issue after 100 % completion (+ notification) | JWT | Any enrolled student |
| GET | `/api/certificates` | Own certificates | JWT | Any |
| GET | `/api/certificates/verify/{id}` | Verify a certificate | JWT | Any |

### Wishlist & Reviews — `/api/wishlist`, `/api/courses/{courseId}/reviews`

| Method | Endpoint | Purpose | Auth | Role / rule |
|---|---|---|---|---|
| POST | `/api/wishlist/{courseId}` | Save a course (idempotent; unique user+course row) | JWT | Any |
| DELETE | `/api/wishlist/{courseId}` | Remove a saved course | JWT | Any |
| GET | `/api/wishlist` | Own wishlist (`courseId`, `title`, `category`) | JWT | Any |
| POST | `/api/courses/{courseId}/reviews` | Post/update own rating (1–5, clamped) + comment; **enrolment in the course required** (`400 "Enroll in course first"`); upserts the single user+course row | JWT | Any enrolled student |
| GET | `/api/courses/{courseId}/reviews` | Course reviews + average rating | JWT | Any |

---

## 13. Assignments, Attendance, Resources, Discussions

### Assignments — `/api/assignments`

| Method | Endpoint | Purpose | Auth | Role / rule |
|---|---|---|---|---|
| GET | `/api/assignments` | All | JWT | Any |
| GET | `/api/assignments/{id}` | Detail | JWT | Any |
| GET | `/api/assignments/course/{courseId}` | By course | JWT | Any |
| GET | `/api/assignments/my` | Own submissions | JWT | Any |
| POST | `/api/assignments` | Create | JWT | course-manage |
| PUT | `/api/assignments/{id}` | Update | JWT | course-manage |
| DELETE | `/api/assignments/{id}` | Delete | JWT | course-manage |
| POST | `/api/assignments/{id}/submit` | Student submits text/file | JWT | Any |
| GET | `/api/assignments/{id}/submissions` | Submissions of an assignment | JWT | course-manage |
| PUT | `/api/assignments/submissions/{submissionId}/grade` | Grade a submission | JWT ⚠ | **none** |

### Attendance — `/api/attendance`

| Method | Endpoint | Purpose | Auth | Role / rule |
|---|---|---|---|---|
| POST | `/api/attendance` | Mark attendance | JWT | course-manage |
| GET | `/api/attendance/my` | Own attendance | JWT | Any |
| GET | `/api/attendance/my/course/{courseId}` | Own, per course | JWT | Any |
| GET | `/api/attendance/course/{courseId}` | Course attendance | JWT | Any |
| GET | `/api/attendance/course/{courseId}/date/{date}` | By date | JWT | Any |

### Resources — `/api/resources`

| Method | Endpoint | Purpose | Auth | Role / rule |
|---|---|---|---|---|
| POST | `/api/resources/course/{courseId}` | Create resource metadata | JWT | course-manage |
| POST | `/api/resources/course/{courseId}/upload` | Multipart upload (≤ 50 MB → `uploads/resources`) | JWT | course-manage |
| GET | `/api/resources` | All | JWT | Any |
| GET | `/api/resources/{id}` | Detail | JWT | Any |
| GET | `/api/resources/course/{courseId}` | By course | JWT | Any |
| GET | `/api/resources/course/{courseId}/type/{type}` | By type | JWT | Any |
| GET | `/api/resources/course/{courseId}/category/{category}` | By category | JWT | Any |
| GET | `/api/resources/course/{courseId}/count` | Count | JWT | Any |
| PUT | `/api/resources/{id}` | Update | JWT | course-manage |
| DELETE | `/api/resources/{id}` | Delete | JWT | course-manage |
| GET | `/api/resources/{id}/download` | Download file | JWT | Any |
| POST | `/api/resources/{id}/download` | Register a download | JWT | Any |

### Discussions — `/api/discussions`

| Method | Endpoint | Purpose | Auth | Role / rule |
|---|---|---|---|---|
| GET | `/api/discussions` | All threads | JWT | Any |
| GET | `/api/discussions/{id}` | Thread | JWT | Any |
| GET | `/api/discussions/course/{courseId}` | By course | JWT | Any |
| GET | `/api/discussions/{id}/replies` | Replies | JWT | Any |
| POST | `/api/discussions` | Create thread | JWT | Any |
| POST | `/api/discussions/{id}/replies` | Reply (marks teacher response for INSTRUCTOR/ADMIN) | JWT | Any |
| PUT | `/api/discussions/{id}/solve` | Toggle solved | JWT ⚠ | **none** |
| PUT | `/api/discussions/{id}/like` | Toggle like | JWT ⚠ | **none** |

---

## 14. Coding practice — `/api/coding`

| Method | Endpoint | Purpose | Auth | Role / rule |
|---|---|---|---|---|
| GET | `/api/coding/problems` | Problem list | JWT | Any |
| GET | `/api/coding/problems/{id}` | Problem detail | JWT | Any |
| GET | `/api/coding/problems/slug/{slug}` | By slug | JWT | Any |
| GET | `/api/coding/problems/daily` | Problem of the day | JWT | Any |
| GET | `/api/coding/stats` | User stats | JWT | Any |
| POST | `/api/coding/run` | Run against sample tests | JWT | Any |
| POST | `/api/coding/submit` | Submit → judged + stored | JWT | Any |
| GET | `/api/coding/submissions` | Own submissions | JWT | Any |
| GET | `/api/coding/submissions/problem/{id}` | Submissions for a problem | JWT | Any |
| POST | `/api/coding/ai-assist` | Rule-based hint/analysis | JWT | Any |
| POST | `/api/coding/admin/problems` | Create problem + test cases | JWT ⚠ | **none (path says "admin")** |
| PUT | `/api/coding/admin/problems/{id}` | Update problem | JWT ⚠ | **none** |
| DELETE | `/api/coding/admin/problems/{id}` | Delete problem | JWT ⚠ | **none** |

> The judge is a **simulated/interpreted** runner inside `CodingPracticeService` — not a real
> compiler sandbox. Marked PARTIALLY IMPLEMENTED in FEATURE-MATRIX.md.

---

## 15. Actuator

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| * | `/actuator/**` | Spring Boot actuator endpoints | **Public** |

---

## 16. Endpoints with ⚠ (no role check beyond "authenticated")

Recorded here for transparency — **documented, not changed**, per the request:

1. `POST/PUT/DELETE /api/courses` — `CourseController` performs no role check; additionally
   `POST`/`GET /api/courses` are **public** because they match the `permitAll` pattern `/api/courses`.
2. `PUT /api/assignments/submissions/{id}/grade` — any authenticated user can grade.
3. `/api/instructor/certificates/**` — no instructor role check.
4. `POST/PUT/DELETE /api/coding/admin/problems*` — no admin role check.
5. `PUT /api/discussions/{id}/solve` and `/like` — no ownership check.
6. `POST /api/auth/forgot-password` and `/reset-password` — reachable only *with* a JWT.

See [SECURITY.md](../06-Security/SECURITY.md) → *Security Observations*.
