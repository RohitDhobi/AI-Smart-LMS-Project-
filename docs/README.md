# AI-Smart-LMS Documentation

**AI-Smart-LMS** is a role-based Learning Management System built as a React 19 + Vite
single-page application on top of a Java 21 Spring Boot REST API (port 8080) and a MySQL
database (`ai_smart_lms`). It has exactly four roles — `STUDENT`, `INSTRUCTOR`, `HOD`, `ADMIN` —
each with its own panel. Implemented modules: authentication (JWT + BCrypt), courses / semesters /
subjects / lessons, academic years, enrolment, lesson progress, quizzes and questions, exams with a
server-enforced HOD approval workflow, the HOD question bank, instructor–course assignments
(scoped by course/subject, semester and academic year), divisions, assignments, attendance,
resources (file upload/download), discussions, certificates, in-app notifications, wishlist,
reviews, analytics, a coding practice arena, and a rule-based "AI" layer with one optional
external OpenAI-compatible LLM mode for the study assistant.

Everything in this documentation set was derived from the source code as it exists now.
Features without code are labelled **NOT IMPLEMENTED**; features that work only in part are
labelled **PARTIALLY IMPLEMENTED**.

## Index

| # | Section | File |
|---|---|---|
| 01 | Project Overview | [ARCHITECTURE.md](01-Project-Overview/ARCHITECTURE.md) — stack, architecture, request flow, deployment, viva material |
| | | [PROJECT-STRUCTURE.md](01-Project-Overview/PROJECT-STRUCTURE.md) — real folder/file tree |
| | | [FEATURE-MATRIX.md](01-Project-Overview/FEATURE-MATRIX.md) — feature × status × location |
| 02 | Workflows | [WORKFLOWS.md](02-Workflows/WORKFLOWS.md) — auth, student, instructor, HOD, admin, exam, question bank, notification flows |
| 03 | API | [API-DOCUMENTATION.md](03-API/API-DOCUMENTATION.md) — every REST endpoint with auth and role rules |
| 04 | Database | [DATABASE-DESIGN.md](04-Database/DATABASE-DESIGN.md) — 29 entities, fields, ER diagram, data observations |
| 05 | AI | [AI-ARCHITECTURE.md](05-AI/AI-ARCHITECTURE.md) — AI features as implemented (rule-based engines + optional external LLM) |
| 06 | Security | [SECURITY.md](06-Security/SECURITY.md) — JWT/BCrypt authentication, role model, CORS, security observations |

## Reading order

```
Project Overview → Workflows → API → Database → AI → Security
```

## Note

Only files inside `docs/` are documentation. Source code, database structure, APIs and UI are
not modified by this documentation set. Pre-existing documents at the repository root
(`README.md`, `PROJECT.md`, `AI-Smart-LMS-Complete-Project-Details.md`,
`FEATURE_COMPARISON_REPORT.md`) and inside `backend/` were left untouched.
