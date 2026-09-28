package com.aismartlms.backend.controller;

import com.aismartlms.backend.dto.ExamSubmissionRequest;
import com.aismartlms.backend.entity.Exam;
import com.aismartlms.backend.entity.User;
import com.aismartlms.backend.service.ExamService;
import com.aismartlms.backend.service.InstructorAccessService;

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
    private final InstructorAccessService access;

    public ExamController(
            ExamService examService,
            InstructorAccessService access) {
        this.examService = examService;
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
     * Students only ever receive the answer key while the exam is inside its
     * scheduled day/time slot - staff see everything, as before.
     */
    private Exam hidePaperFromStudents(Exam exam) {
        User user = access.currentUser();
        if (user != null && !access.isStaff(user) && !access.isInstructor(user)) {
            return examService.visibleToStudent(exam);
        }
        return exam;
    }

    private List<Exam> hidePaperFromStudents(List<Exam> exams) {
        User user = access.currentUser();
        if (user != null && !access.isStaff(user) && !access.isInstructor(user)) {
            return examService.visibleToStudent(exams);
        }
        return exams;
    }

    @GetMapping
    public ResponseEntity<List<Exam>> getAllExams() {
        return ResponseEntity.ok(hidePaperFromStudents(examService.getAllExams()));
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

        return ResponseEntity.ok(examService.createExam(exam));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Exam> updateExam(@PathVariable Long id, @RequestBody Exam exam) {
        requireManageExam(id);
        return ResponseEntity.ok(examService.updateExam(id, exam));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteExam(@PathVariable Long id) {
        requireManageExam(id);
        examService.deleteExam(id);
        return ResponseEntity.ok().build();
    }
}
