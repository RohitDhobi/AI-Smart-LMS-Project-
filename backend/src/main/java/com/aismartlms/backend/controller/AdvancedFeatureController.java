package com.aismartlms.backend.controller;

import com.aismartlms.backend.entity.*;
import com.aismartlms.backend.repository.*;
import com.aismartlms.backend.service.AIQuestionService;

import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class AdvancedFeatureController {

    private final UserRepository users;
    private final CourseRepository courses;
    private final EnrollmentRepository enrollments;
    private final ProgressRepository progress;
    private final QuizAttemptRepository attempts;
    private final ReviewRepository reviews;
    private final WishlistRepository wishlists;
    private final CertificateRepository certificates;
    private final NotificationRepository notifications;
    private final PasswordResetTokenRepository resetTokens;
    private final PasswordEncoder encoder;
    private final AIQuestionService aiQuestionService;

    public AdvancedFeatureController(
            UserRepository users,
            CourseRepository courses,
            EnrollmentRepository enrollments,
            ProgressRepository progress,
            QuizAttemptRepository attempts,
            ReviewRepository reviews,
            WishlistRepository wishlists,
            CertificateRepository certificates,
            NotificationRepository notifications,
            PasswordResetTokenRepository resetTokens,
            PasswordEncoder encoder,
            AIQuestionService aiQuestionService) {

        this.users = users;
        this.courses = courses;
        this.enrollments = enrollments;
        this.progress = progress;
        this.attempts = attempts;
        this.reviews = reviews;
        this.wishlists = wishlists;
        this.certificates = certificates;
        this.notifications = notifications;
        this.resetTokens = resetTokens;
        this.encoder = encoder;
        this.aiQuestionService = aiQuestionService;
    }

    // =========================================================
    // COMMON HELPER METHODS
    // =========================================================

    private User me(Authentication authentication) {

        if (authentication == null || authentication.getName() == null) {
            throw new RuntimeException("Authentication required");
        }

        return users.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private void role(User user, Role... allowedRoles) {

        for (Role allowedRole : allowedRoles) {

            if (user.getRole() == allowedRole) {
                return;
            }
        }

        throw new RuntimeException("Access denied");
    }

    private Course course(Long id) {

        return courses.findById(id)
                .orElseThrow(() -> new RuntimeException("Course not found"));
    }

    // =========================================================
    // LEVEL 1
    // STUDENT DASHBOARD
    // =========================================================

    @GetMapping("/dashboard")
    public Map<String, Object> dashboard(Authentication authentication) {

        User user = me(authentication);

        List<Enrollment> enrollmentsList =
                enrollments.findByUser(user);

        List<Progress> progressList =
                progress.findByUserEmail(user.getEmail());

        List<QuizAttempt> attemptList =
                attempts.findByUserEmail(user.getEmail());

        long completedCourses = enrollmentsList.stream()
                .filter(enrollment -> {

                    Long courseId = enrollment.getCourse().getId();

                    List<Progress> courseProgress =
                            progressList.stream()
                                    .filter(p ->
                                            p.getLesson() != null &&
                                            p.getLesson().getCourse() != null &&
                                            p.getLesson()
                                                    .getCourse()
                                                    .getId()
                                                    .equals(courseId))
                                    .collect(Collectors.toList());

                    return !courseProgress.isEmpty()
                            && courseProgress.stream()
                            .allMatch(p ->
                                    Boolean.TRUE.equals(p.getCompleted()));
                })
                .count();

        double averageQuizScore =
                attemptList.stream()
                        .mapToDouble(QuizAttempt::getPercentage)
                        .average()
                        .orElse(0.0);

        Map<String, Object> response =
                new LinkedHashMap<>();

        response.put("studentName", user.getName());
        response.put("email", user.getEmail());
        response.put("enrolledCourses", enrollmentsList.size());
        response.put("completedCourses", completedCourses);
        response.put(
                "inProgressCourses",
                enrollmentsList.size() - completedCourses
        );
        response.put("averageQuizScore", averageQuizScore);

        List<Map<String, Object>> courseList =
                enrollmentsList.stream()
                        .map(enrollment -> {

                            Course course =
                                    enrollment.getCourse();

                            Long courseId =
                                    course.getId();

                            List<Progress> courseProgress =
                                    progressList.stream()
                                            .filter(p ->
                                                    p.getLesson() != null &&
                                                    p.getLesson()
                                                            .getCourse() != null &&
                                                    p.getLesson()
                                                            .getCourse()
                                                            .getId()
                                                            .equals(courseId))
                                            .collect(Collectors.toList());

                            double percentage =
                                    courseProgress.stream()
                                            .mapToInt(p ->
                                                    p.getProgressPercentage() == null
                                                            ? 0
                                                            : p.getProgressPercentage())
                                            .average()
                                            .orElse(0.0);

                            Map<String, Object> item =
                                    new LinkedHashMap<>();

                            item.put("courseId", courseId);
                            item.put("title", course.getTitle());
                            item.put(
                                    "progressPercentage",
                                    percentage
                            );
                            item.put(
                                    "completed",
                                    percentage >= 100
                            );

                            return item;
                        })
                        .collect(Collectors.toList());

        response.put("courses", courseList);

        return response;
    }

    // =========================================================
    // LEVEL 2
    // COURSE SEARCH
    // =========================================================

    @GetMapping("/courses/search")
    public List<Course> searchCourses(
            @RequestParam String keyword) {

        String term =
                keyword == null
                        ? ""
                        : keyword.trim();

        if (term.isBlank()) {
            return courses.findAll();
        }

        // Text match: title, description, instructor,
        // category and difficulty.

        List<Course> results =
                new ArrayList<>(
                        courses.findByTitleContainingIgnoreCaseOrDescriptionContainingIgnoreCaseOrInstructorContainingIgnoreCaseOrCategoryContainingIgnoreCaseOrDifficultyContainingIgnoreCase(
                                term,
                                term,
                                term,
                                term,
                                term
                        )
                );

        // Price match: "free" means price 0,
        // a numeric keyword matches an exact price.

        Double price = null;

        if ("free".equalsIgnoreCase(term)) {
            price = 0.0;
        } else {

            try {
                price = Double.parseDouble(term);
            } catch (NumberFormatException ignored) {
                price = null;
            }
        }

        if (price != null) {

            // "free" also matches courses without a price,
            // since the UI displays them as Free.

            List<Course> byPrice =
                    new ArrayList<>(
                            courses.findByPrice(price)
                    );

            if ("free".equalsIgnoreCase(term)) {
                byPrice.addAll(
                        courses.findByPriceIsNull()
                );
            }

            for (Course course : byPrice) {

                boolean alreadyListed =
                        results.stream()
                                .anyMatch(existing ->
                                        existing.getId().equals(course.getId())
                                );

                if (!alreadyListed) {
                    results.add(course);
                }
            }
        }

        return results;
    }

    // =========================================================
    // COURSE CATEGORY
    // =========================================================

    @GetMapping("/courses/category/{category}")
    public List<Course> coursesByCategory(
            @PathVariable String category) {

        return courses.findByCategoryIgnoreCase(category);
    }

    // =========================================================
    // COURSE FILTER
    // =========================================================

    @GetMapping("/courses/filter")
    public List<Course> filterCourses(

            @RequestParam(required = false)
            String category,

            @RequestParam(required = false)
            String difficulty,

            @RequestParam(required = false)
            String instructor,

            @RequestParam(required = false)
            String status) {

        return courses.findAll()
                .stream()

                .filter(course ->
                        category == null ||
                        category.isBlank() ||
                        (
                                course.getCategory() != null &&
                                course.getCategory()
                                        .equalsIgnoreCase(category)
                        ))

                .filter(course ->
                        difficulty == null ||
                        difficulty.isBlank() ||
                        (
                                course.getDifficulty() != null &&
                                course.getDifficulty()
                                        .equalsIgnoreCase(difficulty)
                        ))

                .filter(course ->
                        instructor == null ||
                        instructor.isBlank() ||
                        (
                                course.getInstructor() != null &&
                                course.getInstructor()
                                        .equalsIgnoreCase(instructor)
                        ))

                .filter(course ->
                        status == null ||
                        status.isBlank() ||
                        (
                                course.getStatus() != null &&
                                course.getStatus()
                                        .equalsIgnoreCase(status)
                        ))

                .collect(Collectors.toList());
    }

    // =========================================================
    // COURSE CATEGORIES
    // =========================================================

    @GetMapping("/categories")
    public List<String> categories() {

        return courses.findAll()
                .stream()
                .map(Course::getCategory)
                .filter(Objects::nonNull)
                .filter(category -> !category.isBlank())
                .distinct()
                .sorted()
                .collect(Collectors.toList());
    }

    // =========================================================
    // STUDENT PROFILE
    // =========================================================

    @GetMapping("/profile")
    public Map<String, Object> profile(
            Authentication authentication) {

        User user = me(authentication);

        Map<String, Object> response =
                new LinkedHashMap<>();

        response.put("id", user.getId());
        response.put("name", user.getName());
        response.put("email", user.getEmail());
        response.put("role", user.getRole());
        response.put("phone", user.getPhone());
        response.put("bio", user.getBio());
        response.put("active", user.getActive());
        response.put("gender", user.getGender());
        response.put("dateOfBirth", user.getDateOfBirth());

        if (user.getCourse() != null) {
            response.put("courseId", user.getCourse().getId());
            response.put("courseName", user.getCourse().getCourseName());
            response.put("courseCode", user.getCourse().getCourseCode());
        } else {
            response.put("courseId", null);
            response.put("courseName", null);
            response.put("courseCode", null);
        }

        return response;
    }

    // =========================================================
    // UPDATE PROFILE
    // =========================================================

    @PutMapping("/profile")
    public User updateProfile(
            Authentication authentication,
            @RequestBody Map<String, String> body) {

        User user = me(authentication);

        if (body.containsKey("name")) {
            user.setName(body.get("name"));
        }

        if (body.containsKey("phone")) {
            user.setPhone(body.get("phone"));
        }

        if (body.containsKey("bio")) {
            user.setBio(body.get("bio"));
        }

        if (body.containsKey("gender")) {
            user.setGender(body.get("gender"));
        }

        if (body.containsKey("dateOfBirth")
                && body.get("dateOfBirth") != null
                && !String.valueOf(body.get("dateOfBirth")).isBlank()) {

            try {
                user.setDateOfBirth(
                        java.time.LocalDate.parse(
                                String.valueOf(body.get("dateOfBirth"))
                        )
                );
            } catch (Exception ignored) {
                // ignore malformed dates
            }
        }

        return users.save(user);
    }

    // =========================================================
    // CHANGE PASSWORD
    // =========================================================

    @PutMapping("/profile/password")
    public Map<String, String> changePassword(
            Authentication authentication,
            @RequestBody Map<String, String> body) {

        User user = me(authentication);

        String currentPassword =
                body.getOrDefault("currentPassword", "");

        String newPassword =
                body.getOrDefault("newPassword", "");

        if (newPassword.isBlank()) {
            throw new RuntimeException(
                    "New password is required"
            );
        }

        if (!encoder.matches(
                currentPassword,
                user.getPassword())) {

            throw new RuntimeException(
                    "Current password is incorrect"
            );
        }

        user.setPassword(
                encoder.encode(newPassword)
        );

        users.save(user);

        return Map.of(
                "message",
                "Password changed successfully"
        );
    }

    // =========================================================
    // LEVEL 2
    // WISHLIST
    // =========================================================

    @PostMapping("/wishlist/{courseId}")
    public Map<String, Object> addWishlist(
            Authentication authentication,
            @PathVariable Long courseId) {

        User user = me(authentication);

        Course course = course(courseId);

        if (wishlists
                .findByUserAndCourse(user, course)
                .isEmpty()) {

            Wishlist wishlist =
                    new Wishlist();

            wishlist.setUser(user);
            wishlist.setCourse(course);

            wishlists.save(wishlist);
        }

        return Map.of(
                "message",
                "Course added to wishlist"
        );
    }

    // =========================================================
    // REMOVE WISHLIST
    // =========================================================

    @DeleteMapping("/wishlist/{courseId}")
    public Map<String, String> removeWishlist(
            Authentication authentication,
            @PathVariable Long courseId) {

        User user = me(authentication);

        Course course = course(courseId);

        wishlists
                .findByUserAndCourse(user, course)
                .ifPresent(wishlists::delete);

        return Map.of(
                "message",
                "Course removed from wishlist"
        );
    }

    // =========================================================
    // GET WISHLIST
    // =========================================================

    @GetMapping("/wishlist")
    public List<Map<String, Object>> wishlist(
            Authentication authentication) {

        User user = me(authentication);

        return wishlists
                .findByUser(user)
                .stream()
                .map(wishlist -> {

                    Map<String, Object> item =
                            new LinkedHashMap<>();

                    item.put(
                            "courseId",
                            wishlist.getCourse().getId()
                    );

                    item.put(
                            "title",
                            wishlist.getCourse().getTitle()
                    );

                    item.put(
                            "category",
                            String.valueOf(
                                    wishlist.getCourse().getCategory()
                            )
                    );

                    return item;
                })
                .collect(Collectors.toList());
    }

    // =========================================================
    // REVIEWS & RATINGS
    // =========================================================

    @PostMapping("/courses/{courseId}/reviews")
    public Review addReview(
            Authentication authentication,
            @PathVariable Long courseId,
            @RequestBody Map<String, Object> body) {

        User user = me(authentication);

        Course course = course(courseId);

        if (!enrollments.existsByUserAndCourse(
                user,
                course)) {

            throw new RuntimeException(
                    "Enroll in course first"
            );
        }

        Review review =
                reviews.findByUserAndCourse(
                        user,
                        course
                ).orElseGet(Review::new);

        review.setUser(user);
        review.setCourse(course);

        int rating =
                Integer.parseInt(
                        String.valueOf(
                                body.getOrDefault(
                                        "rating",
                                        "1"
                                )
                        )
                );

        rating = Math.max(
                1,
                Math.min(5, rating)
        );

        review.setRating(rating);

        review.setComment(
                String.valueOf(
                        body.getOrDefault(
                                "comment",
                                ""
                        )
                )
        );

        return reviews.save(review);
    }

    // =========================================================
    // GET COURSE REVIEWS
    // =========================================================

    @GetMapping("/courses/{courseId}/reviews")
    public Map<String, Object> courseReviews(
            @PathVariable Long courseId) {

        List<Review> reviewList =
                reviews.findByCourseId(courseId);

        double averageRating =
                reviewList.stream()
                        .mapToInt(Review::getRating)
                        .average()
                        .orElse(0.0);

        Map<String, Object> response =
                new LinkedHashMap<>();

        response.put(
                "averageRating",
                averageRating
        );

        response.put(
                "count",
                reviewList.size()
        );

        response.put(
                "reviews",
                reviewList
        );

        return response;
    }

    // =========================================================
    // LEVEL 3
    // INSTRUCTOR DASHBOARD
    // =========================================================

    @GetMapping("/instructor/dashboard")
    public Map<String, Object> instructorDashboard(
            Authentication authentication) {

        User user = me(authentication);

        role(
                user,
                Role.INSTRUCTOR,
                Role.ADMIN
        );

        List<Course> courseList;

        if (user.getRole() == Role.ADMIN) {

            courseList = courses.findAll();

        } else {

            courseList =
                    courses.findByInstructorIgnoreCase(
                            user.getName()
                    );
        }

        long students =
                courseList.stream()
                        .flatMap(course ->
                                enrollments
                                        .findByCourse(course)
                                        .stream()
                        )
                        .map(enrollment ->
                                enrollment.getUser().getId()
                        )
                        .distinct()
                        .count();

        int lessonCount =
                courseList.stream()
                        .mapToInt(course ->
                                course.getLessons() == null
                                        ? 0
                                        : course.getLessons().size()
                        )
                        .sum();

        long approvedCourses =
                courseList.stream()
                        .filter(course ->
                                "APPROVED"
                                        .equalsIgnoreCase(
                                                course.getStatus()
                                        ))
                        .count();

        long pendingCourses =
                courseList.stream()
                        .filter(course ->
                                "PENDING"
                                        .equalsIgnoreCase(
                                                course.getStatus()
                                        ))
                        .count();

        Map<String, Object> response =
                new LinkedHashMap<>();

        response.put(
                "courses",
                courseList.size()
        );

        response.put(
                "students",
                students
        );

        response.put(
                "lessons",
                lessonCount
        );

        response.put(
                "approvedCourses",
                approvedCourses
        );

        response.put(
                "pendingCourses",
                pendingCourses
        );

        return response;
    }

    // =========================================================
    // COURSE APPROVAL
    // =========================================================

    @PutMapping("/courses/{id}/status")
    public Course courseStatus(
            Authentication authentication,
            @PathVariable Long id,
            @RequestParam String status) {

        User user = me(authentication);

        role(user, Role.ADMIN);

        Course course = course(id);

        course.setStatus(
                status.toUpperCase()
        );

        return courses.save(course);
    }

    // =========================================================
    // PENDING COURSES
    // =========================================================

    @GetMapping("/admin/pending-courses")
    public List<Course> pendingCourses(
            Authentication authentication) {

        role(me(authentication), Role.ADMIN);

        return courses.findByStatusIgnoreCase(
                "PENDING"
        );
    }

    // =========================================================
    // LEVEL 4
    // CERTIFICATE GENERATION
    // =========================================================

    @PostMapping("/certificates/course/{courseId}")
    public Certificate generateCertificate(
            Authentication authentication,
            @PathVariable Long courseId) {

        User user = me(authentication);

        Course course = course(courseId);

        if (!enrollments.existsByUserAndCourse(
                user,
                course)) {

            throw new RuntimeException(
                    "Not enrolled"
            );
        }

        List<Progress> progressList =
                progress.findByUserEmailAndLessonCourseId(
                        user.getEmail(),
                        courseId
                );

        if (course.getLessons() != null
                && !course.getLessons().isEmpty()) {

            boolean allCompleted =
                    !progressList.isEmpty()
                            && progressList.size()
                            >= course.getLessons().size()
                            && progressList.stream()
                            .allMatch(progress ->
                                    Boolean.TRUE.equals(
                                            progress.getCompleted()
                                    ));

            if (!allCompleted) {

                throw new RuntimeException(
                        "Complete all lessons first"
                );
            }
        }

        Certificate existing =
                certificates
                        .findByUser(user)
                        .stream()
                        .filter(certificate ->
                                certificate
                                        .getCourse()
                                        .getId()
                                        .equals(courseId))
                        .findFirst()
                        .orElse(null);

        if (existing != null) {
            return existing;
        }

        Certificate certificate =
                new Certificate();

        certificate.setCertificateId(
                "CERT-" +
                        UUID.randomUUID()
                                .toString()
                                .substring(0, 8)
                                .toUpperCase()
        );

        certificate.setUser(user);
        certificate.setCourse(course);

        Certificate saved =
                certificates.save(certificate);

        Notification notification =
                new Notification();

        notification.setUser(user);

        notification.setTitle(
                "Course Completed"
        );

        notification.setMessage(
                "Congratulations! Your certificate for "
                        + course.getTitle()
                        + " is ready."
        );

        notifications.save(notification);

        return saved;
    }

    // =========================================================
    // GET MY CERTIFICATES
    // =========================================================

    @GetMapping("/certificates")
    public List<Certificate> certificates(
            Authentication authentication) {

        return certificates.findByUser(
                me(authentication)
        );
    }

    // =========================================================
    // VERIFY CERTIFICATE
    // =========================================================

    @GetMapping("/certificates/verify/{id}")
    public Map<String, Object> verifyCertificate(
            @PathVariable String id) {

        Optional<Certificate> certificate =
                certificates.findByCertificateId(id);

        if (certificate.isEmpty()) {

            return Map.of(
                    "valid",
                    false
            );
        }

        Certificate result =
                certificate.get();

        Map<String, Object> response =
                new LinkedHashMap<>();

        response.put(
                "valid",
                true
        );

        response.put(
                "certificateId",
                id
        );

        response.put(
                "student",
                result.getUser().getName()
        );

        response.put(
                "course",
                result.getCourse().getTitle()
        );

        response.put(
                "issuedAt",
                result.getIssuedAt()
        );

        return response;
    }

    // =========================================================
    // LEVEL 6
    // NOTIFICATIONS
    // =========================================================

    @GetMapping("/notifications")
    public List<Notification> notifications(
            Authentication authentication) {

        return notifications
                .findByUserOrderByCreatedAtDesc(
                        me(authentication)
                );
    }

    // =========================================================
    // MARK NOTIFICATION AS READ
    // =========================================================

    @PutMapping("/notifications/{id}/read")
    public Map<String, String> readNotification(
            Authentication authentication,
            @PathVariable Long id) {

        User user = me(authentication);

        Notification notification =
                notifications
                        .findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Notification not found"
                                ));

        if (!notification
                .getUser()
                .getId()
                .equals(user.getId())) {

            throw new RuntimeException(
                    "Access denied"
            );
        }

        notification.setReadFlag(true);

        notifications.save(notification);

        return Map.of(
                "message",
                "Notification marked as read"
        );
    }

    // =========================================================
    // LEVEL 7
    // ADMIN DASHBOARD
    // =========================================================

    @GetMapping("/admin/dashboard")
    public Map<String, Object> adminDashboard(
            Authentication authentication) {

        role(
                me(authentication),
                Role.ADMIN
        );

        long students =
                users.findAll()
                        .stream()
                        .filter(user ->
                                user.getRole()
                                        == Role.STUDENT)
                        .count();

        long instructors =
                users.findAll()
                        .stream()
                        .filter(user ->
                                user.getRole()
                                        == Role.INSTRUCTOR)
                        .count();

        Map<String, Object> response =
                new LinkedHashMap<>();

        response.put(
                "totalUsers",
                users.count()
        );

        response.put(
                "students",
                students
        );

        response.put(
                "instructors",
                instructors
        );

        response.put(
                "courses",
                courses.count()
        );

        response.put(
                "enrollments",
                enrollments.count()
        );

        response.put(
                "quizAttempts",
                attempts.count()
        );

        return response;
    }

    // =========================================================
    // ADMIN - ALL USERS
    // =========================================================

    @GetMapping("/admin/users")
    public List<User> allUsers(
            Authentication authentication) {

        role(
                me(authentication),
                Role.ADMIN
        );

        return users.findAll();
    }

    // =========================================================
    // ADMIN - CREATE INSTRUCTOR / TEACHER ACCOUNT
    // =========================================================

    @PostMapping("/admin/users")
    public User createInstructor(
            Authentication authentication,
            @RequestBody com.aismartlms.backend.dto.InstructorRequest request) {

        role(
                me(authentication),
                Role.ADMIN
        );

        // Check for duplicate email
        if (users.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException(
                    "A user with this email already exists"
            );
        }

        User instructor = new User();
        instructor.setName(request.getName());
        instructor.setEmail(request.getEmail());
        instructor.setPassword(encoder.encode(request.getPassword()));
        instructor.setRole(Role.INSTRUCTOR);
        instructor.setActive(true);
        instructor.setPhone(request.getPhone());
        instructor.setBio(request.getBio());

        return users.save(instructor);
    }

    // =========================================================
    // ADMIN - CHANGE A USER'S ROLE
    // PUT /api/admin/users/{id}/role    body: { "role": "INSTRUCTOR" }
    // =========================================================

    @PutMapping("/admin/users/{id}/role")
    public User updateUserRole(
            Authentication authentication,
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {

        User actor = me(authentication);

        role(actor, Role.ADMIN);

        String value = body.get("role");

        Role newRole;

        try {
            newRole = Role.valueOf(
                    value == null ? "" : value.trim().toUpperCase()
            );
        } catch (IllegalArgumentException e) {
            throw new RuntimeException(
                    "Unknown role '" + value +
                    "' (expected STUDENT, INSTRUCTOR or ADMIN)"
            );
        }

        User user = users.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Safety: an admin must not be able to demote themselves out of
        // the last admin account and lock everyone out of admin ops.
        if (user.getId().equals(actor.getId()) && newRole != Role.ADMIN) {
            throw new RuntimeException(
                    "You cannot remove your own ADMIN role"
            );
        }

        user.setRole(newRole);

        return users.save(user);
    }

    // =========================================================
    // ADMIN - ACTIVATE / DEACTIVATE USER
    // =========================================================

    @PutMapping("/admin/users/{id}/active")
    public User activeUser(
            Authentication authentication,
            @PathVariable Long id,
            @RequestParam boolean active) {

        role(
                me(authentication),
                Role.ADMIN
        );

        User user =
                users.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "User not found"
                                ));

        user.setActive(active);

        return users.save(user);
    }

    // =========================================================
    // ADMIN - DELETE USER
    // =========================================================

    @DeleteMapping("/admin/users/{id}")
    public Map<String, String> deleteUser(
            Authentication authentication,
            @PathVariable Long id) {

        role(
                me(authentication),
                Role.ADMIN
        );

        if (!users.existsById(id)) {

            throw new RuntimeException(
                    "User not found"
            );
        }

        users.deleteById(id);

        return Map.of(
                "message",
                "User deleted"
        );
    }

    // =========================================================
    // ADMIN - RESET USER PASSWORD
    // PUT /api/admin/users/{id}/reset-password
    // =========================================================

    @PutMapping("/admin/users/{id}/reset-password")
    public Map<String, String> resetUserPassword(
            Authentication authentication,
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {

        role(
                me(authentication),
                Role.ADMIN
        );

        String newPassword = body.get("password");

        if (newPassword == null || newPassword.isBlank()) {
            throw new RuntimeException("New password is required");
        }

        if (newPassword.length() < 6) {
            throw new RuntimeException("Password must be at least 6 characters");
        }

        User user = users.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setPassword(encoder.encode(newPassword));
        users.save(user);

        return Map.of(
                "message",
                "Password reset successfully for " + user.getName()
        );
    }

    // =========================================================
    // ADMIN REPORTS
    // =========================================================

    @GetMapping("/admin/reports")
    public Map<String, Object> reports(
            Authentication authentication) {

        role(
                me(authentication),
                Role.ADMIN
        );

        double averageQuizScore =
                attempts.findAll()
                        .stream()
                        .mapToDouble(
                                QuizAttempt::getPercentage
                        )
                        .average()
                        .orElse(0.0);

        long completedLessons =
                progress.findAll()
                        .stream()
                        .filter(progress ->
                                Boolean.TRUE.equals(
                                        progress.getCompleted()
                                ))
                        .count();

        Map<String, Object> response =
                new LinkedHashMap<>();

        response.put(
                "averageQuizScore",
                averageQuizScore
        );

        response.put(
                "completedLessons",
                completedLessons
        );

        response.put(
                "totalProgressRecords",
                progress.count()
        );

        response.put(
                "totalReviews",
                reviews.count()
        );

        response.put(
                "totalCertificates",
                certificates.count()
        );

        return response;
    }

    // =========================================================
    // LEVEL 8
    // FORGOT PASSWORD
    // =========================================================

    @PostMapping("/auth/forgot-password")
    public Map<String, String> forgotPassword(
            @RequestBody Map<String, String> body) {

        String email =
                body.get("email");

        if (email == null || email.isBlank()) {

            throw new RuntimeException(
                    "Email is required"
            );
        }

        User user =
                users.findByEmail(email)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Email not found"
                                ));

        PasswordResetToken token =
                new PasswordResetToken();

        token.setToken(
                UUID.randomUUID().toString()
        );

        token.setUser(user);

        token.setExpiresAt(
                LocalDateTime.now()
                        .plusMinutes(30)
        );

        resetTokens.save(token);

        return Map.of(
                "message",
                "Reset token created. Demo mode: use the token below.",
                "token",
                token.getToken()
        );
    }

    // =========================================================
    // RESET PASSWORD
    // =========================================================

    @PostMapping("/auth/reset-password")
    public Map<String, String> resetPassword(
            @RequestBody Map<String, String> body) {

        String tokenValue =
                body.get("token");

        String newPassword =
                body.get("newPassword");

        if (tokenValue == null
                || tokenValue.isBlank()) {

            throw new RuntimeException(
                    "Reset token is required"
            );
        }

        if (newPassword == null
                || newPassword.isBlank()) {

            throw new RuntimeException(
                    "New password is required"
            );
        }

        PasswordResetToken token =
                resetTokens
                        .findByToken(tokenValue)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Invalid reset token"
                                ));

        if (token.getExpiresAt() == null
                || token.getExpiresAt()
                .isBefore(LocalDateTime.now())) {

            throw new RuntimeException(
                    "Reset token expired"
            );
        }

        User user =
                token.getUser();

        user.setPassword(
                encoder.encode(newPassword)
        );

        users.save(user);

        resetTokens.delete(token);

        return Map.of(
                "message",
                "Password reset successfully"
        );
    }

    // =========================================================
    // LEVEL 9
    // STUDENT ANALYTICS
    // =========================================================

    @GetMapping("/analytics/student")
    public Map<String, Object> studentAnalytics(
            Authentication authentication) {

        User user = me(authentication);

        List<Enrollment> enrollmentList =
                enrollments.findByUser(user);

        List<Progress> progressList =
                progress.findByUserEmail(
                        user.getEmail()
                );

        List<QuizAttempt> attemptList =
                attempts.findByUserEmail(
                        user.getEmail()
                );

        double averageProgress =
                progressList.stream()
                        .mapToInt(progress ->
                                progress.getProgressPercentage() == null
                                        ? 0
                                        : progress.getProgressPercentage())
                        .average()
                        .orElse(0.0);

        double averageQuizScore =
                attemptList.stream()
                        .mapToDouble(
                                QuizAttempt::getPercentage
                        )
                        .average()
                        .orElse(0.0);

        double highestQuizScore =
                attemptList.stream()
                        .mapToDouble(
                                QuizAttempt::getPercentage
                        )
                        .max()
                        .orElse(0.0);

        long completedLessons =
                progressList.stream()
                        .filter(progress ->
                                Boolean.TRUE.equals(
                                        progress.getCompleted()
                                ))
                        .count();

        Map<String, Object> response =
                new LinkedHashMap<>();

        response.put(
                "studentName",
                user.getName()
        );

        response.put(
                "email",
                user.getEmail()
        );

        response.put(
                "enrolledCourses",
                enrollmentList.size()
        );

        response.put(
                "completedLessons",
                completedLessons
        );

        response.put(
                "averageCourseProgress",
                averageProgress
        );

        response.put(
                "averageQuizScore",
                averageQuizScore
        );

        response.put(
                "highestQuizScore",
                highestQuizScore
        );

        response.put(
                "totalQuizAttempts",
                attemptList.size()
        );

        return response;
    }

    // =========================================================
    // COURSE ANALYTICS
    // =========================================================

    @GetMapping("/analytics/course/{courseId}")
    public Map<String, Object> courseAnalytics(
            Authentication authentication,
            @PathVariable Long courseId) {

        User user = me(authentication);

        role(
                user,
                Role.INSTRUCTOR,
                Role.ADMIN
        );

        Course course = course(courseId);

        List<Enrollment> enrollmentList =
                enrollments.findByCourse(course);

        List<Progress> progressList =
                progress.findAll()
                        .stream()
                        .filter(progress ->
                                progress.getLesson() != null &&
                                progress.getLesson()
                                        .getCourse() != null &&
                                progress.getLesson()
                                        .getCourse()
                                        .getId()
                                        .equals(courseId))
                        .collect(Collectors.toList());

        double averageProgress =
                progressList.stream()
                        .mapToInt(progress ->
                                progress.getProgressPercentage() == null
                                        ? 0
                                        : progress.getProgressPercentage())
                        .average()
                        .orElse(0.0);

        double completionRate = 0.0;

        if (!progressList.isEmpty()) {

            long completed =
                    progressList.stream()
                            .filter(progress ->
                                    Boolean.TRUE.equals(
                                            progress.getCompleted()
                                    ))
                            .count();

            completionRate =
                    completed * 100.0
                            / progressList.size();
        }

        Map<String, Object> response =
                new LinkedHashMap<>();

        response.put(
                "courseId",
                courseId
        );

        response.put(
                "title",
                course.getTitle()
        );

        response.put(
                "enrollments",
                enrollmentList.size()
        );

        response.put(
                "lessons",
                course.getLessons() == null
                        ? 0
                        : course.getLessons().size()
        );

        response.put(
                "averageProgress",
                averageProgress
        );

        response.put(
                "completionRate",
                completionRate
        );

        response.put(
                "reviews",
                reviews.findByCourseId(courseId)
                        .size()
        );

        return response;
    }

    // =========================================================
    // ADMIN ANALYTICS
    // =========================================================

    @GetMapping("/analytics/admin")
    public Map<String, Object> adminAnalytics(
            Authentication authentication) {

        role(
                me(authentication),
                Role.ADMIN
        );

        Map<String, Object> response =
                new LinkedHashMap<>();

        response.put(
                "users",
                users.count()
        );

        response.put(
                "courses",
                courses.count()
        );

        response.put(
                "enrollments",
                enrollments.count()
        );

        response.put(
                "quizAttempts",
                attempts.count()
        );

        response.put(
                "certificates",
                certificates.count()
        );

        response.put(
                "reviews",
                reviews.count()
        );

        return response;
    }

    // =========================================================
    // LEVEL 5
    // AI COURSE RECOMMENDATIONS
    // =========================================================

    @GetMapping("/ai/recommendations")
    public List<Course> recommendations(
            Authentication authentication) {

        User user = me(authentication);

        Set<Long> enrolledCourseIds =
                enrollments
                        .findByUser(user)
                        .stream()
                        .map(enrollment ->
                                enrollment
                                        .getCourse()
                                        .getId())
                        .collect(Collectors.toSet());

        String signal =
                attempts
                        .findByUserEmail(
                                user.getEmail()
                        )
                        .stream()
                        .min(
                                Comparator.comparingDouble(
                                        QuizAttempt::getPercentage
                                )
                        )
                        .map(attempt ->
                                attempt
                                        .getQuiz()
                                        .getTitle()
                        )
                        .orElse("");

        return courses.findAll()
                .stream()

                .filter(course ->
                        !enrolledCourseIds
                                .contains(course.getId()))

                .filter(course ->
                        "APPROVED"
                                .equalsIgnoreCase(
                                        course.getStatus()
                                ))

                .sorted(
                        (course1, course2) ->
                                Boolean.compare(
                                        match(course2, signal),
                                        match(course1, signal)
                                )
                )

                .limit(5)

                .collect(Collectors.toList());
    }

    private boolean match(
            Course course,
            String signal) {

        String searchableText =
                (
                        course.getTitle()
                                + " "
                                + course.getDescription()
                                + " "
                                + String.valueOf(
                                course.getCategory()
                        )
                ).toLowerCase();

        for (String word :
                signal.toLowerCase()
                        .split("\\W+")) {

            if (word.length() > 2
                    && searchableText.contains(word)) {

                return true;
            }
        }

        return false;
    }

    // =========================================================
    // AI WEAK TOPICS
    // =========================================================

    @GetMapping("/ai/weak-topics")
    public List<Map<String, Object>> weakTopics(
            Authentication authentication) {

        User user = me(authentication);

        return attempts
                .findByUserEmail(
                        user.getEmail()
                )
                .stream()

                .filter(attempt ->
                        attempt.getPercentage() < 60)

                .map(attempt -> {

                    Map<String, Object> result =
                            new LinkedHashMap<>();

                    result.put(
                            "topic",
                            attempt
                                    .getQuiz()
                                    .getTitle()
                    );

                    result.put(
                            "score",
                            attempt.getPercentage()
                    );

                    result.put(
                            "recommendation",
                            "Review this topic and retry the quiz."
                    );

                    return result;
                })

                .collect(Collectors.toList());
    }

    // =========================================================
    // AI PERSONALIZED LEARNING PATH
    // =========================================================

    @GetMapping("/ai/learning-path")
    public List<Map<String, Object>> learningPath(
            Authentication authentication) {

        User user = me(authentication);

        Set<Long> completedCourseIds =
                enrollments
                        .findByUser(user)
                        .stream()

                        .filter(enrollment -> {

                            List<Progress> progressList =
                                    progress
                                            .findByUserEmailAndLessonCourseId(
                                                    user.getEmail(),
                                                    enrollment
                                                            .getCourse()
                                                            .getId()
                                            );

                            Course course =
                                    enrollment.getCourse();

                            return course.getLessons() != null
                                    && !course.getLessons().isEmpty()
                                    && progressList.size()
                                    >= course.getLessons().size()
                                    && progressList.stream()
                                    .allMatch(progress ->
                                            Boolean.TRUE.equals(
                                                    progress.getCompleted()
                                            ));
                        })

                        .map(enrollment ->
                                enrollment
                                        .getCourse()
                                        .getId())

                        .collect(Collectors.toSet());

        return courses.findAll()
                .stream()

                .filter(course ->
                        "APPROVED"
                                .equalsIgnoreCase(
                                        course.getStatus()
                                ))

                .sorted(
                        Comparator.comparing(
                                Course::getId
                        )
                )

                .limit(8)

                .map(course -> {

                    Map<String, Object> result =
                            new LinkedHashMap<>();

                    result.put(
                            "courseId",
                            course.getId()
                    );

                    result.put(
                            "title",
                            course.getTitle()
                    );

                    result.put(
                            "status",
                            completedCourseIds
                                    .contains(course.getId())
                                    ? "COMPLETED"
                                    : "RECOMMENDED"
                    );

                    return result;
                })

                .collect(Collectors.toList());
    }

    // =========================================================
    // AI QUIZ RECOMMENDATIONS
    // =========================================================

    @GetMapping("/ai/quiz-recommendations")
    public List<Map<String, Object>> quizRecommendations(
            Authentication authentication) {

        return weakTopics(authentication)
                .stream()
                .map(topic -> {

                    Map<String, Object> result =
                            new LinkedHashMap<>();

                    result.put(
                            "topic",
                            topic.get("topic")
                    );

                    result.put(
                            "reason",
                            "Low quiz score"
                    );

                    result.put(
                            "action",
                            "Practice this quiz again"
                    );

                    return result;
                })
                .collect(Collectors.toList());
    }

    // =========================================================
    // AI STUDY ASSISTANT
    // =========================================================

    @PostMapping("/ai/study-assistant")
    public Map<String, String> studyAssistant(
            @RequestBody Map<String, String> body) {

        String question =
                body.getOrDefault(
                        "question",
                        ""
                );

        String lowerQuestion =
                question.toLowerCase();

        String answer;

        if (lowerQuestion.contains("dependency injection")) {
            answer = "Dependency Injection (DI) is a design pattern where an object receives its dependencies from external sources rather than creating them itself.\n\n" +
                    "In Spring, DI is achieved through:\n" +
                    "1. Constructor Injection - dependencies passed via constructor (recommended)\n" +
                    "2. Setter Injection - dependencies set via setter methods\n" +
                    "3. Field Injection - using @Autowired directly on fields\n\n" +
                    "Benefits: Loose coupling, easier testing (mock injection), flexible configuration, and better separation of concerns.\n\n" +
                    "Example: Instead of a Service creating its own Repository, the Repository is injected by the Spring container.";

        } else if (lowerQuestion.contains("jwt") || lowerQuestion.contains("json web token")) {
            answer = "JWT (JSON Web Token) is a compact, URL-safe token format for securely transmitting information between parties as a JSON object.\n\n" +
                    "Structure: Header.Payload.Signature\n" +
                    "- Header: algorithm and token type\n" +
                    "- Payload: claims (user data, expiry, issuer)\n" +
                    "- Signature: ensures token integrity\n\n" +
                    "Common use cases:\n" +
                    "- Authentication: After login, server issues a JWT\n" +
                    "- Authorization: Client sends JWT in Authorization header\n" +
                    "- Stateless sessions: No server-side session storage needed\n\n" +
                    "Security tips: Use short expiry, refresh tokens, and never store sensitive data in the payload.";

        } else if (lowerQuestion.contains("jpa") || lowerQuestion.contains("hibernate")) {
            answer = "JPA (Java Persistence API) is a specification for ORM (Object-Relational Mapping) in Java.\n\n" +
                    "Key concepts:\n" +
                    "- @Entity: Maps a class to a database table\n" +
                    "- @Id: Marks the primary key\n" +
                    "- @GeneratedValue: Auto-generates ID values\n" +
                    "- @OneToMany / @ManyToOne: Define relationships\n\n" +
                    "Spring Data JPA provides:\n" +
                    "- Repository pattern with CRUD operations out of the box\n" +
                    "- Query derivation from method names\n" +
                    "- @Query for custom JPQL/SQL\n\n" +
                    "Hibernate is the most popular JPA implementation.";

        } else if (lowerQuestion.contains("oop") || lowerQuestion.contains("object oriented") || lowerQuestion.contains("object-oriented")) {
            answer = "Object-Oriented Programming (OOP) is a programming paradigm based on the concept of objects.\n\n" +
                    "Four pillars of OOP:\n" +
                    "1. Encapsulation - Bundling data and methods, restricting direct access\n" +
                    "2. Abstraction - Hiding complexity, showing only essential features\n" +
                    "3. Inheritance - Creating new classes from existing ones (is-a relationship)\n" +
                    "4. Polymorphism - One interface, multiple implementations\n\n" +
                    "Example: A 'Vehicle' parent class with 'Car' and 'Bicycle' children, each overriding 'drive()' differently.\n\n" +
                    "Practice tip: Try implementing all four pillars in a small project like a banking system.";

        } else if (lowerQuestion.contains("sql") || lowerQuestion.contains("database") || lowerQuestion.contains("dbms")) {
            answer = "SQL (Structured Query Language) is used to manage and query relational databases.\n\n" +
                    "Essential commands:\n" +
                    "- SELECT: Retrieve data\n" +
                    "- INSERT: Add new records\n" +
                    "- UPDATE: Modify existing records\n" +
                    "- DELETE: Remove records\n" +
                    "- JOIN: Combine data from multiple tables\n\n" +
                    "Key concepts:\n" +
                    "- Normalization: Organizing data to reduce redundancy (1NF, 2NF, 3NF, BCNF)\n" +
                    "- Indexes: Speed up query performance\n" +
                    "- ACID properties: Atomicity, Consistency, Isolation, Durability\n\n" +
                    "Practice: Try writing complex JOIN queries and optimizing slow queries with EXPLAIN.";

        } else if (lowerQuestion.contains("spring") || lowerQuestion.contains("spring boot")) {
            answer = "Spring Boot is a framework that simplifies creating production-ready Java applications.\n\n" +
                    "Key features:\n" +
                    "- Auto-configuration: Reduces boilerplate setup\n" +
                    "- Embedded server: Run with just main() method\n" +
                    "- Starter dependencies: Pre-configured libraries\n" +
                    "- Actuator: Health checks and monitoring\n\n" +
                    "Core Spring concepts:\n" +
                    "- IoC Container: Manages object lifecycle\n" +
                    "- Dependency Injection: Wires components together\n" +
                    "- AOP: Cross-cutting concerns (logging, security)\n\n" +
                    "Getting started: @SpringBootApplication, @RestController, @Service, @Repository.";

        } else if (lowerQuestion.contains("react") || lowerQuestion.contains("javascript") || lowerQuestion.contains("frontend") || lowerQuestion.contains("web")) {
            answer = "React is a JavaScript library for building user interfaces, maintained by Meta.\n\n" +
                    "Core concepts:\n" +
                    "- Components: Reusable UI pieces (functional or class-based)\n" +
                    "- JSX: HTML-like syntax in JavaScript\n" +
                    "- State: Data that changes over time (useState hook)\n" +
                    "- Props: Data passed from parent to child components\n" +
                    "- Effects: Side effects like API calls (useEffect hook)\n\n" +
                    "Hooks:\n" +
                    "- useState: Manage local state\n" +
                    "- useEffect: Run code on mount/update/unmount\n" +
                    "- useContext: Share global state\n\n" +
                    "Best practice: Keep components small, lift state up, and use custom hooks for logic reuse.";

        } else if (lowerQuestion.contains("algorithm") || lowerQuestion.contains("data structure") || lowerQuestion.contains("dsa")) {
            answer = "Data Structures and Algorithms (DSA) are the foundation of efficient programming.\n\n" +
                    "Key data structures:\n" +
                    "- Array: O(1) access, O(n) search\n" +
                    "- Linked List: O(1) insert/delete, O(n) access\n" +
                    "- Stack: LIFO - push/pop\n" +
                    "- Queue: FIFO - enqueue/dequeue\n" +
                    "- Hash Map: O(1) average lookup\n" +
                    "- Tree/Heap: Hierarchical data, O(log n) operations\n\n" +
                    "Essential algorithms:\n" +
                    "- Sorting: QuickSort O(n log n), Merge Sort O(n log n)\n" +
                    "- Searching: Binary Search O(log n)\n" +
                    "- Graph: BFS, DFS, Dijkstra's\n\n" +
                    "Practice: Solve 2-3 problems daily on platforms like LeetCode or HackerRank.";

        } else if (lowerQuestion.contains("api") || lowerQuestion.contains("rest") || lowerQuestion.contains("endpoint")) {
            answer = "REST (Representational State Transfer) is an architectural style for designing networked APIs.\n\n" +
                    "HTTP methods:\n" +
                    "- GET: Retrieve resources (read-only)\n" +
                    "- POST: Create new resources\n" +
                    "- PUT/PATCH: Update existing resources\n" +
                    "- DELETE: Remove resources\n\n" +
                    "Best practices:\n" +
                    "- Use nouns for URLs (/users, /courses)\n" +
                    "- Return proper HTTP status codes (200, 201, 400, 404, 500)\n" +
                    "- Version your APIs (/api/v1/)\n" +
                    "- Implement authentication (JWT, OAuth2)\n" +
                    "- Use pagination for large datasets\n\n" +
                    "Example: GET /api/courses/1 returns course with id 1.";

        } else if (lowerQuestion.contains("python")) {
            answer = "Python is a versatile, high-level programming language known for its simplicity and readability.\n\n" +
                    "Key features:\n" +
                    "- Dynamic typing: No need to declare variable types\n" +
                    "- List comprehensions: [x**2 for x in range(10)]\n" +
                    "- Decorators: @ syntax for modifying functions\n" +
                    "- Generators: Memory-efficient iteration with yield\n\n" +
                    "Popular frameworks:\n" +
                    "- Django/Flask: Web development\n" +
                    "- Pandas/NumPy: Data analysis\n" +
                    "- TensorFlow/PyTorch: Machine learning\n\n" +
                    "Tip: Use virtual environments (venv) to manage project dependencies.";

        } else if (lowerQuestion.contains("network") || lowerQuestion.contains("tcp") || lowerQuestion.contains("http") || lowerQuestion.contains("osi")) {
            answer = "Computer Networking covers how devices communicate over the internet.\n\n" +
                    "OSI Model (7 layers):\n" +
                    "1. Physical - Cables, signals\n" +
                    "2. Data Link - MAC addresses, frames\n" +
                    "3. Network - IP addressing, routing\n" +
                    "4. Transport - TCP (reliable) / UDP (fast)\n" +
                    "5. Session - Connection management\n" +
                    "6. Presentation - Encryption, compression\n" +
                    "7. Application - HTTP, FTP, DNS\n\n" +
                    "Key protocols:\n" +
                    "- TCP: Reliable, ordered delivery\n" +
                    "- UDP: Fast, connectionless\n" +
                    "- HTTP/HTTPS: Web communication\n" +
                    "- DNS: Domain name resolution\n\n" +
                    "Practice: Use Wireshark to capture and analyze packets.";

        } else if (lowerQuestion.contains("operating system") || lowerQuestion.contains(" os ") || lowerQuestion.contains("thread") || lowerQuestion.contains("process")) {
            answer = "Operating Systems manage hardware resources and provide services to applications.\n\n" +
                    "Key concepts:\n" +
                    "- Process: A running program with its own memory space\n" +
                    "- Thread: Lightweight process sharing memory within a process\n" +
                    "- Scheduling: CPU allocation strategies (FCFS, Round Robin, Priority)\n" +
                    "- Memory Management: Paging, segmentation, virtual memory\n" +
                    "- Deadlock: Four conditions (mutual exclusion, hold-wait, no preemption, circular wait)\n\n" +
                    "Synchronization:\n" +
                    "- Mutex: Mutual exclusion lock\n" +
                    "- Semaphore: Counter-based signaling\n" +
                    "- Monitor: High-level synchronization construct\n\n" +
                    "Tip: Practice with process scheduling problems and deadlock prevention algorithms.";

        } else if (lowerQuestion.contains("machine learning") || lowerQuestion.contains("ai ") || lowerQuestion.contains("artificial intelligence") || lowerQuestion.contains("neural network") || lowerQuestion.contains("deep learning")) {
            answer = "Machine Learning enables computers to learn patterns from data without explicit programming.\n\n" +
                    "Types:\n" +
                    "- Supervised: Labeled data (classification, regression)\n" +
                    "- Unsupervised: No labels (clustering, dimensionality reduction)\n" +
                    "- Reinforcement: Learning through rewards and penalties\n\n" +
                    "Popular algorithms:\n" +
                    "- Linear Regression, Logistic Regression\n" +
                    "- Decision Trees, Random Forests\n" +
                    "- SVM, KNN\n" +
                    "- Neural Networks (Deep Learning)\n\n" +
                    "Steps: Data collection -> Preprocessing -> Model training -> Evaluation -> Deployment\n\n" +
                    "Libraries: scikit-learn, TensorFlow, PyTorch, Keras.";

        } else if (lowerQuestion.contains("git") || lowerQuestion.contains("version control")) {
            answer = "Git is a distributed version control system for tracking code changes.\n\n" +
                    "Essential commands:\n" +
                    "- git init: Create a new repository\n" +
                    "- git add / git commit: Stage and commit changes\n" +
                    "- git push / git pull: Sync with remote\n" +
                    "- git branch / git merge: Branch management\n" +
                    "- git log: View commit history\n\n" +
                    "Branching strategy:\n" +
                    "- main/master: Production code\n" +
                    "- develop: Integration branch\n" +
                    "- feature/*: New features\n" +
                    "- hotfix/*: Emergency fixes\n\n" +
                    "Best practices: Write clear commit messages, branch for features, and review PRs.";

        } else if (lowerQuestion.contains("html") || lowerQuestion.contains("css")) {
            answer = "HTML (HyperText Markup Language) and CSS (Cascading Style Sheets) are the building blocks of web pages.\n\n" +
                    "HTML fundamentals:\n" +
                    "- Semantic tags: header, nav, main, section, footer\n" +
                    "- Forms: input, select, textarea with validation\n" +
                    "- Accessibility: alt text, ARIA labels, semantic structure\n\n" +
                    "CSS essentials:\n" +
                    "- Flexbox: Flexible layouts with display: flex\n" +
                    "- Grid: 2D layouts with display: grid\n" +
                    "- Specificity: Inline > ID > Class > Element\n" +
                    "- Responsive: Media queries for different screen sizes\n\n" +
                    "Modern CSS: CSS Variables, Container Queries, :has() selector, and utility frameworks like Tailwind.";

        } else if (lowerQuestion.contains("design pattern")) {
            answer = "Design Patterns are reusable solutions to common software design problems.\n\n" +
                    "Creational patterns:\n" +
                    "- Singleton: One instance per class\n" +
                    "- Factory: Create objects without specifying exact class\n" +
                    "- Builder: Step-by-step complex object construction\n\n" +
                    "Structural patterns:\n" +
                    "- Adapter: Convert interface of one class to another\n" +
                    "- Decorator: Add behavior dynamically\n" +
                    "- Facade: Simplify complex subsystems\n\n" +
                    "Behavioral patterns:\n" +
                    "- Observer: Event notification system\n" +
                    "- Strategy: Swap algorithms at runtime\n" +
                    "- Command: Encapsulate requests as objects\n\n" +
                    "Tip: Don't over-apply patterns. Use them when they genuinely simplify your design.";

        } else {
            answer = "Great question! Here's how to approach this topic:\n\n" +
                    "1. Understand the fundamentals: Start with the core concepts and definitions\n" +
                    "2. Build a strong foundation: Work through tutorials and examples\n" +
                    "3. Practice actively: Solve problems, build small projects\n" +
                    "4. Deepen your understanding: Study advanced topics and edge cases\n" +
                    "5. Review and reflect: Test yourself and explain concepts to others\n\n" +
                    "Try searching for specific keywords related to your question. For example, ask about: OOP, SQL, React, Java, Spring, algorithms, databases, APIs, Python, or design patterns for more detailed answers!";
        }

        return Map.of(
                "question",
                question,
                "answer",
                answer,
                "mode",
                "simple-ai"
        );
    }

    // =========================================================
    // AI QUESTION GENERATION
    // =========================================================

    @PostMapping("/ai/generate-questions")
    public List<Map<String, Object>> generateQuestions(
            @RequestBody(required = false) Map<String, Object> body) {

        String topic = "Object Oriented Programming";
        int count = 100;

        if (body != null) {
            if (body.containsKey("topic") && body.get("topic") != null) {
                topic = String.valueOf(body.get("topic"));
            }
            if (body.containsKey("count") && body.get("count") != null) {
                try {
                    count = Integer.parseInt(String.valueOf(body.get("count")));
                } catch (Exception ignored) {}
            } else if (body.containsKey("limit") && body.get("limit") != null) {
                try {
                    count = Integer.parseInt(String.valueOf(body.get("limit")));
                } catch (Exception ignored) {}
            }
        }

        if (aiQuestionService != null) {
            return aiQuestionService.generateQuestions(topic, count);
        } else {
            return new AIQuestionService().generateQuestions(topic, count);
        }
    }

    // =========================================================
    // CONTINUE LEARNING
    // =========================================================

    @GetMapping("/continue-learning")
    public List<Map<String, Object>> continueLearning(
            Authentication authentication) {

        User user = me(authentication);

        List<Progress> progressList =
                progress.findByUserEmail(
                        user.getEmail()
                );

        return progressList
                .stream()

                .filter(progress ->
                        progress.getLesson() != null)

                .filter(progress ->
                        !Boolean.TRUE.equals(
                                progress.getCompleted()
                        ))

                .sorted(
                        Comparator.comparing(
                                Progress::getStartedAt,
                                Comparator.nullsLast(
                                        Comparator.naturalOrder()
                                )
                        )
                )

                .limit(10)

                .map(progress -> {

                    Map<String, Object> result =
                            new LinkedHashMap<>();

                    result.put(
                            "courseId",
                            progress
                                    .getLesson()
                                    .getCourse()
                                    .getId()
                    );

                    result.put(
                            "courseTitle",
                            progress
                                    .getLesson()
                                    .getCourse()
                                    .getTitle()
                    );

                    result.put(
                            "lessonId",
                            progress
                                    .getLesson()
                                    .getId()
                    );

                    result.put(
                            "lessonTitle",
                            progress
                                    .getLesson()
                                    .getTitle()
                    );

                    result.put(
                            "progress",
                            progress.getProgressPercentage()
                    );

                    return result;
                })

                .collect(Collectors.toList());
    }

    // =========================================================
    // QUIZ ATTEMPT HISTORY
    // =========================================================

    @GetMapping("/quiz-attempts/my")
    public List<QuizAttempt> myAttempts(
            Authentication authentication) {

        User user = me(authentication);

        return attempts.findByUserEmailWithQuiz(
                user.getEmail()
        );
    }

    // =========================================================
    // LEVEL 6
    // CREATE LEARNING REMINDERS
    // =========================================================

    @PostMapping("/notifications/reminders")
    public Map<String, Object> createReminders(
            Authentication authentication) {

        User user = me(authentication);

        int count = 0;

        List<Enrollment> enrollmentList =
                enrollments.findByUser(user);

        for (Enrollment enrollment :
                enrollmentList) {

            Course course =
                    enrollment.getCourse();

            List<Progress> progressList =
                    progress.findByUserEmailAndLessonCourseId(
                            user.getEmail(),
                            course.getId()
                    );

            boolean needsReminder =
                    progressList.isEmpty()
                            || progressList.stream()
                            .anyMatch(progress ->
                                    !Boolean.TRUE.equals(
                                            progress.getCompleted()
                                    ));

            if (needsReminder) {

                Notification notification =
                        new Notification();

                notification.setUser(user);

                notification.setTitle(
                        "Learning Reminder"
                );

                notification.setMessage(
                        "Continue your course: "
                                + course.getTitle()
                );

                notifications.save(notification);

                count++;
            }
        }

        return Map.of(
                "created",
                count,
                "message",
                "Learning reminders created"
        );
    }

    // =========================================================
    // TEST NOTIFICATION
    // =========================================================

    @PostMapping("/notifications/test")
    public Notification createNotification(
            Authentication authentication,
            @RequestBody Map<String, String> body) {

        User user = me(authentication);

        Notification notification =
                new Notification();

        notification.setUser(user);

        notification.setTitle(
                body.getOrDefault(
                        "title",
                        "LMS Notification"
                )
        );

        notification.setMessage(
                body.getOrDefault(
                        "message",
                        "You have a new notification."
                )
        );

        return notifications.save(notification);
    }
}