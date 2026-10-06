# AI-Smart-LMS — Project Structure

Actual repository layout, produced by listing the working tree. Folders that are generated
(`node_modules/`, `dist/`, `release/`, `backend/target/`, caches) are marked **build output** and
summarised instead of expanded.

---

## 1. Top level

```
AI-Smart-LMS/
│
├── index.html                 # Vite entry HTML (mounts /src/main.jsx)
├── vite.config.js             # port 5173, ELECTRON base-path switch, React plugin
├── package.json               # frontend deps + scripts + electron-builder config
├── package-lock.json
├── capacitor.config.json      # Android/iOS shell (appId com.aismartlms.app, webDir dist)
│
├── README.md                  # frontend README (existing — NOT overwritten)
├── PROJECT.md                 # existing overview document
├── AI-Smart-LMS-Complete-Project-Details.md   # original product spec
├── FEATURE_COMPARISON_REPORT.md               # existing report
│
├── docs/                      # ★ ALL PROJECT DOCUMENTATION lives here
│   ├── README.md              # documentation index
│   ├── 01-Project-Overview/   # ARCHITECTURE, PROJECT-STRUCTURE, FEATURE-MATRIX
│   ├── 02-Workflows/          # WORKFLOWS.md
│   ├── 03-API/                # API-DOCUMENTATION.md
│   ├── 04-Database/           # DATABASE-DESIGN.md
│   ├── 05-AI/                 # AI-ARCHITECTURE.md
│   └── 06-Security/           # SECURITY.md
│
├── seed-lessons.js            # helper script for lesson seeding
├── opencode.json              # local tool config (git-ignored)
├── tokenra-key.txt            # local key file — git-ignored, never committed
│
├── src/                       # ★ FRONTEND SOURCE
├── public/                    # PWA manifest, service worker, icons
├── electron/                  # Electron desktop wrapper
├── scripts/                   # auto-push + MCQ parse test helper
├── tests/                     # headless-browser audit/walkthrough scripts (git-ignored)
├── uploads/                   # uploaded resource files (git-ignored)
│
├── backend/                   # ★ SPRING BOOT BACKEND
├── .github/modernize/         # static-assessment tool output (NO CI workflows)
├── .vscode/, .freebuff/       # editor / tool state
├── dist/, release/, .electron-cache/, electron-cache/   # build output
└── node_modules/              # build output
```

---

## 2. Frontend — `src/`

