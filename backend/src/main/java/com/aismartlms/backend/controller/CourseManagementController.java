package com.aismartlms.backend.controller;

import com.aismartlms.backend.entity.*;
import com.aismartlms.backend.exception.AccessDeniedException;
import com.aismartlms.backend.repository.*;
import com.aismartlms.backend.service.InstructorAccessService;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class CourseManagementController {

    private final UserRepository users;
    private final CourseRepository courses;
    private final SubjectRepository subjects;
    private final LessonRepository lessons;
    private final ProgressRepository progress;
    private final EnrollmentRepository enrollments;
    private final QuizRepository quizzes;
    private final QuizAttemptRepository attempts;
    private final ReviewRepository reviews;
    private final WishlistRepository wishlists;
    private final CertificateRepository certificates;
    private final AssignmentRepository assignmentRepository;
    private final InstructorAccessService access;

    public CourseManagementController(
            UserRepository users,
            CourseRepository courses,
            SubjectRepository subjects,
            LessonRepository lessons,
            ProgressRepository progress,
            EnrollmentRepository enrollments,
            QuizRepository quizzes,
            QuizAttemptRepository attempts,
            ReviewRepository reviews,
            WishlistRepository wishlists,
            CertificateRepository certificates,
            AssignmentRepository assignmentRepository,
            InstructorAccessService access) {

        this.users = users;
        this.courses = courses;
        this.subjects = subjects;
        this.lessons = lessons;
        this.progress = progress;
        this.enrollments = enrollments;
        this.quizzes = quizzes;
        this.attempts = attempts;
        this.reviews = reviews;
        this.wishlists = wishlists;
        this.certificates = certificates;
        this.assignmentRepository = assignmentRepository;
        this.access = access;
    }

    // =========================================================
    // COMMON HELPERS
    // =========================================================

    private User me(Authentication authentication) {

        if (authentication == null || authentication.getName() == null) {
            throw new AccessDeniedException("Authentication required");
        }

        return users.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private void requireRole(User user, Role... allowedRoles) {

        for (Role allowedRole : allowedRoles) {

            if (user.getRole() == allowedRole) {
                return;
            }
        }

        throw new AccessDeniedException("Admin access required");
    }

    private Course course(Long id) {

        return courses.findById(id)
                .orElseThrow(() -> new RuntimeException("Course not found"));
    }

    // =========================================================
    // INSTRUCTOR ASSIGNMENT ENFORCEMENT
    //
    // Instructors may only manage courses/subjects that an HOD has
    // explicitly assigned to them. Resolves the target course out of a
    // request body and rejects the call with HTTP 403 when the logged-in
    // instructor is not assigned to it. ADMIN and HOD always pass.
    // =========================================================

    private void enforceInstructorCourseBody(
            User user, Map<String, Object> body) {

        if (user.getRole() != Role.INSTRUCTOR) {
            return;
        }

        Long courseId = longValue(body.get("courseId"));

        if (courseId != null) {
            access.requireCourseManage(user, courseId);
            return;
        }

        Long subjectId = longValue(body.get("subjectId"));

        if (subjectId != null) {
            access.requireSubjectManage(user, subjectId);
            return;
        }

        // Fall back to a course named in the body (legacy payloads).
        String subjectName = str(body.get("subject"));

        if (subjectName != null && !subjectName.isBlank()) {

            Course named = courses.findAll().stream()
                    .filter(c -> c.getTitle() != null
                            && c.getTitle().equalsIgnoreCase(subjectName))
                    .findFirst()
                    .orElse(null);

            if (named != null) {
                access.requireCourseManage(user, named.getId());
                return;
            }
        }

        throw new AccessDeniedException(
                "Course or subject is required, and you must be assigned to it. " +
                "Ask your HOD to assign the subject/course to you.");
    }

    private Subject subject(Long id) {

        return subjects.findById(id)
                .orElseThrow(() -> new RuntimeException("Subject not found"));
    }

    /** Parses a request value that may arrive as a Number or a String. */
    private Long longValue(Object value) {

        if (value == null) {
            return null;
        }

        if (value instanceof Number number) {
            return number.longValue();
        }

        try {
            return Long.valueOf(value.toString().trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    // =========================================================
    // COURSE SEMESTERS
    // GET /api/courses/{courseId}/semesters
    // =========================================================

    @GetMapping("/courses/{courseId}/semesters")
    public List<Integer> courseSemesters(@PathVariable Long courseId) {

        Course course = course(courseId);

        int total = course.getTotalSemesters() == null
                ? 0
                : course.getTotalSemesters();

        if (total <= 0) {
            return List.of();
        }

        return IntStream.rangeClosed(1, total)
                .boxed()
                .collect(Collectors.toList());
    }

    // =========================================================
    // SUBJECTS OF A COURSE
    // GET /api/courses/{courseId}/subjects
    // =========================================================

    @GetMapping("/courses/{courseId}/subjects")
    public List<Subject> courseSubjects(@PathVariable Long courseId) {

        course(courseId);

        return subjects.findByCourseIdOrderBySemesterAscSubjectNameAsc(courseId);
    }

    // =========================================================
    // SUBJECTS OF A COURSE FOR A SEMESTER
    // GET /api/courses/{courseId}/subjects/{semester}
    // =========================================================

    @GetMapping("/courses/{courseId}/subjects/{semester}")
    public List<Subject> courseSemesterSubjects(
            @PathVariable Long courseId,
            @PathVariable Integer semester) {

        Course course = course(courseId);

        if (course.getTotalSemesters() != null
                && (semester < 1 || semester > course.getTotalSemesters())) {

            throw new RuntimeException("Invalid semester for the selected course");
        }

        return subjects.findByCourseIdAndSemesterOrderBySubjectNameAsc(
                courseId,
                semester
        );
    }

    // =========================================================
    // CURRENT STUDENT PROFILE
    // GET /api/students/me
    // =========================================================

    @GetMapping("/students/me")
    public Map<String, Object> myStudentProfile(
            Authentication authentication) {

        User user = me(authentication);

        Map<String, Object> response = new LinkedHashMap<>();

        response.put("id", user.getId());
        response.put("name", user.getName());
        response.put("email", user.getEmail());
        response.put("phone", user.getPhone());
        response.put("gender", user.getGender());
        response.put("dateOfBirth", user.getDateOfBirth());

        if (user.getCourse() != null) {

            response.put("courseId", user.getCourse().getId());
            response.put("courseName", user.getCourse().getCourseName());
            response.put("courseCode", user.getCourse().getCourseCode());
            response.put("totalSemesters", user.getCourse().getTotalSemesters());

        } else {

            response.put("courseId", null);
            response.put("courseName", null);
            response.put("courseCode", null);
            response.put("totalSemesters", null);
        }

        return response;
    }

    // =========================================================
    // MY SUBJECTS (all subjects of the student's own course)
    // GET /api/students/me/subjects
    // =========================================================

    @GetMapping("/students/me/subjects")
    public Map<String, Object> mySubjects(
            Authentication authentication) {

        User user = me(authentication);

        Map<String, Object> response = new LinkedHashMap<>();

        if (user.getCourse() == null) {

            response.put("courseId", null);
            response.put("courseName", null);
            response.put("courseCode", null);
            response.put("overallProgress", 0.0);
            response.put("subjects", List.of());

            return response;
        }

        Course course = user.getCourse();

        List<Subject> subjectList =
                subjects.findByCourseIdOrderBySemesterAscSubjectNameAsc(
                        course.getId()
                );

        List<Progress> myProgress =
                progress.findByUserEmail(user.getEmail());

        List<Map<String, Object>> items = new ArrayList<>();

        for (Subject subject : subjectList) {

            items.add(subjectWithProgress(subject, myProgress));
        }

        double overall = items.stream()
                .mapToDouble(item ->
                        ((Number) item.get("progressPercentage")).doubleValue())
                .average()
                .orElse(0.0);

        response.put("courseId", course.getId());
        response.put("courseName", course.getCourseName());
        response.put("courseCode", course.getCourseCode());
        response.put("totalSemesters", course.getTotalSemesters());
        response.put("overallProgress", Math.round(overall * 10.0) / 10.0);
        response.put("subjects", items);

        return response;
    }

    // =========================================================
    // SUBJECT WITH LESSONS
    // GET /api/subjects/{id}
    // A student may only open subjects of their own course.
    // =========================================================

    @GetMapping("/subjects/{id}")
    public Map<String, Object> subjectDetail(
            @PathVariable Long id,
            Authentication authentication) {

        User user = me(authentication);

        Subject subject = subject(id);

        boolean privileged =
                user.getRole() == Role.ADMIN
                        || user.getRole() == Role.INSTRUCTOR;

        if (!privileged) {
            boolean sameCourse = user.getCourse() != null
                    && user.getCourse().getId()
                    .equals(subject.getCourse().getId());

            boolean enrolled = enrollments.existsByUserAndCourse(
                    user, subject.getCourse());

            if (!sameCourse && !enrolled) {
                throw new AccessDeniedException(
                        "You can only access subjects of your own course"
                );
            }
        }

        Map<String, Object> response = new LinkedHashMap<>();

        response.put("id", subject.getId());
        response.put("subjectCode", subject.getSubjectCode());
        response.put("subjectName", subject.getSubjectName());
        response.put("description", subject.getDescription());
        response.put("semester", subject.getSemester());

        response.put("courseId", subject.getCourse().getId());
        response.put("courseName", subject.getCourse().getCourseName());
        response.put("courseCode", subject.getCourse().getCourseCode());

        List<Lesson> lessonList =
                lessons.findBySubjectIdOrderByLessonOrderAsc(subject.getId());

        response.put("lessons", lessonList);

        if (!privileged) {

            List<Progress> myProgress =
                    progress.findByUserEmailAndLessonSubjectId(
                            user.getEmail(),
                            subject.getId()
                    );

            response.put("progress", subjectWithProgress(subject, myProgress));
        }

        return response;
    }

    // =========================================================
    // INSTRUCTOR - ALL COURSES
    // GET /api/instructor/courses
    // =========================================================

    @GetMapping("/instructor/courses")
    public List<Map<String, Object>> instructorCourses(
            Authentication authentication) {

        User user = me(authentication);
        requireRole(user, Role.INSTRUCTOR, Role.ADMIN);

        // Pre-computed once so the per-course flag below is cheap.
        // Staff (ADMIN/HOD) are unrestricted, so every course is manageable.
        final boolean staff = access.isStaff(user);
        final java.util.Set<Long> manageable = staff
                ? java.util.Set.of()
                : access.manageableCourseIds(user.getId());

        return courses.findAll().stream()
                .map(course -> {

                    Map<String, Object> item = new LinkedHashMap<>();

                    item.put("id", course.getId());
                    item.put("courseCode", course.getCourseCode());
                    item.put("courseName", course.getCourseName());
                    item.put("title", course.getTitle());
                    item.put("description", course.getDescription());
                    item.put("duration", course.getDuration());
                    item.put("totalSemesters", course.getTotalSemesters());
                    item.put("category", course.getCategory());
                    item.put("difficulty", course.getDifficulty());
                    item.put("instructor", course.getInstructor());
                    item.put("price", course.getPrice());

                    List<Subject> subjectList =
                            subjects.findByCourseId(course.getId());

                    item.put("subjectCount", subjectList.size());
                    item.put(
                            "studentCount",
                            users.findByCourse(course).size()
                    );

                    // Read-only for courses the HOD has not assigned.
                    item.put(
                            "canManage",
                            staff || manageable.contains(course.getId())
                    );

                    return item;
                })
                .collect(Collectors.toList());
    }

    // =========================================================
    // INSTRUCTOR - SINGLE COURSE
    // GET /api/instructor/courses/{id}
    // =========================================================

    @GetMapping("/instructor/courses/{id}")
    public Map<String, Object> instructorCourse(
            @PathVariable Long id,
            Authentication authentication) {

        User user = me(authentication);
        requireRole(user, Role.INSTRUCTOR, Role.ADMIN);

        Course course = course(id);

        Map<String, Object> item = new LinkedHashMap<>();

        item.put("id", course.getId());
        item.put("courseCode", course.getCourseCode());
        item.put("courseName", course.getCourseName());
        item.put("title", course.getTitle());
        item.put("description", course.getDescription());
        item.put("duration", course.getDuration());
        item.put("totalSemesters", course.getTotalSemesters());
        item.put("category", course.getCategory());
        item.put("difficulty", course.getDifficulty());
        item.put("instructor", course.getInstructor());
        item.put("price", course.getPrice());
        item.put("status", course.getStatus());

        List<Subject> subjectList =
                subjects.findByCourseId(course.getId());

        item.put("subjectCount", subjectList.size());
        item.put("studentCount", users.findByCourse(course).size());

        // Tells the React UI whether to render management buttons.
        // Read-only instructors still receive full course details.
        item.put("canManage", access.canManageCourse(user, course.getId()));

        return item;
    }

    // =========================================================
    // ADMIN - ALL COURSES (management)
    // GET /api/admin/courses
    // =========================================================

    @GetMapping("/admin/courses")
    public List<Map<String, Object>> adminCourses(
            Authentication authentication) {

        requireRole(me(authentication), Role.ADMIN);

        return courses.findAll().stream()
                .map(course -> {

                    Map<String, Object> item = new LinkedHashMap<>();

                    item.put("id", course.getId());
                    item.put("courseCode", course.getCourseCode());
                    item.put("courseName", course.getCourseName());
                    item.put("title", course.getTitle());
                    item.put("description", course.getDescription());
                    item.put("duration", course.getDuration());
                    item.put("totalSemesters", course.getTotalSemesters());
                    item.put("category", course.getCategory());

                    List<Subject> subjectList =
                            subjects.findByCourseId(course.getId());

                    item.put("subjectCount", subjectList.size());
                    item.put(
                            "studentCount",
                            users.findByCourse(course).size()
                    );

                    return item;
                })
                .collect(Collectors.toList());
    }

    // =========================================================
    // ADMIN - CREATE COURSE
    // POST /api/admin/courses
    // =========================================================

    @PostMapping("/admin/courses")
    public Course createAdminCourse(
            Authentication authentication,
            @RequestBody Map<String, Object> body) {

        requireRole(me(authentication), Role.ADMIN);

        String courseCode = str(body.get("courseCode"));
        String courseName = str(body.get("courseName"));
        String description = str(body.get("description"));
        String duration = str(body.get("duration"));

        Integer totalSemesters = intValue(body.get("totalSemesters"));

        if (courseName == null || courseName.isBlank()) {
            throw new RuntimeException("Course name is required");
        }

        Course course = new Course();

        course.setCourseCode(courseCode);
        course.setCourseName(courseName);

        // Reuse the existing catalog fields
        course.setTitle(courseName);
        course.setDescription(
                description == null || description.isBlank()
                        ? "Degree program: " + courseName
                        : description
        );
        course.setInstructor("AI Smart LMS");
        course.setCategory("Degree Program");
        course.setStatus("APPROVED");
        course.setPrice(0.0);
        course.setDuration(duration);
        course.setTotalSemesters(
                totalSemesters == null || totalSemesters < 1
                        ? 6
                        : totalSemesters
        );

        return courses.save(course);
    }

    // =========================================================
    // ADMIN - UPDATE COURSE
    // PUT /api/admin/courses/{id}
    // =========================================================

    @PutMapping("/admin/courses/{id}")
    public Course updateAdminCourse(
            Authentication authentication,
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {

        requireRole(me(authentication), Role.ADMIN);

        Course course = course(id);

        if (body.containsKey("courseCode")) {
            course.setCourseCode(str(body.get("courseCode")));
        }

        if (body.containsKey("courseName")
                && body.get("courseName") != null
                && !str(body.get("courseName")).isBlank()) {

            course.setCourseName(str(body.get("courseName")));
            course.setTitle(str(body.get("courseName")));
        }

        if (body.containsKey("description")) {
            course.setDescription(str(body.get("description")));
        }

        if (body.containsKey("duration")) {
            course.setDuration(str(body.get("duration")));
        }

        if (body.containsKey("totalSemesters")
                && intValue(body.get("totalSemesters")) != null) {

            course.setTotalSemesters(
                    intValue(body.get("totalSemesters"))
            );
        }

        return courses.save(course);
    }

    // =========================================================
    // ADMIN - DELETE COURSE
    // DELETE /api/admin/courses/{id}
    // =========================================================

    @DeleteMapping("/admin/courses/{id}")
    public Map<String, String> deleteAdminCourse(
            Authentication authentication,
            @PathVariable Long id) {

        requireRole(me(authentication), Role.ADMIN);

        Course course = course(id);

        // Remove dependent records before deleting the course
        wishlists.findByCourse(course)
                .forEach(wishlists::delete);

        reviews.findByCourseId(id)
                .forEach(reviews::delete);

        enrollments.findByCourse(course)
                .forEach(enrollments::delete);

        certificates.findByCourse(course)
                .forEach(certificates::delete);

        progress.deleteByLessonCourseId(id);

        quizzes.findByCourseId(id)
                .forEach(quiz -> {
                    attempts.findByQuizId(quiz.getId())
                            .forEach(attempts::delete);
                    quizzes.delete(quiz);
                });

        courses.deleteById(id);

        return Map.of("message", "Course deleted successfully");
    }

    // =========================================================
    // ADMIN - STUDENTS OF A COURSE
    // GET /api/admin/courses/{courseId}/students
    // =========================================================

    @GetMapping("/admin/courses/{courseId}/students")
    public List<Map<String, Object>> courseStudents(
            Authentication authentication,
            @PathVariable Long courseId) {

        requireRole(me(authentication), Role.ADMIN);

        Course course = course(courseId);

        return users.findByCourse(course).stream()
                .filter(user -> user.getRole() == Role.STUDENT)
                .map(user -> {

                    Map<String, Object> item = new LinkedHashMap<>();

                    item.put("id", user.getId());
                    item.put("name", user.getName());
                    item.put("email", user.getEmail());
                    item.put("phone", user.getPhone());

                    return item;
                })
                .collect(Collectors.toList());
    }

    // =========================================================
    // ADMIN - CREATE SUBJECT
    // POST /api/admin/subjects
    // =========================================================

    @PostMapping("/admin/subjects")
    public Subject createSubject(
            Authentication authentication,
            @RequestBody Map<String, Object> body) {

        requireRole(me(authentication), Role.ADMIN);

        Long courseId = longValue(body.get("courseId"));
        Integer semester = intValue(body.get("semester"));

        String subjectCode = str(body.get("subjectCode"));
        String subjectName = str(body.get("subjectName"));
        String description = str(body.get("description"));

        if (courseId == null) {
            throw new RuntimeException("Course is required");
        }

        if (subjectName == null || subjectName.isBlank()) {
            throw new RuntimeException("Subject name is required");
        }

        if (semester == null || semester < 1) {
            throw new RuntimeException("Valid semester is required");
        }

        Course course = course(courseId);

        if (course.getTotalSemesters() != null
                && semester > course.getTotalSemesters()) {

            throw new RuntimeException("Invalid semester for the selected course");
        }

        subjects.findByCourseIdAndSemesterAndSubjectNameIgnoreCase(
                        courseId,
                        semester,
                        subjectName
                )
                .ifPresent(existing -> {
                    throw new RuntimeException(
                            "Subject already exists in this semester"
                    );
                });

        Subject subject = new Subject();

        subject.setCourse(course);
        subject.setSemester(semester);
        subject.setSubjectCode(subjectCode);
        subject.setSubjectName(subjectName);
        subject.setDescription(description);

        return subjects.save(subject);
    }

    // =========================================================
    // ADMIN - UPDATE SUBJECT
    // PUT /api/admin/subjects/{id}
    // =========================================================

    @PutMapping("/admin/subjects/{id}")
    public Subject updateSubject(
            Authentication authentication,
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {

        requireRole(me(authentication), Role.ADMIN);

        Subject subject = subject(id);

        if (body.containsKey("subjectCode")) {
            subject.setSubjectCode(str(body.get("subjectCode")));
        }

        if (body.containsKey("subjectName")
                && body.get("subjectName") != null
                && !str(body.get("subjectName")).isBlank()) {

            subject.setSubjectName(str(body.get("subjectName")));
        }

        if (body.containsKey("description")) {
            subject.setDescription(str(body.get("description")));
        }

        if (body.containsKey("semester")
                && intValue(body.get("semester")) != null) {

            subject.setSemester(intValue(body.get("semester")));
        }

        return subjects.save(subject);
    }

    // =========================================================
    // ADMIN - DELETE SUBJECT
    // DELETE /api/admin/subjects/{id}
    // =========================================================

    @DeleteMapping("/admin/subjects/{id}")
    public Map<String, String> deleteSubject(
            Authentication authentication,
            @PathVariable Long id) {

        requireRole(me(authentication), Role.ADMIN);

        Subject subject = subject(id);

        // Remove progress records that reference lessons of this subject
        lessons.findBySubjectIdOrderByLessonOrderAsc(id)
                .forEach(lesson ->
                        progress.deleteByLessonId(lesson.getId())
                );

        subjects.deleteById(id);

        return Map.of("message", "Subject deleted successfully");
    }

    // =========================================================
    // ADMIN - ADD LESSON TO SUBJECT
    // POST /api/admin/subjects/{subjectId}/lessons
    // =========================================================

    @PostMapping("/admin/subjects/{subjectId}/lessons")
    public Lesson addSubjectLesson(
            Authentication authentication,
            @PathVariable Long subjectId,
            @RequestBody Map<String, Object> body) {

        requireRole(me(authentication), Role.ADMIN);

        Subject subject = subject(subjectId);

        String title = str(body.get("title"));
        String description = str(body.get("description"));
        String content = str(body.get("content"));
        String videoUrl = str(body.get("videoUrl"));

        if (title == null || title.isBlank()) {
            throw new RuntimeException("Lesson title is required");
        }

        Lesson lesson = new Lesson();

        lesson.setCourse(subject.getCourse());
        lesson.setSubject(subject);
        lesson.setTitle(title);
        lesson.setDescription(
                description == null || description.isBlank()
                        ? title
                        : description
        );
        lesson.setContent(
                content == null || content.isBlank()
                        ? "Content for " + title + " will be added soon."
                        : content
        );
        lesson.setVideoUrl(videoUrl);
        lesson.setDurationMinutes(
                intValue(body.get("durationMinutes")) == null
                        ? 30
                        : intValue(body.get("durationMinutes"))
        );

        List<Lesson> subjectLessons =
                lessons.findBySubjectIdOrderByLessonOrderAsc(subjectId);

        int nextOrder = subjectLessons.stream()
                .mapToInt(l ->
                        l.getLessonOrder() == null
                                ? 0
                                : l.getLessonOrder())
                .max()
                .orElse(0) + 1;

        lesson.setLessonOrder(
                intValue(body.get("lessonOrder")) == null
                        ? nextOrder
                        : intValue(body.get("lessonOrder"))
        );

        return lessons.save(lesson);
    }

    // =========================================================
    // ADMIN - UPDATE LESSON
    // PUT /api/admin/lessons/{id}
    // =========================================================

    @PutMapping("/admin/lessons/{id}")
    public Lesson updateAdminLesson(
            Authentication authentication,
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {

        requireRole(me(authentication), Role.ADMIN);

        Lesson lesson = lessons.findById(id)
                .orElseThrow(() -> new RuntimeException("Lesson not found"));

        if (body.containsKey("title")) {
            lesson.setTitle(str(body.get("title")));
        }

        if (body.containsKey("description")) {
            lesson.setDescription(str(body.get("description")));
        }

        if (body.containsKey("content")) {
            lesson.setContent(str(body.get("content")));
        }

        if (body.containsKey("videoUrl")) {
            lesson.setVideoUrl(str(body.get("videoUrl")));
        }

        if (body.containsKey("lessonOrder")
                && intValue(body.get("lessonOrder")) != null) {

            lesson.setLessonOrder(intValue(body.get("lessonOrder")));
        }

        if (body.containsKey("durationMinutes")
                && intValue(body.get("durationMinutes")) != null) {

            lesson.setDurationMinutes(intValue(body.get("durationMinutes")));
        }

        return lessons.save(lesson);
    }

    // =========================================================
    // ADMIN - DELETE LESSON
    // DELETE /api/admin/lessons/{id}
    // =========================================================

    @DeleteMapping("/admin/lessons/{id}")
    public Map<String, String> deleteAdminLesson(
            Authentication authentication,
            @PathVariable Long id) {

        requireRole(me(authentication), Role.ADMIN);

        Lesson lesson = lessons.findById(id)
                .orElseThrow(() -> new RuntimeException("Lesson not found"));

        progress.deleteByLessonCourseId(lesson.getCourse().getId());

        lessons.deleteById(id);

        return Map.of("message", "Lesson deleted successfully");
    }

    // =========================================================
    // INSTRUCTOR - CREATE COURSE
    // POST /api/instructor/courses
    // =========================================================

    @PostMapping("/instructor/courses")
    public Course createInstructorCourse(
            Authentication authentication,
            @RequestBody Map<String, Object> body) {

        User user = me(authentication);
        requireRole(user, Role.INSTRUCTOR, Role.ADMIN);

        String courseCode = str(body.get("courseCode"));
        String courseName = str(body.get("courseName"));
        String title = str(body.get("title"));
        String description = str(body.get("description"));
        String duration = str(body.get("duration"));
        String category = str(body.get("category"));
        String difficulty = str(body.get("difficulty"));

        Double price = null;
        if (body.get("price") != null) {
            price = Double.parseDouble(String.valueOf(body.get("price")));
        }

        if (title == null || title.isBlank()) {
            title = courseName;
        }
        if (title == null || title.isBlank()) {
            throw new RuntimeException("Course title is required");
        }

        Course course = new Course();
        course.setCourseCode(courseCode);
        course.setCourseName(courseName != null ? courseName : title);
        course.setTitle(title);
        course.setDescription(
                description == null || description.isBlank()
                        ? "Course: " + title
                        : description
        );
        course.setInstructor(user.getName());
        course.setCategory(
                category == null || category.isBlank()
                        ? "General"
                        : category
        );
        course.setDifficulty(
                difficulty == null || difficulty.isBlank()
                        ? "BEGINNER"
                        : difficulty
        );
        course.setStatus("APPROVED");
        course.setPrice(price != null ? price : 0.0);
        course.setDuration(duration);
        course.setTotalSemesters(6);

        return courses.save(course);
    }

    // =========================================================
    // INSTRUCTOR - ADD LESSON TO SUBJECT
    // POST /api/instructor/subjects/{subjectId}/lessons
    // =========================================================

    @PostMapping("/instructor/subjects/{subjectId}/lessons")
    public Lesson addInstructorLesson(
            Authentication authentication,
            @PathVariable Long subjectId,
            @RequestBody Map<String, Object> body) {

        User user = me(authentication);
        requireRole(user, Role.INSTRUCTOR, Role.ADMIN);

        // BACKEND SECURITY: an instructor may only add lessons to subjects
        // the HOD has assigned to them. Everyone else gets HTTP 403.
        access.requireSubjectManage(user, subjectId);

        Subject subject = subject(subjectId);

        String title = str(body.get("title"));
        String description = str(body.get("description"));
        String content = str(body.get("content"));
        String videoUrl = str(body.get("videoUrl"));

        if (title == null || title.isBlank()) {
            throw new RuntimeException("Lesson title is required");
        }

        Lesson lesson = new Lesson();
        lesson.setCourse(subject.getCourse());
        lesson.setSubject(subject);
        lesson.setTitle(title);
        lesson.setDescription(
                description == null || description.isBlank()
                        ? title
                        : description
        );
        lesson.setContent(
                content == null || content.isBlank()
                        ? "Content for " + title + " will be added soon."
                        : content
        );
        lesson.setVideoUrl(videoUrl);
        lesson.setDurationMinutes(
                intValue(body.get("durationMinutes")) == null
                        ? 30
                        : intValue(body.get("durationMinutes"))
        );

        List<Lesson> subjectLessons =
                lessons.findBySubjectIdOrderByLessonOrderAsc(subjectId);

        int nextOrder = subjectLessons.stream()
                .mapToInt(l ->
                        l.getLessonOrder() == null
                                ? 0
                                : l.getLessonOrder())
                .max()
                .orElse(0) + 1;

        lesson.setLessonOrder(
                intValue(body.get("lessonOrder")) == null
                        ? nextOrder
                        : intValue(body.get("lessonOrder"))
        );

        return lessons.save(lesson);
    }

    // =========================================================
    // INSTRUCTOR - ALL USERS (students)
    // GET /api/instructor/users
    // =========================================================

    @GetMapping("/instructor/users")
    public List<Map<String, Object>> instructorUsers(
            Authentication authentication) {

        User user = me(authentication);
        requireRole(user, Role.INSTRUCTOR, Role.ADMIN);

        return users.findAll().stream()
                .map(u -> {

                    Map<String, Object> item = new LinkedHashMap<>();

                    item.put("id", u.getId());
                    item.put("name", u.getName());
                    item.put("email", u.getEmail());
                    item.put("role", u.getRole());
                    item.put("phone", u.getPhone());
                    item.put("active", u.getActive());

                    if (u.getCourse() != null) {
                        item.put("courseId", u.getCourse().getId());
                        item.put("courseName", u.getCourse().getCourseName());
                    } else {
                        item.put("courseId", null);
                        item.put("courseName", null);
                    }

                    return item;
                })
                .collect(Collectors.toList());
    }

    // =========================================================
    // INSTRUCTOR - UPDATE OWN PROFILE
    // PUT /api/instructor/profile
    // =========================================================

    @PutMapping("/instructor/profile")
    public Map<String, Object> updateInstructorProfile(
            Authentication authentication,
            @RequestBody Map<String, Object> body) {

        User user = me(authentication);
        requireRole(user, Role.INSTRUCTOR, Role.ADMIN);

        if (body.containsKey("name") && str(body.get("name")) != null) {
            user.setName(str(body.get("name")));
        }
        if (body.containsKey("phone")) {
            user.setPhone(str(body.get("phone")));
        }
        if (body.containsKey("gender")) {
            user.setGender(str(body.get("gender")));
        }

        User saved = users.save(user);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", saved.getId());
        response.put("name", saved.getName());
        response.put("email", saved.getEmail());
        response.put("phone", saved.getPhone());
        response.put("role", saved.getRole());

        return response;
    }

    // =========================================================
    // INSTRUCTOR - CHANGE OWN PASSWORD
    // PUT /api/instructor/profile/password
    // =========================================================

    @PutMapping("/instructor/profile/password")
    public Map<String, String> changeInstructorPassword(
            Authentication authentication,
            @RequestBody Map<String, Object> body) {

        User user = me(authentication);
        requireRole(user, Role.INSTRUCTOR, Role.ADMIN);

        String currentPassword = str(body.get("currentPassword"));
        String newPassword = str(body.get("newPassword"));

        if (currentPassword == null || newPassword == null
                || currentPassword.isBlank() || newPassword.isBlank()) {
            throw new RuntimeException("Current and new passwords are required");
        }

        if (newPassword.length() < 6) {
            throw new RuntimeException("New password must be at least 6 characters");
        }

        // Verify current password
        org.springframework.security.crypto.password.PasswordEncoder encoder =
                new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder();

        if (!encoder.matches(currentPassword, user.getPassword())) {
            throw new RuntimeException("Current password is incorrect");
        }

        user.setPassword(encoder.encode(newPassword));
        users.save(user);

        return Map.of("message", "Password updated successfully");
    }

    // =========================================================
    // INSTRUCTOR - CREATE ASSIGNMENT
    // POST /api/instructor/assignments
    // =========================================================

    @PostMapping("/instructor/assignments")
    public Map<String, Object> createInstructorAssignment(
            Authentication authentication,
            @RequestBody Map<String, Object> body) {

        User user = me(authentication);
        requireRole(user, Role.INSTRUCTOR, Role.ADMIN);

        // BACKEND SECURITY: instructors may only create assignments for a
        // course the HOD has assigned to them. HTTP 403 otherwise.
        enforceInstructorCourseBody(user, body);

        // Delegate to AssignmentService through the existing controller logic
        // We call the AssignmentController's create endpoint internally
        Assignment assignment = new Assignment();
        assignment.setTitle(str(body.get("title")));
        assignment.setDescription(str(body.get("description")));

        if (body.get("maximumMarks") != null) {
            assignment.setMaximumMarks(
                    intValue(body.get("maximumMarks")) != null
                            ? intValue(body.get("maximumMarks"))
                            : 100
            );
        }

        if (body.get("dueDate") != null && str(body.get("dueDate")) != null
                && !str(body.get("dueDate")).isBlank()) {
            try {
                assignment.setDueDate(
                        java.time.LocalDateTime.parse(str(body.get("dueDate")))
                );
            } catch (Exception e) {
                // ignore parse errors
            }
        }

        // Find course by subject name if provided
        String subjectName = str(body.get("subject"));
        if (subjectName != null && !subjectName.isBlank()) {
            // Try to find a matching course
            courses.findAll().stream()
                    .filter(c -> c.getTitle() != null
                            && c.getTitle().equalsIgnoreCase(subjectName))
                    .findFirst()
                    .ifPresent(assignment::setCourse);
        }

        // Course is required for Assignment entity
        if (assignment.getCourse() == null) {
            // Try to find any course
            Course anyCourse = courses.findAll().stream().findFirst()
                    .orElseThrow(() -> new RuntimeException("No courses available. Create a course first."));
            assignment.setCourse(anyCourse);
        }

        com.aismartlms.backend.entity.Assignment saved =
                assignmentRepository.save(assignment);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", saved.getId());
        response.put("title", saved.getTitle());
        response.put("description", saved.getDescription());
        response.put("maximumMarks", saved.getMaximumMarks());
        response.put("message", "Assignment created successfully");

        return response;
    }

    // =========================================================
    // HELPERS
    // =========================================================

    private Map<String, Object> subjectWithProgress(
            Subject subject,
            List<Progress> myProgress) {

        List<Lesson> lessonList =
                lessons.findBySubjectIdOrderByLessonOrderAsc(
                        subject.getId()
                );

        List<Progress> records = myProgress.stream()
                .filter(p ->
                        p.getLesson() != null
                                && p.getLesson().getSubject() != null
                                && p.getLesson().getSubject().getId()
                                .equals(subject.getId()))
                .collect(Collectors.toList());

        int lessonCount = lessonList.size();

        int sum = records.stream()
                .mapToInt(p ->
                        p.getProgressPercentage() == null
                                ? 0
                                : p.getProgressPercentage())
                .sum();

        double percentage =
                lessonCount == 0
                        ? 0.0
                        : (sum * 100.0) / (lessonCount * 100.0);

        String status;

        if (lessonCount == 0 || records.isEmpty()) {

            status = "NOT_STARTED";

        } else {

            int max = records.stream()
                    .mapToInt(p ->
                            p.getProgressPercentage() == null
                                    ? 0
                                    : p.getProgressPercentage())
                    .max()
                    .orElse(0);

            if (max >= 100) {
                status = "COMPLETED";
            } else if (max < 30) {
                status = "STARTED";
            } else {
                status = "IN_PROGRESS";
            }
        }

        Map<String, Object> item = new LinkedHashMap<>();

        item.put("id", subject.getId());
        item.put("subjectCode", subject.getSubjectCode());
        item.put("subjectName", subject.getSubjectName());
        item.put("description", subject.getDescription());
        item.put("semester", subject.getSemester());
        item.put("lessonCount", lessonCount);
        item.put(
                "progressPercentage",
                Math.round(percentage * 10.0) / 10.0
        );
        item.put("status", status);

        return item;
    }

    private String str(Object value) {
        return value == null ? null : String.valueOf(value).trim();
    }

    private Integer intValue(Object value) {
        if (value == null) {
            return null;
        }
        try {
            return (int) Double.parseDouble(String.valueOf(value));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private Long longValue(Object value) {
        if (value == null) {
            return null;
        }
        try {
            return (long) Double.parseDouble(String.valueOf(value));
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
