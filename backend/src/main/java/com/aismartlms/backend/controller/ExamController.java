package com.aismartlms.backend.controller;

import com.aismartlms.backend.dto.ExamSubmissionRequest;
import com.aismartlms.backend.entity.Exam;
import com.aismartlms.backend.entity.Role;
import com.aismartlms.backend.entity.User;
import com.aismartlms.backend.service.ExamApprovalService;
import com.aismartlms.backend.service.ExamService;
import com.aismartlms.backend.service.InstructorAccessService;
import com.aismartlms.backend.exception.AccessDeniedException;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/exams")
@CrossOrigin(origins = "*")
public class ExamController {

    private final ExamService examService;
    private final ExamApprovalService approvals;
    private final InstructorAccessService access;

    public ExamController(
            ExamService examService,
            ExamApprovalService approvals,
            InstructorAccessService access) {
        this.examService = examService;
        this.approvals = approvals;
        this.access = access;
    }

    // =========================
    // BACKEND SECURITY
    //
    // Exams, question papers and exam management are restricted to the
    // course the HOD assigned to the instructor. HTTP 403 otherwise.
    // =========================

    private void requireManageExam(Long examId) {

        Exam exam = examService.getExamById(examId);

        if (exam.getCourse() != null && exam.getCourse().getId() != null) {
            access.requireCourseManage(exam.getCourse().getId());
        }
    }

    /**
     * Students only ever see exams that made it through the workflow:
     * PUBLISHED (new flow) or a legacy live status (SCHEDULED/LIVE/COMPLETED)
     * so exams created before this feature keep working. Staff and
     * instructors see everything.
     */
    private boolean visibleToStudent(User user, Exam exam) {
        if (user == null || access.isStaff(user) || access.isInstructor(user)) {
            return true;
        }
        String status = exam.getStatus() == null
                ? "" : exam.getStatus().trim().toUpperCase();
        switch (status) {
            case "DRAFT":
            case "PENDING_HOD_APPROVAL":
            case "REJECTED":
            case "APPROVED":      // approved but not published yet
                return false;
            default:
                return true;
        }
    }

    /**
     * Students only ever receive the answer key while the exam is inside its
     * scheduled day/time slot - staff see everything, as before.
     */
    private Exam hidePaperFromStudents(Exam exam) {
        User user = access.currentUser();
        if (user == null) {
            return exam;
        }
        if (!visibleToStudent(user, exam)) {
            throw new AccessDeniedException("This exam has not been published yet.");
        }
        if (!access.isStaff(user) && !access.isInstructor(user)) {
            return examService.visibleToStudent(exam);
        }
        return exam;
    }

    private List<Exam> hidePaperFromStudents(List<Exam> exams) {
        User user = access.currentUser();
        if (user == null) {
            return exams;
        }
        if (!access.isStaff(user) && !access.isInstructor(user)) {
            List<Exam> visible = new java.util.ArrayList<>();
            for (Exam exam : exams) {
                if (visibleToStudent(user, exam)) {
                    visible.add(examService.visibleToStudent(exam));
                }
            }
            return visible;
        }
        return exams;
    }

    @GetMapping
    public ResponseEntity<List<Exam>> getAllExams() {
        return ResponseEntity.ok(hidePaperFromStudents(examService.getAllExams()));
    }

    // =========================
    // APPROVAL WORKFLOW (INSTRUCTOR SIDE)
    //
    // Students only ever receive published papers; everything below is
    // re-verified on the server - the UI merely hides the buttons.
    // =========================

    /** "My Exams": exams created by the logged-in instructor (staff see all). */
    @GetMapping("/mine")
    public ResponseEntity<List<Exam>> getMyExams() {
        User user = access.requireCurrentUser();
        return ResponseEntity.ok(hidePaperFromStudents(approvals.myExams(user)));
    }

    /** DRAFT/REJECTED -> PENDING_HOD_APPROVAL. */
    @PostMapping("/{id}/submit-for-approval")
    public ResponseEntity<Exam> submitForApproval(@PathVariable Long id) {
        return ResponseEntity.ok(approvals.submitForApproval(id));
    }