```
src/
├── main.jsx                   # ReactDOM mount, AppErrorBoundary, CSS order, service-worker registration
├── App.jsx                    # ★ ALL routes; four role layouts; also contains an unused Layout component
├── App.jsx.head               # leftover header fragment of App.jsx (import list) — not imported at runtime
│
├── api.js                     # ★ the single API layer: fetch + JWT + 401/403 + offline detection
├── api.test.js                # node:test unit tests for api.js
├── ui.jsx                     # getStoredUser, Protected (route guard), Page, Loading, Empty, formatTime
│
├── gamification.js            # local XP / levels / achievements / streak / badges / theme
├── flashcards.js              # local spaced-repetition flashcard store
├── dashboard.js               # dashboard empty-state helper (+ dashboard.test.js)
├── highlight.js               # keyword highlight segments (+ highlight.test.js)
├── ai-question-engine.js      # ★ local rule-based question generator (offline fallback)
├── mockCodingData.js          # offline coding problems/stats/categories
│
├── styles.css                 # main stylesheet (loaded first)
├── styles.css.bak             # backup of the stylesheet
├── hod.css                    # HOD/admin panel stylesheet (loaded second)
├── roles-append.css           # role badge styles
│
├── components/
│   ├── student/               # StudentLayout, StudentSidebar, StudentMobileHeader, studentMenuConfig
│   ├── hod/                   # HODLayout, HODSidebar, AdminSidebarSection (HOD variant)
│   ├── admin/                 # AdminLayout, AdminSidebar(+Item/Section), AdminMobileHeader, adminMenuConfig
│   ├── CommandPalette.jsx     # ⌘K palette
│   ├── Toast.jsx              # toast provider
│   ├── CertificateGenerator.jsx
│   ├── ProgressRing.jsx, LearningHeatmap.jsx
│   ├── StudyPlanner.jsx, StudyStreak.jsx
│
├── pages/                     # ★ STUDENT PANEL + shared pages
│   ├── Login.jsx, Register.jsx, StaffLogin.jsx      # auth (role tabs on StaffLogin)
│   ├── Dashboard.jsx, Courses.jsx, CourseDetails.jsx, StudentLearning.jsx, SubjectLearning.jsx
│   ├── Quizzes.jsx, QuizHistory.jsx, Exams.jsx, Assignments.jsx, Attendance.jsx
│   ├── Analytics.jsx, Certificates.jsx, Notifications.jsx, Wishlist.jsx, Profile.jsx, StudentSettings.jsx
│   ├── Discussions.jsx, Leaderboard.jsx, LearningPath.jsx, AIAssistant.jsx
│   ├── CodingArena.jsx, CodingPlayground.jsx
│   ├── CampusTour.jsx
│   ├── AdminDashboard.jsx, AdminCourseManagement.jsx, AdminTeachers.jsx, AdminStudents.jsx
│   ├── InstructorDashboard.jsx
│   │
│   ├── instructor/            # ★ INSTRUCTOR PANEL (22 files: InstructorLayout + screens incl. InstructorAITools)
│   ├── hod/                   # ★ HOD PANEL (dashboard, assignments, courses/subjects, divisions,
│   │                          #    students, questions, exams, exam-approvals, announcements, analytics, settings)
│   ├── admin/                 # ★ ADMIN PANEL (23 pages incl. AdminAIAssistant/Analytics/Insights; 4 more admin
│   │                          #    screens live directly in pages/: AdminDashboard, AdminCourseManagement,
│   │                          #    AdminTeachers, AdminStudents)
│   └── three/                 # 3D scenes: Stats3D, Badges3D, CourseCards3D, Classroom3D
│
└── utils/
    ├── confetti.js            # celebration effects (canvas-confetti)
    └── phone.js               # shared phone-number validation (mirrors backend PhoneValidator)
```

**Purpose of the important frontend folders**

| Folder | Purpose |
|---|---|
| `src/` (root files) | App bootstrap, routing, API layer, local-only feature modules |
| `src/components/{student,hod,admin}` | The role **shells** (sidebar + header + `<Outlet>`) |
| `src/pages/` | Student-facing screens |
| `src/pages/instructor/` | Instructor panel screens |
| `src/pages/hod/` | HOD panel screens — including `HODExamApprovals.jsx` and `HODQuestions.jsx` |
| `src/pages/admin/` | Admin panel screens |
| `src/pages/three/` | three.js showcase scenes (lazy-loaded with `React.Suspense`) |

---

## 3. Backend — `backend/`

```
backend/
├── pom.xml                    # Spring Boot 2.7.18 parent, Java 21, deps (see ARCHITECTURE.md §1)
├── mvnw, mvnw.cmd, .mvn/      # Maven wrapper
├── run.bat                    # Windows shortcut → mvnw.cmd spring-boot:run
├── README.md, HELP.md         # existing backend docs (NOT overwritten)
├── API_TESTING.md, FEATURE_CHECKLIST.md
│
├── database/setup.sql         # CREATE DATABASE ai_smart_lms + seeder documentation
├── uploads/                   # server-side uploaded files
├── target/                    # build output
│
└── src/
    ├── main/
    │   ├── java/com/aismartlms/backend/
│   │   ├── BackendApplication.java        # Spring Boot entry point
│   │   ├── config/DataSeeder.java         # CommandLineRunner: seeds degrees/subjects/lessons/users/
│   │   │                                 #   divisions/assignments + semesters + academic years
│   │   ├── controller/                    # 19 @RestController classes + 1 @RestControllerAdvice
│   │   ├── dto/                           # request/response objects (AuthResponse, RegisterRequest,
│   │   │                                 #   HODRequest, HODAssignmentView, DivisionRequest/Response, ...)
│   │   ├── entity/                        # 29 JPA entities + Role enum
│   │   ├── exception/AccessDeniedException.java   # → HTTP 403
│   │   ├── repository/                    # 29 JpaRepository interfaces
│   │   ├── security/                      # SecurityConfig, JwtAuthenticationFilter, JwtService
│   │   ├── service/                       # 19 @Service classes (incl. AIQuestionService,
│   │   │                                 #   ExamApprovalService, HODService, InstructorAccessService)
│   │   └── util/PhoneValidator.java       # shared phone-number rule (mirrors src/utils/phone.js)
    │   └── resources/
    │       └── application.properties         # MySQL + port 8080 + JPA + upload config
    └── test/
        ├── java/.../BackendApplicationTests.java
        ├── java/.../controller/CourseSearchEndpointTest.java
        └── java/.../service/{ExamApprovalServiceTest, HODServiceAssignmentTest,
                              HODServiceDivisionTest, InstructorAccessServiceTest}.java
```

