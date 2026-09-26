# AI Smart LMS — Project Documentation

An AI-powered Learning Management System for colleges and universities, with separate
panels for **Students**, **Instructors**, **HODs**, and **Admins**.

This file is the full project overview. For the original product spec see
[`AI-Smart-LMS-Complete-Project-Details.md`](./AI-Smart-LMS-Complete-Project-Details.md);
for backend-specific notes see [`backend/README.md`](./backend/README.md).

---

## 1. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite 7 (JSX, no TypeScript) |
| Routing | react-router-dom v7 |
| Styling | Plain CSS (`src/styles.css`, `src/hod.css`) |
| Icons | lucide-react |
| 3D / FX | three, @react-three/fiber, @react-three/drei, canvas-confetti |
| Desktop | Electron 44 + electron-builder |
| Mobile | Capacitor 8 (Android / iOS) |
| PWA | service worker (`public/sw.js`) |
| Backend | Java 21, Spring Boot 2.7 (Web, Data JPA, Security, Validation) |
| Auth | JWT (`Authorization: Bearer <token>`) |
| Database | MySQL 8 (`ai_smart_lms`), Hibernate `ddl-auto=update` |
| Build (backend) | Maven (`backend/mvnw`) |

---

## 2. Repository Layout

```
.
├── index.html              # Vite entry
├── vite.config.js          # port 5173, ELECTRON base-path switch
├── package.json            # frontend scripts + electron-builder config
├── src/
│   ├── main.jsx            # mounts app; loads styles.css THEN hod.css; error boundary; SW
│   ├── App.jsx             # all routes (student, admin, instructor, HOD)
│   ├── api.js              # API client → http://localhost:8080/api (+ fallback logic)
│   ├── ui.jsx              # Page / Protected shared components
│   ├── styles.css          # global styles (base layer)
│   ├── hod.css             # HOD panel styles (loaded after styles.css — wins ties)
│   ├── gamification.js     # points, streaks, badges, theme
│   ├── ai-question-engine.js, flashcards.js, dashboard.js, highlight.js
│   ├── components/         # Toast, CommandPalette, ProgressRing, StudyPlanner,
│   │   │                   #   LearningHeatmap, StudyStreak, CertificateGenerator
│   │   ├── admin/          # AdminLayout + sidebar/menu config
│   │   ├── student/        # StudentLayout + sidebar/menu config
│   │   └── hod/            # HODLayout + HOD sidebar
│   ├── pages/
│   │   ├── *.jsx           # shared/student pages (Login, Dashboard, Courses, Quizzes…)
│   │   ├── admin/          # 24 admin screens (AdminAnalytics … AdminCodingManagement)
│   │   ├── instructor/     # 24 instructor screens (InstructorLayout + dashboard…)
│   │   ├── hod/            # 9 HOD screens (Dashboard, Students, Questions, Exams…)
│   │   └── three/          # 3D scenes (Stats3D, Badges3D, CourseCards3D, Classroom3D)
│   └── *.test.js           # node --test unit tests
├── electron/main.cjs       # Electron main process
├── tests/                  # headless-browser / audit scripts (.mjs)
├── scripts/                # auto-push helpers (.sh / .bat)
├── public/                 # icons, manifest, sw.js
└── backend/                # Spring Boot API (see below)
    ├── src/main/java/com/aismartlms/backend/
    │   ├── controller/     # Auth, User, Course, Lesson, Quiz, Question, Exam,
    │   │                   # Assignment, Attendance, Enrollment, Progress, Discussion,
    │   │                   # Certificate, HOD, CodingPractice, Resource…
    │   ├── service/        # business logic (HODService, InstructorAccessService…)
    │   ├── repository/     # Spring Data JPA
    │   ├── entity/         # User, Role, Course, Quiz, Question, Exam, Assignment…
    │   ├── dto/            # request/response records
    │   ├── security/       # JwtService, JwtAuthenticationFilter, SecurityConfig
    │   └── config/         # DataSeeder
    ├── database/           # SQL scripts
    ├── pom.xml             # Maven build (Java 21)
    └── run.bat             # Windows run helper
```

---

## 3. Getting Started

### Prerequisites

- Node.js 18+
- Java 21 + Maven (backend)
- MySQL 8 with a database named `ai_smart_lms`

