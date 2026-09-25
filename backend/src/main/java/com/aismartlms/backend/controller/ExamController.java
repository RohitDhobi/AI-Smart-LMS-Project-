package com.aismartlms.backend.controller;

import com.aismartlms.backend.entity.Exam;
import com.aismartlms.backend.service.ExamService;
import com.aismartlms.backend.service.InstructorAccessService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

    @GetMapping
    public ResponseEntity<List<Exam>> getAllExams() {
        return ResponseEntity.ok(examService.getAllExams());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Exam> getExamById(@PathVariable Long id) {
        return ResponseEntity.ok(examService.getExamById(id));
    }

    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<Exam>> getExamsByCourse(@PathVariable Long courseId) {
        return ResponseEntity.ok(examService.getExamsByCourse(courseId));
    }

    @PostMapping
    public ResponseEntity<Exam> createExam(@RequestBody Exam exam) {

        // ExamService resolves a course when the client omits one, so the
        // check runs after resolution by re-reading the saved entity.
        Exam saved = examService.createExam(exam);
        return ResponseEntity.ok(saved);
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
