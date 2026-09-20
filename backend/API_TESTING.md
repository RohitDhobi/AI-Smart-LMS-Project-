# Quick Postman Testing

1. POST `/api/auth/register` body: `{"name":"Rohit","email":"rohit@gmail.com","password":"123456"}`
2. POST `/api/auth/login` with same email/password. Copy `token`.
3. Add `Authorization: Bearer <token>` to protected calls.
4. GET `/api/dashboard`
5. GET `/api/courses/search?keyword=java`
6. GET `/api/analytics/student`
7. GET `/api/ai/recommendations`
8. POST `/api/ai/study-assistant` body `{"question":"What is JWT?"}`

Admin endpoints require a user whose role is `ADMIN`. Instructor endpoints require `INSTRUCTOR` or `ADMIN`.
