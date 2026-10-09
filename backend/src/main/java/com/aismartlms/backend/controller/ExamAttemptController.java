package com.aismartlms.backend.controller;

import com.aismartlms.backend.entity.User;
import com.aismartlms.backend.exception.AccessDeniedException;
import com.aismartlms.backend.service.ExamAttemptService;
import com.aismartlms.backend.service.ExamService;
import com.aismartlms.backend.service.InstructorAccessService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Exam result history.
 * <p>
 * Students read their own results; staff read every attempt at a paper they
 * manage. Both are re-checked server-side - the UI only renders the link.
 */
@RestController
@RequestMapping("/api/exam-attempts")
@CrossOrigin(origins = "*")
public class ExamAttemptController {

    private final ExamAttemptService attempts;
    private final ExamService exams;
    private final InstructorAccessService access;

    public ExamAttemptController(
            ExamAttemptService attempts,
            ExamService exams,
            InstructorAccessService access) {
        this.attempts = attempts;
        this.exams = exams;
        this.access = access;
    }

    /**
     * Every exam the logged-in user has sat, newest first.
     * Staff get their own row too (usually empty) - use
     * {@code /exam/{examId}} for a paper's full results.
     */
    @GetMapping("/my")
    public ResponseEntity<List<Map<String, Object>>> myAttempts() {

        User user = access.requireCurrentUser();

        return ResponseEntity.ok(attempts.myAttempts(user.getId()));
    }

    /** One of the caller's own attempts, with the answers they submitted. */
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> attempt(
            @PathVariable Long id) {

        User user = access.requireCurrentUser();

        return attempts.myAttempt(user.getId(), id)
                .map(ResponseEntity::ok)
                .orElseThrow(() ->
                        new AccessDeniedException("That result is not yours."));
    }

    /**
     * Full results for one paper - ADMIN/HOD always, INSTRUCTOR only when
     * the HOD assigned them the course.
     */
    @GetMapping("/exam/{examId}")
    public ResponseEntity<List<Map<String, Object>>> examAttempts(
            @PathVariable Long examId) {

        com.aismartlms.backend.entity.Exam exam = exams.getExamById(examId);

        if (exam.getCourse() != null && exam.getCourse().getId() != null) {
            access.requireCourseManage(exam.getCourse().getId());
        } else {
            access.requireCurrentUser();
        }

        return ResponseEntity.ok(attempts.attemptsForExam(examId));
    }
}
