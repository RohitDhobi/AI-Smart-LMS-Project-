package com.aismartlms.backend.service;

import com.aismartlms.backend.entity.Assignment;
import com.aismartlms.backend.entity.AssignmentSubmission;
import com.aismartlms.backend.entity.Course;
import com.aismartlms.backend.entity.User;
import com.aismartlms.backend.repository.AssignmentRepository;
import com.aismartlms.backend.repository.AssignmentSubmissionRepository;
import com.aismartlms.backend.repository.CourseRepository;
import com.aismartlms.backend.repository.UserRepository;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AssignmentService {

    private final AssignmentRepository assignmentRepository;
    private final AssignmentSubmissionRepository submissionRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;

    public AssignmentService(
            AssignmentRepository assignmentRepository,
            AssignmentSubmissionRepository submissionRepository,
            CourseRepository courseRepository,
            UserRepository userRepository
    ) {
        this.assignmentRepository = assignmentRepository;
        this.submissionRepository = submissionRepository;
        this.courseRepository = courseRepository;
        this.userRepository = userRepository;
    }

    public List<Assignment> getAllAssignments() {
        return assignmentRepository.findAll();
    }

    public List<Assignment> getAssignmentsByCourse(Long courseId) {
        return assignmentRepository.findByCourseId(courseId);
    }

    public Assignment getAssignmentById(Long id) {
        return assignmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));
    }

    public Assignment createAssignment(Assignment assignment) {
        if (assignment.getCourse() != null && assignment.getCourse().getId() != null) {
            Course course = courseRepository.findById(assignment.getCourse().getId())
                    .orElseThrow(() -> new RuntimeException("Course not found"));
            assignment.setCourse(course);
        }
        return assignmentRepository.save(assignment);
    }

    public Assignment updateAssignment(Long id, Assignment updated) {
        Assignment existing = getAssignmentById(id);
        existing.setTitle(updated.getTitle());
        existing.setDescription(updated.getDescription());
        existing.setSubject(updated.getSubject());
        existing.setDueDate(updated.getDueDate());
        existing.setMaximumMarks(updated.getMaximumMarks());
        existing.setAttachmentUrl(updated.getAttachmentUrl());
        existing.setStatus(updated.getStatus());
        return assignmentRepository.save(existing);
    }

    public void deleteAssignment(Long id) {
        assignmentRepository.deleteById(id);
    }

    public AssignmentSubmission submitAssignment(Long assignmentId, String email, String answerText) {
        Assignment assignment = getAssignmentById(assignmentId);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        AssignmentSubmission existing = submissionRepository.findByAssignmentIdAndUserId(assignmentId, user.getId());
        if (existing != null) {
            existing.setAnswerText(answerText);
            existing.setSubmittedAt(LocalDateTime.now());
            existing.setStatus("SUBMITTED");
            return submissionRepository.save(existing);
        }

        AssignmentSubmission submission = new AssignmentSubmission();
        submission.setAssignment(assignment);
        submission.setUser(user);
        submission.setAnswerText(answerText);
        return submissionRepository.save(submission);
    }

    public List<AssignmentSubmission> getSubmissionsByAssignment(Long assignmentId) {
        return submissionRepository.findByAssignmentId(assignmentId);
    }

    public List<AssignmentSubmission> getMySubmissions(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return submissionRepository.findByUserId(user.getId());
    }

    public AssignmentSubmission gradeSubmission(Long submissionId, Integer marks, String feedback) {
        AssignmentSubmission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new RuntimeException("Submission not found"));
        submission.setMarks(marks);
        submission.setFeedback(feedback);
        submission.setStatus("GRADED");
        submission.setGradedAt(LocalDateTime.now());
        return submissionRepository.save(submission);
    }
}
