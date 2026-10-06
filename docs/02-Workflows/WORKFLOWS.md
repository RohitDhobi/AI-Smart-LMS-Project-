# AI-Smart-LMS — Workflows

Every workflow below was traced through the actual source files named in each section.
Anything not backed by code is labelled **PLANNED / NOT IMPLEMENTED** or **PARTIALLY IMPLEMENTED**.

---

## 0. Master workflow (whole system)

```
                        AI-SMART-LMS
                              |
        +---------------------+---------------------+
        |                     |                     |
     STUDENT              INSTRUCTOR                ADMIN
        |                     |                     |
   Browse/Enrol          Create course          Manage users
        |                Lessons/Quizzes             |
   Study lessons         Assignments/Exams      Approve accounts
        |                     |                  Reports
   Track progress        Question paper             |
        |                     |                Course/Subject CRUD
   Quiz attempts         Submit for approval
        |                     |
   Published exams  <--- HOD approve/reject
        |                     |
   Results*             Publish to students
        |
   Certificate                  +
        |                       |
        +---------- AI ------------------+
                     |             |
                   Text         Question bank
             study-assistant    generate-questions
             (offline KB or     ai-assist (coding)
              optional external
              LLM when
              app.ai.api-key set)
             recommendations
             weak-topics
             learning-path

   * exam results are computed and returned but NOT persisted
```

---

## 1. Authentication workflows

### 1.1 Student registration — `POST /api/auth/register` (`AuthService.register`)

```mermaid
flowchart TD
    A[User fills Register form] --> B[POST /api/auth/register]
    B --> C{Email already exists?}
    C -->|yes| D[400: Email already registered]
    C -->|no| E{Phone valid?<br/>7-15 digits, digits + - space only (optional field)}
    E -->|invalid| F2[400 Invalid phone number]
    E -->|ok| E2{confirmPassword given?}
    E2 -->|mismatch| F[400: passwords do not match]
    E2 -->|ok| G{courseId given?}
    G -->|course missing| H[400: Course not found]
    G -->|ok/none| I["set Role = STUDENT<br/>(client role is IGNORED)"]
    I --> J[BCrypt encode password]
    J --> K[Save User]
    K --> L{enrolled in degree course?}
    L -->|yes| M[Save Enrollment row]
    M --> N[Generate JWT]
    L -->|no course| N
    N --> O[201 {token, user}]
```

**Key rule (verified):** public self-registration can **only** create `STUDENT` accounts.

### 1.2 Instructor self-signup — `POST /api/auth/register/instructor`

```mermaid
flowchart TD
    A[Instructor signs up] --> B{"phone valid? name / email present / password length >= 6?"}
    B -->|no| C[400 with message]
    B -->|yes| D{email free?}
    D -->|no| E[400 Email already registered]
    D -->|yes| F["create User<br/>role=INSTRUCTOR, active=false"]
    F --> G[201 'Registration pending admin approval']
    G --> H[Admin → Teachers → Activate]
    H --> I[active=true, instructor can log in]
```

No JWT is issued at signup because an inactive account cannot log in.

### 1.3 Login — `POST /api/auth/login`

```mermaid
sequenceDiagram
    actor U as User
    participant FE as React (Login.jsx / StaffLogin.jsx)
    participant API as AuthController → AuthService
    participant DB as MySQL

    U->>FE: email + password
    FE->>API: POST /api/auth/login
    API->>DB: findByEmail(email)
    DB-->>API: User (or none)
    alt user missing
        API-->>FE: 401 Invalid email or password
    else inactive
        API-->>FE: 401 Account is inactive
    else password mismatch
        API-->>FE: 401 Invalid email or password
    else ok
        API->>API: BCrypt.matches + JwtService.generateToken (24h)
        API-->>FE: 200 {message, token, user{role}}
        FE->>FE: localStorage.token / localStorage.user
        FE->>FE: navigate by role<br/>ADMIN→/admin  INSTRUCTOR→/instructor  HOD→/hod  else→/dashboard
    end
    U->>FE: next action
    FE->>API: any /api call with Bearer token
```

### 1.4 Per-request authentication (every protected call)