### 1. Backend

```bash
cd backend
# check src/main/resources/application.properties (datasource user/password)
./mvnw spring-boot:run     # Windows: run.bat
```

Server starts at **http://localhost:8080**, API base **http://localhost:8080/api**.

### 2. Frontend

```bash
npm install
npm run dev
```

Open **http://localhost:5173**.

### 3. Tests & Build

```bash
npm test        # node --test "src/**/*.test.js"
npm run build   # vite production build → dist/
npm run preview # serve the production build
```

### Other scripts

| Script | Purpose |
|---|---|
| `npm run electron:dev` | Build + run the desktop app |
| `npm run electron:build` | Package installers into `release/` |
| `npm run cap:add:android` / `cap:sync` | Capacitor mobile targets |
| `npm run auto-push` / `auto-push:win` | Push helper scripts |

---

## 4. Authentication

- `POST /api/auth/register` and `POST /api/auth/login` return a **JWT**.
- The token and current user are stored in `localStorage` (`token`, `user`).
- Every request goes through `apiRequest()` in `src/api.js`, which attaches
  `Authorization: Bearer <token>` and `Content-Type: application/json`.
- The client probes backend health and **falls back to localStorage/mock data**
  (e.g. coding problems) when the server is unreachable, so the UI stays usable.
- Forgot/reset password: `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`.
- Route-level protection via the `<Protected>` wrapper in `src/ui.jsx`.

Roles: **STUDENT**, **INSTRUCTOR**, **HOD**, **ADMIN** — staff (ADMIN/HOD) are
authorized on instructor endpoints via `InstructorAccessService.requireCourseManage`.

---

## 5. Application Panels

### Student (`studentLayoutElement` routes: `/dashboard`, `/courses`, …)

Dashboard, course search & category filter, wishlist, profile, certificates,
notifications, quizzes & quiz history, assignments, exams, attendance, discussions,
analytics, learning path, AI study assistant, AI quiz generator, flashcards,
leaderboard/badges, campus tour, coding arena & playground, and 3D views
(`/3d-stats`, `/3d-badges`, `/3d-courses`, `/3d-classroom`).

### Instructor (`/instructor` — `InstructorLayout`)

Dashboard, courses (create/details), lessons, students, assignments, quizzes, exams,
attendance, grade book, analytics, announcements, discussions, certificates, calendar,
AI tools, resources, coding practice, settings.

### HOD (`/hod` — `HODLayout`)

Dashboard, analytics, assignments (incl. `/assignments/new`), courses & subjects
(list/create/detail), students (list + `/students/:id` detail), questions
(list + `/questions/new` + `/questions/:id` edit), exams (list + new + edit),
announcements, settings.

- Backed by `HODController` → `HODService` (e.g. `/hod/questions`, `/hod/students`).
- Question/exam CRUD reuses the shared `/api/questions` and `/api/exams` endpoints.
- Panel-specific CSS lives in `src/hod.css` (loaded after `styles.css`).

### Admin (`/admin` — `AdminLayout`)

Dashboard, courses, teachers, students, analytics, roles, subjects, semesters, lessons,
categories, resources, quizzes, exams, assignments, coding management, results, progress,
certificates, leaderboard, announcements, discussions, AI assistant/analytics/insights,
reports, settings, audit logs.

---

## 6. Frontend Conventions

- **CSS order matters:** `src/main.jsx` imports `./styles.css` first, then `./hod.css`,
  so HOD styles override global styles of equal specificity.
- **Page chrome:** pages wrap content in `<Page title subtitle>`; cards use `.card`.
- **Buttons:** `.inst-btn`, `.inst-btn-primary`, `.inst-btn-small` (in `styles.css`);
  primary buttons must keep **white labels on blue** (`#2563eb`).
- **Tables:** action columns wrap buttons in `<div className="hod-actions-cell">`
  inside the `<td>` so row borders align (see `src/hod.css`).
- **Forms:** `.inst-form-row` for two-column rows; confirm destructive actions with
  `window.confirm` before calling delete endpoints.
- **API layer:** never call `fetch` directly — add helpers to `src/api.js`.
- **Error handling:** `main.jsx` mounts an app-level error boundary with a
  "Back to Login" recovery action.

