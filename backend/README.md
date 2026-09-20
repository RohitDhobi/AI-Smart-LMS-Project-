# AI-Smart-LMS Backend - Levels 1 to 9

This project is a simple Spring Boot + Java 21 + MySQL LMS backend. It preserves the original authentication, courses, lessons, enrollment, progress, quiz and question APIs and adds Levels 1-9 features.

## Included feature levels

- Level 1: Student dashboard
- Level 2: Categories, search, filtering, course details, profiles, wishlist, reviews/ratings, continue-learning data, quiz history/analytics
- Level 3: Instructor dashboard, course status/approval, course/lesson/quiz management through existing APIs
- Level 4: Course certificates and certificate verification
- Level 5: Rule-based AI recommendations, weak-topic detection, learning path, quiz recommendations, study assistant, question generation
- Level 6: Notifications
- Level 7: Admin dashboard, user management, course approval, reports
- Level 8: Role-based access, change password, forgot/reset password, account activation
- Level 9: Student, course and admin analytics

## Run

1. Create MySQL database: `ai_smart_lms`
2. Check `src/main/resources/application.properties` and change MySQL username/password if needed.
3. Run `run.bat` on Windows or `./mvnw spring-boot:run`.
4. Server: http://localhost:8080

## Authentication

Register/login using `/api/auth/register` and `/api/auth/login`. Use the returned JWT as `Authorization: Bearer <token>` for protected endpoints.

## Important note about AI

The AI endpoints are intentionally simple and local so the Java backend can run without another service. They are designed so a Python 3.11/TensorFlow service can replace the rule-based logic later.

## Main new endpoints

`GET /api/dashboard`
`GET /api/courses/search?keyword=java`
`GET /api/courses/category/{category}`
`GET /api/courses/filter`
`GET/PUT /api/profile`
`POST/DELETE /api/wishlist/{courseId}`
`POST /api/courses/{courseId}/reviews`
`GET /api/courses/{courseId}/reviews`
`GET /api/instructor/dashboard`
`PUT /api/courses/{id}/status?status=APPROVED`
`POST /api/certificates/course/{courseId}`
`GET /api/certificates/verify/{id}`
`GET /api/notifications`
`GET /api/admin/dashboard`
`GET /api/admin/reports`
`POST /api/auth/forgot-password`
`POST /api/auth/reset-password`
`GET /api/analytics/student`
`GET /api/analytics/course/{courseId}`
`GET /api/analytics/admin`
`GET /api/ai/recommendations`
`GET /api/ai/weak-topics`
`GET /api/ai/learning-path`
`GET /api/ai/quiz-recommendations`
`POST /api/ai/study-assistant`
`POST /api/ai/generate-questions`