**Purpose of the important backend folders**

| Package | Purpose |
|---|---|
| `config/` | Startup behaviour — data seeding and a schema guard that widens a legacy `users.role` ENUM |
| `controller/` | HTTP surface only: bind input, call a service, map errors |
| `service/` | **All business rules**: auth, workflow state machines, grading, assignment checks, rule-based AI |
| `repository/` | Persistence queries (derived + `@Query` JPQL) |
| `entity/` | The database model |
| `dto/` | Payload contracts between React and Spring |
| `security/` | JWT creation/verification, the filter chain, CORS, BCrypt |
| `exception/` | One custom exception mapped to 403 by `ApiExceptionHandler` |

---

## 4. Supporting folders

| Path | Purpose | Committed? |
|---|---|---|
| `public/` | `manifest.json` (PWA), `sw.js` (service worker), `icons/` | ✅ |
| `electron/main.cjs` | Creates the BrowserWindow; dev → `http://localhost:5173`, prod → `dist/index.html` | ✅ |
| `scripts/auto-push.{sh,bat}` | Convenience git push helpers; `scripts/test-mcq-parse.mjs` | ✅ |
| `tests/*.mjs` | Headless-Chrome audits (`walk-test`, `staff-login`, `100-questions`, `boundary-check`, …) | ❌ git-ignored |
| `uploads/resources/` | Files stored by `ResourceController` upload (max 50 MB) | ❌ git-ignored |
| `backend/database/setup.sql` | Creates the empty database only (Hibernate creates the tables) | ✅ |
| `.github/modernize/` | Static-assessment/upgrade tool reports — **not** CI workflows | ✅ |
| `dist/`, `release/`, `backend/target/`, `node_modules/`, caches | Build output | ❌ git-ignored |
| `tokenra-key.txt`, `opencode.json`, `.env*` | Local secrets/config | ❌ git-ignored |

---

## 5. Documentation set (this repository — inside `docs/`)

| File | Audience |
|---|---|
| `docs/README.md` | **Start here** — documentation index + short project description |
| `docs/01-Project-Overview/ARCHITECTURE.md` | Overview, diagrams, request flow, deployment, presentation & viva material |
| `docs/01-Project-Overview/PROJECT-STRUCTURE.md` | This file — real folder/file tree with purpose of each folder |
| `docs/01-Project-Overview/FEATURE-MATRIX.md` | Feature × status × where it lives |
| `docs/02-Workflows/WORKFLOWS.md` | Student / Instructor / HOD / Admin / Exam / Question-bank step-by-step flows |
| `docs/03-API/API-DOCUMENTATION.md` | Every REST endpoint with auth + role columns |
| `docs/04-Database/DATABASE-DESIGN.md` | Entities, fields, ER diagram, data observations |
| `docs/05-AI/AI-ARCHITECTURE.md` | AI features as implemented (rule-based + optional external LLM mode) |
| `docs/06-Security/SECURITY.md` | Auth implementation + Security Observations |

Pre-existing documentation (**left untouched**): `README.md`, `PROJECT.md`,
`AI-Smart-LMS-Complete-Project-Details.md`, `FEATURE_COMPARISON_REPORT.md`,
`backend/README.md`, `backend/HELP.md`, `backend/API_TESTING.md`, `backend/FEATURE_CHECKLIST.md`.