---

## 7. Backend API Overview

Base URL: `http://localhost:8080/api`

| Area | Endpoints (representative) |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `/auth/forgot-password`, `/auth/reset-password` |
| Courses | `GET/POST /courses`, `GET/PUT/DELETE /courses/{id}`, `/courses/search`, `/courses/category/{cat}`, `/courses/filter`, `/courses/{id}/reviews`, `/courses/{id}/status` |
| Lessons | `GET/POST /lessons`, `PUT/DELETE /lessons/{id}` |
| Enrollment | `POST /enrollments`, `GET /enrollments/my` |
| Progress | `GET /progress/my`, `GET /progress/course/{courseId}` |
| Quizzes | `GET/POST /quizzes`, `POST /quizzes/{id}/submit`, `/quizzes/{id}/attempts` |
| Questions | `GET/POST /questions/quiz/{quizId}`, `GET/PUT/DELETE /questions/{id}` |
| Exams | `GET/POST /exams`, `GET/PUT/DELETE /exams/{id}` |
| Assignments | `GET/POST /assignments`, submissions + grading |
| Attendance | `GET/POST /attendance` |
| Certificates | `POST /certificates/course/{courseId}`, `GET /certificates/verify/{id}` |
| Notifications | `GET /notifications` |
| Dashboards | `GET /dashboard`, `/instructor/dashboard`, `/admin/dashboard` |
| Analytics | `GET /analytics/student`, `/analytics/course/{id}`, `/analytics/admin` |
| AI | `GET /ai/recommendations`, `/ai/weak-topics`, `/ai/learning-path`, `POST /ai/study-assistant`, `POST /ai/generate-questions` |
| HOD | `GET /hod/dashboard`, `/hod/questions`, `/hod/students`, `/hod/assignments`, … |
| Admin | `GET /admin/dashboard`, `/admin/reports` |

Full endpoint lists: [`backend/API_TESTING.md`](./backend/API_TESTING.md) and
[`backend/README.md`](./backend/README.md).

> **AI note:** AI endpoints are intentionally rule-based and local so the Java backend
> runs standalone; they are structured so a Python/FastAPI ML service can replace them later.

---

## 8. Data Model (core entities)

`User` / `Role` · `Subject` · `Course` · `Enrollment` · `Lesson` · `Progress` ·
`Quiz` · `Question` (questionText, optionA–D, correctAnswer A–D, marks, questionOrder) ·
`QuizAttempt` · `Exam` · `Assignment` / `AssignmentSubmission` · `Attendance` ·
`Certificate` · `Discussion` / `DiscussionReply` · `Announcement` · `Notification` ·
`Resource` · `Wishlist` · `Review` · `CodingProblem` / `CodingSubmission` / `CodingTestCase`

Schema is managed by Hibernate (`ddl-auto=update`); seed data comes from
`config/DataSeeder.java` and `seed-lessons.js`.

---

## 9. Testing

- **Unit tests:** `npm test` runs Node's built-in test runner over `src/**/*.test.js`
  (`api.test.js`, `dashboard.test.js`, `highlight.test.js`).
- **Browser/audit scripts:** ad-hoc Playwright-style checks in `tests/*.mjs`
  (walk-tests, race checks, splash/staff-login checks).
- **Backend:** standard Spring Boot test setup under `backend/src/test`.

---

## 10. Deployment Targets

- **Web:** `npm run build` → `dist/`, served behind the Spring Boot API.
- **Desktop:** Electron (`electron/main.cjs`), packaged with electron-builder
  (NSIS/dmg/AppImage → `release/`).
- **Mobile:** Capacitor (`capacitor.config.json`) for Android and iOS.
- **PWA:** service worker registered in `main.jsx`.

---

## 11. Related Documents

| File | Contents |
|---|---|
| `AI-Smart-LMS-Complete-Project-Details.md` | Full product specification (features, workflows, DB design) |
| `FEATURE_COMPARISON_REPORT.md` | Feature comparison report |
| `backend/README.md` | Backend feature levels & endpoint list |
| `backend/API_TESTING.md` | API testing guide |
| `backend/FEATURE_CHECKLIST.md` | Backend feature checklist |
| `backend/HELP.md` | Backend help notes |
