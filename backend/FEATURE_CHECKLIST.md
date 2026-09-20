# AI-Smart-LMS — Levels 1 to 9 Feature Checklist

## Level 1 — Basic LMS
- Registration / Login
- JWT authentication
- Password encryption
- Roles
- Users
- Courses
- Lessons
- Enrollment
- Progress tracking
- Quizzes / questions / attempts
- Student dashboard

## Level 2 — Student Experience
- Course categories
- Course search
- Course filtering
- Course details
- Student profile
- Instructor profile via profile/role data
- Wishlist
- Reviews and ratings
- Lesson completion / progress
- Continue learning
- Quiz results and attempt history
- Highest / average quiz scores

## Level 3 — Instructor
- Course create/read/update/delete
- Lesson management
- Quiz/question management
- Instructor dashboard
- Course approval/status
- Instructor course analytics

## Level 4 — Certificates
- Course completion certificate
- Unique certificate ID
- Certificate list
- Certificate verification
- Completion notification

## Level 5 — AI
- Course recommendations
- Weak topic detection
- Personalized learning path
- Quiz recommendations
- Study assistant
- AI question generation

The AI is implemented as a simple local rule-based service inside Spring Boot so the project runs without another service. It can later be replaced by the planned Python 3.11 + TensorFlow service.

## Level 6 — Notifications
- User notifications
- Mark as read
- Learning reminders
- Course completion notification

## Level 7 — Admin
- Admin dashboard
- User management
- Activate/deactivate accounts
- Delete users
- Course approval
- Reports
- Analytics

## Level 8 — Security
- Role-based authorization
- JWT refresh endpoint
- Change password
- Forgot password
- Reset password token
- Account activation/deactivation

## Level 9 — Analytics
- Student analytics
- Course analytics
- Admin analytics
- Average progress
- Completion rate
- Quiz performance
- Enrollment and usage counts
