package com.aismartlms.backend.service;

import com.aismartlms.backend.entity.*;
import com.aismartlms.backend.repository.*;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class InstructorCertificateService {

    private final CertificateRepository certificateRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final ProgressRepository progressRepository;
    private final QuizRepository quizRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final AssignmentRepository assignmentRepository;
    private final AssignmentSubmissionRepository assignmentSubmissionRepository;

    public InstructorCertificateService(
            CertificateRepository certificateRepository,
            CourseRepository courseRepository,
            EnrollmentRepository enrollmentRepository,
            ProgressRepository progressRepository,
            QuizRepository quizRepository,
            QuizAttemptRepository quizAttemptRepository,
            AssignmentRepository assignmentRepository,
            AssignmentSubmissionRepository assignmentSubmissionRepository) {

        this.certificateRepository = certificateRepository;
        this.courseRepository = courseRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.progressRepository = progressRepository;
        this.quizRepository = quizRepository;
        this.quizAttemptRepository = quizAttemptRepository;
        this.assignmentRepository = assignmentRepository;
        this.assignmentSubmissionRepository = assignmentSubmissionRepository;
    }

    // =========================
    // GET INSTRUCTOR STATS
    // =========================

    public Map<String, Object> getStats(String instructorName) {
        Map<String, Object> stats = new HashMap<>();
        long totalIssued = certificateRepository.countByInstructorName(instructorName);
        long totalValid = certificateRepository.countByInstructorNameAndStatus(instructorName, "VALID");
        long totalRevoked = certificateRepository.countByInstructorNameAndStatus(instructorName, "REVOKED");

        // Count eligible students across all instructor courses
        List<Course> courses = courseRepository.findByInstructorIgnoreCase(instructorName);
        int eligibleCount = 0;
        for (Course course : courses) {
            eligibleCount += getEligibleStudents(course).size();
        }

        // Count certificates this month
        List<Certificate> allCerts = certificateRepository.findByInstructorName(instructorName);
        long thisMonth = allCerts.stream()
                .filter(c -> c.getIssuedAt() != null && c.getIssuedAt().getMonth() == LocalDateTime.now().getMonth()
                        && c.getIssuedAt().getYear() == LocalDateTime.now().getYear())
                .count();

        stats.put("totalIssued", totalIssued);
        stats.put("totalValid", totalValid);
        stats.put("totalRevoked", totalRevoked);
        stats.put("thisMonth", thisMonth);
        stats.put("eligibleStudents", eligibleCount);
        stats.put("totalCourses", courses.size());

        return stats;
    }

    // =========================
    // GET COURSES BY INSTRUCTOR
    // =========================

    public List<Course> getInstructorCourses(String instructorName) {
        return courseRepository.findByInstructorIgnoreCase(instructorName);
    }

    // =========================
    // CHECK ELIGIBILITY FOR A STUDENT IN A COURSE
    // =========================

    public Map<String, Object> checkEligibility(User student, Course course) {
        Map<String, Object> result = new HashMap<>();
        List<String> requirements = new ArrayList<>();
        List<String> passed = new ArrayList<>();
        List<String> failed = new ArrayList<>();

        // 1. Check course completion (lessons)
        List<Lesson> lessons = course.getLessons();
        int totalLessons = lessons.size();
        List<Progress> progressList = progressRepository.findByUserEmailAndLessonCourseId(
                student.getEmail(), course.getId());
        int completedLessons = (int) progressList.stream()
                .filter(Progress::getCompleted)
                .count();

        double lessonProgress = totalLessons > 0 ? ((double) completedLessons / totalLessons) * 100 : 100;
        requirements.add("Course completion (lessons)");
        if (lessonProgress >= 100.0) {
            passed.add("Course completion: " + String.format("%.0f", lessonProgress) + "%");
        } else {
            failed.add("Course completion: " + String.format("%.0f", lessonProgress) + "% (needs 100%)");
        }

        // 2. Check quiz scores
        List<Quiz> quizzes = quizRepository.findByCourseId(course.getId());
        boolean allQuizzesPassed = true;
        double avgQuizScore = 0;
        if (!quizzes.isEmpty()) {
            List<QuizAttempt> attempts = new ArrayList<>();
            for (Quiz quiz : quizzes) {
                attempts.addAll(quizAttemptRepository.findByQuizIdOrderByAttemptedAtDesc(quiz.getId()));
            }
            // Get best attempts per quiz
            Map<Long, QuizAttempt> bestAttempts = new HashMap<>();
            for (QuizAttempt a : attempts) {
                if (a.getUser() != null && a.getUser().getEmail().equals(student.getEmail())) {
                    bestAttempts.merge(a.getQuiz().getId(), a, (e1, e2) ->
                            e1.getPercentage() > e2.getPercentage() ? e1 : e2);
                }
            }
            if (!bestAttempts.isEmpty()) {
                avgQuizScore = bestAttempts.values().stream()
                        .mapToDouble(QuizAttempt::getPercentage)
                        .average()
                        .orElse(0);
                allQuizzesPassed = bestAttempts.values().stream().allMatch(QuizAttempt::getPassed);
            }
        }
        requirements.add("Required quizzes passed (60% minimum)");
        if (allQuizzesPassed && avgQuizScore >= 60) {
            passed.add("Quiz average: " + String.format("%.1f", avgQuizScore) + "%");
        } else {
            failed.add("Quiz average: " + String.format("%.1f", avgQuizScore) + "% (needs 60%)");
        }

        // 3. Check assignment completion
        List<Assignment> assignments = assignmentRepository.findByCourseId(course.getId());
        boolean hasSubmitted = true;
        if (!assignments.isEmpty()) {
            long submittedCount = assignments.stream()
                    .filter(a -> {
                        List<AssignmentSubmission> subs = assignmentSubmissionRepository.findByAssignmentId(a.getId());
                        return subs.stream().anyMatch(s ->
                                s.getUser() != null && s.getUser().getEmail().equals(student.getEmail()));
                    })
                    .count();
            hasSubmitted = submittedCount == assignments.size();
            requirements.add("Assignments completed");
            if (hasSubmitted) {
                passed.add("All " + assignments.size() + " assignments submitted");
            } else {
                failed.add("Missing assignments: " + (assignments.size() - submittedCount) + " remaining");
            }
        }

        // Check if already issued
        Optional<Certificate> existing = certificateRepository.findByUserAndCourse(student, course);
        boolean alreadyIssued = existing.isPresent() && "VALID".equals(existing.get().getStatus());

        boolean eligible = failed.isEmpty();

        result.put("studentEmail", student.getEmail());
        result.put("studentName", student.getName());
        result.put("courseId", course.getId());
        result.put("courseTitle", course.getTitle());
        result.put("lessonProgress", Math.min(lessonProgress, 100));
        result.put("completedLessons", completedLessons);
        result.put("totalLessons", totalLessons);
        result.put("avgQuizScore", avgQuizScore);
        result.put("totalQuizzes", quizzes.size());
        result.put("totalAssignments", assignments.size());
        result.put("eligible", eligible);
        result.put("alreadyIssued", alreadyIssued);
        result.put("requirements", requirements);
        result.put("passed", passed);
        result.put("failed", failed);

        return result;
    }

    // =========================
    // GET ELIGIBLE STUDENTS FOR A COURSE
    // =========================

    public List<Map<String, Object>> getEligibleStudents(Course course) {
        List<Enrollment> enrollments = enrollmentRepository.findByCourse(course);
        List<Map<String, Object>> results = new ArrayList<>();

        for (Enrollment enrollment : enrollments) {
            User student = enrollment.getUser();
            Map<String, Object> eligibility = checkEligibility(student, course);

            Optional<Certificate> existing = certificateRepository.findByUserAndCourse(student, course);
            eligibility.put("certificateId", existing.map(Certificate::getCertificateId).orElse(null));
            eligibility.put("certificateStatus", existing.map(Certificate::getStatus).orElse(null));
            eligibility.put("certificateIssuedAt", existing.map(Certificate::getIssuedAt).orElse(null));

            results.add(eligibility);
        }

        return results;
    }

    // =========================
    // GET ALL CERTIFICATES FOR INSTRUCTOR
    // =========================

    public List<Certificate> getAllCertificates(String instructorName) {
        return certificateRepository.findByInstructorName(instructorName);
    }

    public List<Certificate> getCertificatesByStatus(String instructorName, String status) {
        return certificateRepository.findByInstructorNameAndStatus(instructorName, status);
    }

    // =========================
    // GENERATE CERTIFICATE
    // =========================

    public Certificate generateCertificate(User student, Course course, String instructorName) {
        // Check if already exists and valid
        Optional<Certificate> existing = certificateRepository.findByUserAndCourse(student, course);
        if (existing.isPresent() && "VALID".equals(existing.get().getStatus())) {
            throw new RuntimeException("Certificate already issued for this student in this course.");
        }

        // Check eligibility
        Map<String, Object> eligibility = checkEligibility(student, course);
        if (!(Boolean) eligibility.get("eligible")) {
            throw new RuntimeException("Student is not eligible for this certificate yet.");
        }

        // Calculate average score
        double avgScore = (Double) eligibility.get("avgQuizScore");

        // Generate unique certificate ID
        String certId = generateCertificateId(course);

        Certificate cert = new Certificate();
        cert.setCertificateId(certId);
        cert.setUser(student);
        cert.setCourse(course);
        cert.setScore(avgScore);
        cert.setStatus("VALID");
        cert.setInstructorName(instructorName);
        cert.setIssuedAt(LocalDateTime.now());

        return certificateRepository.save(cert);
    }

    // =========================
    // REVOKE CERTIFICATE
    // =========================

    public Certificate revokeCertificate(Long certificateId, String reason) {
        Certificate cert = certificateRepository.findById(certificateId)
                .orElseThrow(() -> new RuntimeException("Certificate not found"));

        if ("REVOKED".equals(cert.getStatus())) {
            throw new RuntimeException("Certificate is already revoked.");
        }

        cert.setStatus("REVOKED");
        cert.setRevocationReason(reason);
        cert.setRevokedAt(LocalDateTime.now());

        return certificateRepository.save(cert);
    }

    // =========================
    // VERIFY CERTIFICATE
    // =========================

    public Map<String, Object> verifyCertificate(String certId) {
        Certificate cert = certificateRepository.findByCertificateId(certId)
                .orElseThrow(() -> new RuntimeException("Certificate not found"));

        Map<String, Object> result = new HashMap<>();
        result.put("certificateId", cert.getCertificateId());
        result.put("studentName", cert.getUser().getName());
        result.put("courseTitle", cert.getCourse().getTitle());
        result.put("score", cert.getScore());
        result.put("status", cert.getStatus());
        result.put("issuedAt", cert.getIssuedAt());
        result.put("instructorName", cert.getInstructorName());
        result.put("revocationReason", cert.getRevocationReason());
        result.put("revokedAt", cert.getRevokedAt());
        result.put("valid", "VALID".equals(cert.getStatus()));

        return result;
    }

    // =========================
    // GET CERTIFICATE BY ID
    // =========================

    public Certificate getCertificateById(Long id) {
        return certificateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Certificate not found"));
    }

    // =========================
    // HELPER: GENERATE UNIQUE CERTIFICATE ID
    // =========================

    private String generateCertificateId(Course course) {
        String courseCode = course.getCourseCode() != null
                ? course.getCourseCode().toUpperCase().replaceAll("[^A-Z]", "")
                : "LMS";
        if (courseCode.isEmpty()) courseCode = "LMS";

        long count = certificateRepository.countByInstructorName(course.getInstructor()) + 1;
        int year = LocalDateTime.now().getYear();

        return String.format("LMS-%s-%d-%06d", courseCode, year, count);
    }
}