    /** APPROVED -> PUBLISHED. HTTP 403 before the HOD has approved. */
    @PostMapping("/{id}/publish")
    public ResponseEntity<Exam> publish(@PathVariable Long id) {
        return ResponseEntity.ok(approvals.publish(id));
    }

    /** ADMIN only: force an exam into any workflow status. */
    @PutMapping("/{id}/status")
    public ResponseEntity<Exam> overrideStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(
                approvals.overrideStatus(id, body == null ? null : body.get("status")));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Exam> getExamById(@PathVariable Long id) {
        return ResponseEntity.ok(hidePaperFromStudents(examService.getExamById(id)));
    }

    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<Exam>> getExamsByCourse(@PathVariable Long courseId) {
        return ResponseEntity.ok(hidePaperFromStudents(examService.getExamsByCourse(courseId)));
    }

    // =========================
    // SUBMIT A PAPER
    //
    // Graded on the server and only accepted while the exam's slot is open,
    // so the answer key never has to reach the browser.
    // =========================

    @PostMapping("/{id}/submit")
    public ResponseEntity<Map<String, Object>> submitExam(
            @PathVariable Long id,
            @RequestBody ExamSubmissionRequest request) {

        Exam exam = examService.getExamById(id);

        // Unpublished papers can never be sat - even with a direct POST.
        if (!visibleToStudent(access.currentUser(), exam)) {
            throw new AccessDeniedException(
                    "This exam has not been published yet.");
        }

        return ResponseEntity.ok(
                examService.gradeSubmission(
                        exam,
                        request == null ? null : request.getAnswers(),
                        LocalDateTime.now()));
    }

    @PostMapping
    public ResponseEntity<Exam> createExam(@RequestBody Exam exam) {

        // Resolve first (the client may omit a course), enforce the HOD
        // assignment check on that course, then save. HTTP 403 if unassigned.
        com.aismartlms.backend.entity.Course target =
                examService.peekCourseForNewExam(exam);

        if (target != null && target.getId() != null) {
            access.requireCourseManage(target.getId());
        }

        User user = access.requireCurrentUser();

        // Instructors always start at DRAFT and own what they create:
        // they cannot self-publish (the HOD approval gate enforces that).
        if (access.isInstructor(user)) {
            exam.setStatus(ExamApprovalService.DRAFT);
            exam.setCreatedBy(user.getId());
            exam.setCreatedByName(user.getName());
        }

        return ResponseEntity.ok(examService.createExam(exam));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Exam> updateExam(@PathVariable Long id, @RequestBody Exam exam) {
        requireManageExam(id);

        User user = access.requireCurrentUser();
        Exam existing = examService.getExamById(id);

        // Instructors cannot smuggle a status change through a plain update:
        // publishing requires POST /{id}/publish (403 unless APPROVED).
        if (!access.isStaff(user)) {

            // The paper is frozen while the HOD is reviewing it, and after
            // it has gone live for students.
            String current = existing.getStatus() == null
                    ? "" : existing.getStatus().trim().toUpperCase();
            if ("PENDING_HOD_APPROVAL".equals(current)) {
                throw new AccessDeniedException(
                        "This exam is awaiting HOD approval and cannot be edited.");
            }
            if ("PUBLISHED".equals(current) || "COMPLETED".equals(current)) {
                throw new AccessDeniedException(
                        "A published exam cannot be edited. Ask your HOD or an admin.");
            }

            String incoming = exam.getStatus();
            if (incoming != null
                    && !incoming.equalsIgnoreCase(existing.getStatus())) {
                if ("PUBLISHED".equalsIgnoreCase(incoming)
                        || "APPROVED".equalsIgnoreCase(incoming)) {
                    throw new AccessDeniedException(
                            ExamApprovalService.NOT_APPROVED_MESSAGE);
                }
                throw new AccessDeniedException(
                        "Exam status can only be changed through submit, approval or publishing.");
            }
            exam.setStatus(existing.getStatus());
        }

        return ResponseEntity.ok(examService.updateExam(id, exam));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteExam(@PathVariable Long id) {
        requireManageExam(id);
        examService.deleteExam(id);
        return ResponseEntity.ok().build();
    }
}