```mermaid
flowchart TD
    A["Request + Authorization: Bearer x"] --> B{Header present and Bearer?}
    B -->|no| Z[Continue unauthenticated → 401 JSON entry point]
    B -->|yes| C[JwtService.extractEmail token]
    C -->|bad/expired signature| D[SecurityContext cleared → 401]
    C -->|ok| E[UserRepository.findByEmail]
    E -->|not found| D
    E -->|found| F["Authority = ROLE_ + Role.name"]
    F --> G[Set SecurityContext authentication]
    G --> H{Endpoint rule}
    H -->|permitAll| I[Controller]
    H -->|authenticated| I
    H -->|otherwise| Z
    I --> J[Controller/Service role or course checks]
    J -->|fail| K[403 AccessDeniedException JSON]
    J -->|pass| L[Business logic → MySQL → JSON]
```

---

## 2. Student workflow

```mermaid
flowchart TD
    A[Register / Login] --> B[Student shell /dashboard<br/>GET /api/dashboard]
    B --> C[Browse &amp; search courses<br/>GET /api/courses/search, /filter, /categories]
    C --> D{Enrol}
    D --> E[POST /api/enrollments<br/>Enrollment row created]
    E --> F[Open course / subject<br/>GET /api/courses/:id, /subjects]
    F --> G[Study a lesson<br/>POST /api/progress/lesson/:id]
    G --> H[PUT /api/progress/lesson/:id<br/>progressPercentage / completed]
    H --> I[Progress feeds<br/>/api/continue-learning, /api/analytics/student]
    I --> J{Assessment}
    J --> K[Quiz: POST /api/quiz-attempts/submit<br/>graded + saved as QuizAttempt]
    J --> L[Exam: POST /api/exams/:id/submit<br/>graded in-slot, NOT saved]
    K --> M[Results &amp; history<br/>GET /api/quiz-attempts/my]
    L --> M
    M --> N[AI helpers<br/>/api/ai/weak-topics, recommendations, learning-path, study-assistant]
    N --> O{All lessons completed?}
    O -->|yes| P[POST /api/certificates/course/:id<br/>Certificate + Notification created]
    O -->|no| Q[Keep learning]
    P --> R[GET /api/certificates, /certificates/verify/:id]
```

### Supporting student features (all implemented)

| Feature | Endpoint(s) | Notes |
|---|---|---|
| Profile | `GET/PUT /api/profile`, `PUT /api/profile/password` | e-mail is the login identity |
| Wishlist | `POST/DELETE /api/wishlist/:courseId`, `GET /api/wishlist` | unique `(user_id, course_id)` |
| Reviews | `POST/GET /api/courses/:id/reviews` | one review per user per course |
| Notifications | `GET /api/notifications`, `PUT /api/notifications/:id/read` | in-app rows only — **no email/push** |
| Learning reminders | `POST /api/notifications/reminders` | creates a `Learning Reminder` per unfinished enrolment |
| Continue learning | `GET /api/continue-learning` | latest 10 incomplete `Progress` rows |
| Analytics | `GET /api/analytics/student` | aggregates own attempts/progress |
| Discussions | `/api/discussions/**` | threads, replies, likes, "solve" |
| Assignments | `GET /api/assignments/my`, `POST /api/assignments/:id/submit` | |
| Attendance | `GET /api/attendance/my` | |
| Certificates | `GET /api/certificates` | |
| Coding arena | `/api/coding/**` | simulated judge, offline mock fallback |
| Gamification (XP/badges/streak), flashcards, 3D pages | — | **client-side only**, stored in `localStorage` |

---

## 3. Instructor workflow

```mermaid
flowchart TD
    A[Signup / created by Admin] --> B{Active?}
    B -->|no| A
    B -->|yes| C[Login → /instructor dashboard<br/>GET /api/instructor/dashboard]
    C --> D[HOD assigns course/subject<br/>InstructorCourseAssignment ACTIVE]
    D --> E[Create course<br/>POST /api/instructor/courses]
    E --> F[Add subject lessons<br/>POST /api/instructor/subjects/:id/lessons]
    F --> G[Materials / assignments / attendance / quizzes]
    G --> H[Build quiz questions<br/>POST /api/questions/quiz/:quizId]
    H --> I[Create exam<br/>POST /api/exams]
    I --> J["status forced to DRAFT<br/>createdBy / createdByName recorded"]
    J --> K{Question paper source}
    K -->|AI Tools page| L["Browser generates paper locally<br/>(InstructorAITools.generateQuestions)"]
    L --> M["api.instructorCreateExam with<br/>questionPaper = JSON.stringify(paper)"]
    K -->|Manual| N[Edit exam via PUT /api/exams/:id<br/>allowed only in DRAFT/REJECTED]
    M --> O[POST /api/exams/:id/submit-for-approval]
    N --> O
    O --> P[PENDING_HOD_APPROVAL]
    P --> Q{HOD decision}
    Q -->|REJECTED + reason| R[Instructor sees HOD feedback]
    R --> S[Edit paper in DRAFT/REJECTED]
    S --> O
    Q -->|APPROVED| T[POST /api/exams/:id/publish]
    T --> U[PUBLISHED → visible to students]
```

