package com.aismartlms.backend.controller;

import com.aismartlms.backend.entity.Assignment;
import com.aismartlms.backend.entity.AssignmentSubmission;
import com.aismartlms.backend.service.AssignmentService;
import com.aismartlms.backend.service.InstructorAccessService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/assignments")
@CrossOrigin(origins = "*")
public class AssignmentController {

    private final AssignmentService assignmentService;
    private final InstructorAccessService access;

    public AssignmentController(
            AssignmentService assignmentService,
            InstructorAccessService access) {
        this.assignmentService = assignmentService;
        this.access = access;
    }

    // Creating, editing or deleting an assignment is a management action on
    // its course. Unassigned instructors get HTTP 403 from the HOD rule.
    private void requireManageAssignment(Long id) {

        Assignment assignment = assignmentService.getAssignmentById(id);

        if (assignment.getCourse() != null
                && assignment.getCourse().getId() != null) {
            access.requireCourseManage(assignment.getCourse().getId());
        }
    }

    @GetMapping
    public ResponseEntity<List<Assignment>> getAllAssignments() {
        return ResponseEntity.ok(assignmentService.getAllAssignments());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Assignment> getAssignmentById(@PathVariable Long id) {
        return ResponseEntity.ok(assignmentService.getAssignmentById(id));
    }

    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<Assignment>> getAssignmentsByCourse(@PathVariable Long courseId) {
        return ResponseEntity.ok(assignmentService.getAssignmentsByCourse(courseId));
    }

    @PostMapping
    public ResponseEntity<Assignment> createAssignment(@RequestBody Assignment assignment) {

        if (assignment.getCourse() != null
                && assignment.getCourse().getId() != null) {
            access.requireCourseManage(assignment.getCourse().getId());
        }

        return ResponseEntity.ok(assignmentService.createAssignment(assignment));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Assignment> updateAssignment(@PathVariable Long id, @RequestBody Assignment assignment) {
        requireManageAssignment(id);
        return ResponseEntity.ok(assignmentService.updateAssignment(id, assignment));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAssignment(@PathVariable Long id) {
        requireManageAssignment(id);
        assignmentService.deleteAssignment(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/submit")
    public ResponseEntity<AssignmentSubmission> submitAssignment(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            Authentication authentication) {
        return ResponseEntity.ok(
                assignmentService.submitAssignment(id, authentication.getName(), body.get("answerText"))
        );
    }

    @GetMapping("/{id}/submissions")
    public ResponseEntity<List<AssignmentSubmission>> getSubmissions(@PathVariable Long id) {
        return ResponseEntity.ok(assignmentService.getSubmissionsByAssignment(id));
    }

    @GetMapping("/my")
    public ResponseEntity<List<AssignmentSubmission>> getMySubmissions(Authentication authentication) {
        return ResponseEntity.ok(assignmentService.getMySubmissions(authentication.getName()));
    }

    @PutMapping("/submissions/{submissionId}/grade")
    public ResponseEntity<AssignmentSubmission> gradeSubmission(
            @PathVariable Long submissionId,
            @RequestBody Map<String, Object> body) {
        Integer marks = (Integer) body.get("marks");
        String feedback = (String) body.get("feedback");
        return ResponseEntity.ok(assignmentService.gradeSubmission(submissionId, marks, feedback));
    }
}