### Rules enforced for instructors (`InstructorAccessService` + `ExamApprovalService`)

- Instructors may **view** every course but may **manage** only a course/subject with an `ACTIVE` assignment row → otherwise HTTP 403.
- Instructors may only submit/publish/delete **exams they created** (`createdBy`), legacy null-`createdBy` rows fall back to the course-assignment check.
- An exam cannot be edited while `PENDING_HOD_APPROVAL`, `APPROVED`, `PUBLISHED` or `COMPLETED`.
- A plain `PUT /api/exams/:id` cannot smuggle a status change; publishing requires `POST /:id/publish`.
- Certificates: `POST /api/instructor/certificates/generate`, `PUT /:id/revoke`, `GET /verify/:certId`, `GET /stats`.

---

## 4. HOD workflow

```mermaid
flowchart TD
    A[HOD logs in → /hod] --> B[GET /api/hod/dashboard]
    B --> B2[Academic structure<br/>GET /api/hod/semesters, /api/hod/academic-years<br/>POST /api/hod/academic-years]
    B2 --> C[Assign instructors<br/>POST /api/hod/assignments<br/>body: instructorId + courseId + optional<br/>subjectId, semesterId, academicYearId]
    C --> D[Manage divisions<br/>POST /api/hod/divisions, assign-students]
    D --> E[Manage students / subjects / courses<br/>GET /api/hod/students, /subjects, /courses]
    E --> F[Question bank<br/>GET /api/hod/questions]
    F --> G["AI generation<br/>POST /api/hod/questions/generate<br/>(persists when quizId given)"]
    F --> H[Announcements<br/>POST /api/hod/announcements]
    H --> I[Exam approvals]
    I --> J[GET /api/hod/exam-approvals?status=]
    J --> K[GET /api/hod/exam-approvals/:id<br/>full questionPaper]
    K --> L{Decision}
    L -->|Approve| M["POST .../approve<br/>status=APPROVED<br/>approvedBy/Name/At recorded"]
    L -->|Reject| N["POST .../reject<br/>reason REQUIRED<br/>status=REJECTED"]
    N --> O[Instructor edits &amp; resubmits]
    O --> J
    M --> P[Instructor publishes<br/>POST /api/exams/:id/publish]
    P --> Q[Students see the exam]
```

### The exact approval rules (`ExamApprovalService`, server-enforced)

| # | Rule | Implementation |
|---|---|---|
| 1 | Instructor must be assigned to the exam's course | `requireAssignedToExamCourse` → `InstructorAccessService.requireCourseManage` |
| 2 | Only the creator may submit/publish (staff bypass) | `requireOwnerOrStaff` |
| 3 | Publishing requires `APPROVED`, else **403** | `publish()` throws `AccessDeniedException(NOT_APPROVED_MESSAGE)` |
| 4 | Only HOD/ADMIN decide, only within their department | `requireApprover` + `requireDepartmentScope` (`departmentCourseId` = HOD's profile course) |
| 5 | Nobody approves their own exam | `requireNotSelfApproved` |
| 6 | Rejection reason is mandatory | `reject()` throws when blank |
| 7 | Admin may force any status | `overrideStatus()` (ADMIN only) — statuses DRAFT/PENDING_HOD_APPROVAL/REJECTED/APPROVED/PUBLISHED/COMPLETED |

`requireHOD()` guards most `/api/hod/**` routes; the division routes use `requireHODOrAdmin()`.
**Note:** `requireHOD()` accepts *only* `Role.HOD`, so an ADMIN cannot use the HOD dashboard endpoints (except divisions).

---

## 5. Exam lifecycle (every step verified in code)

```mermaid
flowchart TD
    A["Create exam<br/>POST /api/exams"] --> B["DRAFT<br/>(forced for instructors)"]
    B --> C["Add question paper<br/>- AI Tools upload → exam.questionPaper JSON<br/>- or edit via PUT /api/exams/:id"]
    C --> D["Submit for approval<br/>POST /api/exams/:id/submit-for-approval<br/>submittedAt = now, rejectionReason cleared"]
    D --> E["PENDING_HOD_APPROVAL<br/>(paper frozen: edits rejected)"]
    E --> F{"HOD review<br/>GET /api/hod/exam-approvals/:id"}
    F -->|Reject + reason| G["REJECTED"]
    G --> H["Instructor edits<br/>(allowed only in DRAFT / REJECTED)"]
    H --> D
    F -->|Approve| I["APPROVED<br/>approvedBy, approvedByName, approvedAt"]
    I --> J["Publish<br/>POST /api/exams/:id/publish<br/>publishedAt = now"]
    J --> K["PUBLISHED"]
    K --> L["Students: GET /api/exams<br/>unpublished statuses filtered out,<br/>questionPaper stripped outside its slot"]
    L --> M["Attempt<br/>POST /api/exams/:id/submit"]
    M --> N{"Inside startTime..endTime?"}
    N -->|no| O[400 This exam is not open right now]
    N -->|yes| P["Server grades against questionPaper JSON<br/>MCQ only; descriptive → pendingManual"]
    P --> Q["Result map returned<br/>awardedMarks, percentage, passed,<br/>correct, wrong, skipped, pendingManual"]
    Q --> R["⚠ NOT PERSISTED<br/>no exam-attempt entity exists<br/>— PARTIALLY IMPLEMENTED"]
```

Status constants: `DRAFT`, `PENDING_HOD_APPROVAL`, `REJECTED`, `APPROVED`, `PUBLISHED`, `COMPLETED`
(legacy `SCHEDULED` / `LIVE` still exist on old rows and are treated as visible to students).

**Visibility rule** (`ExamController.visibleToStudent`): students never see `DRAFT`,
`PENDING_HOD_APPROVAL`, `REJECTED` or `APPROVED` exams, and the answer key (`questionPaper`) is
stripped from every response unless the exam is inside its scheduled slot.

---

## 6. Question bank workflow

```mermaid
flowchart TD
    A["Instructor creates quiz<br/>POST /api/quizzes/course/:courseId"] --> B["Add questions<br/>POST /api/questions/quiz/:quizId<br/>(text + 4 options + correct answer + marks + order)"]
    A --> C["HOD AI generation<br/>POST /api/hod/questions/generate<br/>topic + count + optional quizId"]
    C -->|quizId given| D["Questions saved into that quiz<br/>via QuestionService.createQuestion"]
    C -->|no quizId| E["Generated list returned, NOT saved<br/>(preview only)"]
    B --> F["Question Bank view<br/>GET /api/hod/questions"]
    E --> F
    F --> G["Question belongs to Quiz → Course"]
    G --> H["Used by<br/>- Quiz attempts (graded from Question.correctAnswer)<br/>- Exam paper is separate (exam.questionPaper JSON)"]
```

**What is real vs. placeholder in the HOD question bank list:**

| Field in `GET /api/hod/questions` | Source |
|---|---|
| `id`, `question`, `title`, `marks` | real `Question` columns |
| `quizId`, `courseId`, `courseName` | real joins through `Question.quiz` |
| `type: "MCQ"` | **hard-coded** — the entity has no type column |
| `difficulty: "Medium"` | **hard-coded** — no difficulty column |
| `status: "ACTIVE"` | **hard-coded** — no status column |

So: **question creation, marks, ownership through the quiz's course, and course-manage
authorisation are IMPLEMENTED; question type / difficulty / approval status are
NOT IMPLEMENTED (placeholder literals).** There is no separate "question paper approval" entity —
the question paper is part of the Exam and goes through the **exam approval workflow** above.

**Question model (actual):** `questionText`, `optionA..optionD`, `correctAnswer`, `marks`,
`questionOrder`, FK `quiz_id` (NOT NULL). Question types supported at persistence level = MCQ only;
descriptive/1-liner/2-marker/3-marker/5-marker questions exist **only inside the JSON question
paper**, where `ExamService` counts them as `pendingManual` (human grading required).

---

## 7. Enrolment → progress → certificate

```mermaid
flowchart TD
    A[POST /api/enrollments] --> B[Enrollment row user×course]
    B --> C[Open lesson]
    C --> D["POST /api/progress/lesson/:id<br/>creates Progress (0%, startedAt)"]
    D --> E["PUT /api/progress/lesson/:id<br/>progressPercentage, completed, completedAt"]
    E --> F["GET /api/progress/my, /progress/course/:id"]
    F --> G["GET /api/continue-learning<br/>GET /api/analytics/student"]
    F --> H{"All lessons of the course completed?"}
    H -->|no| I["POST /api/certificates/course/:id<br/>→ 400 'Complete all lessons first'"]
    H -->|yes| J["Certificate created<br/>certificateId = CERT-XXXXXXXX<br/>+ Notification 'Course Completed'"]
    J --> K["Idempotent: existing cert returned instead of duplicated"]
    K --> L["GET /api/certificates, /api/certificates/verify/:id"]
    J --> M["Instructor side: eligibility, generate, revoke<br/>/api/instructor/certificates/**"]
```

---

## 8. Notification workflow — **PARTIALLY IMPLEMENTED**

```mermaid
flowchart TD
    A{Notification created by} --> B["Certificate issued<br/>(AdvancedFeatureController)"]
    A --> C["POST /api/notifications/reminders<br/>one row per unfinished enrolment"]
    A --> D["POST /api/notifications/test<br/>manual row"]
    B --> E[(notifications table)]
    C --> E
    D --> E
    E --> F["GET /api/notifications<br/>GET → count unread in header"]
    F --> G["PUT /api/notifications/:id/read"]
```

**Not present anywhere in the code:** email delivery, push/SSE/WebSocket, scheduled jobs,
notification creation on exam publication, on new assignment, on discussion reply, or on rejection.
Marked **PARTIALLY IMPLEMENTED** in FEATURE-MATRIX.md.

---

## 9. Admin workflow

```mermaid
flowchart TD
    A[Admin logs in → /admin] --> B[GET /api/admin/dashboard]
    B --> C[Users<br/>GET/POST /api/admin/users]
    C --> D["PUT /api/admin/users/:id/role<br/>(cannot demote yourself unless still ADMIN)"]
    C --> E["PUT /api/admin/users/:id/active<br/>activates pending instructors"]
    C --> F[PUT /:id/reset-password, DELETE /:id]
    B --> G[Courses &amp; subjects<br/>/api/admin/courses, /api/admin/subjects, /api/admin/lessons]
    G --> H["PUT /api/courses/:id/status?status=APPROVED<br/>course approval (ADMIN only)"]
    H --> I["GET /api/admin/pending-courses"]
    B --> J[Reports<br/>GET /api/admin/reports]
    B --> K[Analytics<br/>GET /api/analytics/admin]
    B --> L["Exam escape hatch<br/>PUT /api/exams/:id/status (ADMIN only)"]
    B --> M[Coding problems<br/>POST/PUT/DELETE /api/coding/admin/problems]
    B --> N[Panel pages: results, progress, certificates,<br/>leaderboard, announcements, discussions, roles,<br/>semesters, categories, resources, audit-logs, settings]
```

---

## 10. Frontend offline / error workflow (real code behaviour)

```mermaid
flowchart TD
    A[apiRequest] --> B{HTTP status}
    B -->|2xx| C[Return parsed JSON]
    B -->|401| D["Clear localStorage token+user<br/>redirect /login (except on auth pages)"]
    B -->|403| E[Throw server error message]
    B -->|other| F[Throw message / 'Request failed (status)']
    A --> G{fetch threw?}
    G -->|AbortError / TypeError| H["_backendDown = true<br/>(connectivity problem)"]
    H --> I["safeApiRequest → null<br/>page uses local/mock fallback"]
    H --> J["strictApiRequest → null only if already offline;<br/>real API errors still thrown"]
```

---

## 11. Workflows that are NOT implemented

| Workflow | Status | Evidence |
|---|---|---|
| Exam result history / student exam attempts table | **NOT IMPLEMENTED** | `ExamService.gradeSubmission` returns a `Map`, nothing is saved; no entity exists |
| Email delivery of password reset tokens | **NOT IMPLEMENTED** | `POST /api/auth/forgot-password` returns the token in the response body ("Demo mode") |
| Email / push notifications | **NOT IMPLEMENTED** | only `Notification` rows in MySQL |
| Question approval (separate from exam approval) | **NOT IMPLEMENTED** | questions have no status/approver fields |
| AI-generated feedback on submissions | **NOT IMPLEMENTED** | no such endpoint |
| Voice assistant / speech input | **NOT IMPLEMENTED** | no microphone or speech code anywhere |
| Python / FastAPI AI micro-service | **NOT IMPLEMENTED** | mentioned in a UI footer string only; no Python source in the repo |
