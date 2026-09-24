package com.aismartlms.backend.service;

import com.aismartlms.backend.dto.HODAssignmentView;
import com.aismartlms.backend.dto.HODDashboardView;
import com.aismartlms.backend.entity.Course;
import com.aismartlms.backend.entity.InstructorCourseAssignment;
import com.aismartlms.backend.entity.Subject;
import com.aismartlms.backend.entity.User;
import com.aismartlms.backend.dto.HODRequest;
import com.aismartlms.backend.dto.HODAssignmentView;
import com.aismartlms.backend.dto.HODDashboardView;
import com.aismartlms.backend.dto.HODRequest;
import com.aismartlms.backend.entity.Course;
import com.aismartlms.backend.entity.InstructorCourseAssignment;
import com.aismartlms.backend.entity.Subject;
import com.aismartlms.backend.entity.User;
import com.aismartlms.backend.repository.CourseRepository;
import com.aismartlms.backend.repository.ExamRepository;
import com.aismartlms.backend.repository.InstructorCourseAssignmentRepository;
import com.aismartlms.backend.repository.QuestionRepository;
import com.aismartlms.backend.repository.EnrollmentRepository;
import com.aismartlms.backend.repository.QuizRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for all HOD (Head of Department) operations.
 * Reuses the existing Course, Subject, Instructor and User systems.
 */
@Service
public class HODService {

    private final InstructorCourseAssignmentRepository assignmentRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final QuizRepository quizRepository;
    private final ExamRepository examRepository;
    private final QuestionRepository questionRepository;

    public HODService(
            InstructorCourseAssignmentRepository assignmentRepository,
            CourseRepository courseRepository,
            EnrollmentRepository enrollmentRepository,
            QuizRepository quizRepository,
            ExamRepository examRepository,
            QuestionRepository questionRepository) {

        this.assignmentRepository = assignmentRepository;
        this.courseRepository = courseRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.quizRepository = quizRepository;
        this.examRepository = examRepository;
        this.questionRepository = questionRepository;
    }

    // =========================
    // READ ASSIGNMENT LIST
    // =========================

    /** All assignments in the whole platform. Used by the HOD "Instructor Assignment" page. */
    public List<HODAssignmentView> getAllAssignments() {
        return assignmentRepository.findAll().stream()
                .map(this::toView)
                .collect(Collectors.toList());
    }

    /** Assignments belonging to a specific instructor. */
    public List<HODAssignmentView> getAssignmentsByInstructorId(Long instructorId) {
        return assignmentRepository.findByInstructorId(instructorId).stream()
                .map(this::toView)
                .collect(Collectors.toList());
    }

    /** Assignments belonging to a specific course. */
    public List<HODAssignmentView> getAssignmentsByCourseId(Long courseId) {
        return assignmentRepository.findByCourseId(courseId).stream()
                .map(this::toView)
                .collect(Collectors.toList());
    }

    /** Assignments belonging to a specific subject. */
    public List<HODAssignmentView> getAssignmentsBySubjectId(Long subjectId) {
        return assignmentRepository.findBySubjectId(subjectId).stream()
                .map(this::toView)
                .collect(Collectors.toList());
    }

    /** Simple existence check used by the controller to decide 403 vs 200. */
    public boolean isInstructorAssignedToCourse(Long instructorId, Long courseId) {
        return assignmentRepository.findByInstructorIdAndStatus(instructorId, "ACTIVE")
                .stream()
                .anyMatch(a -> Objects.equals(a.getCourseId(), courseId));
    }

    /** Whether the instructor has any ACTIVE assignment at all. */
    public boolean isInstructorAssigned(Long instructorId) {
        return assignmentRepository.findByInstructorIdAndStatus(instructorId, "ACTIVE").size() > 0;
    }

    // =========================
    // CREATE / UPDATE / REMOVE
    // =========================

    @Transactional
    public InstructorCourseAssignment createAssignment(HODRequest request) {

        Long instructorId = request.getInstructorId();
        Long courseId = request.getCourseId();
        Long subjectId = request.getSubjectId();

        if (instructorId == null || courseId == null) {
            throw new RuntimeException("Instructor ID and Course ID are required");
        }

        // Normalize legacy: a subject assignment also carries the parent course.
        if (subjectId != null) {
            Course course = courseRepository.findById(subjectId)
                    .orElseThrow(() -> new RuntimeException("Subject not found"));
            courseId = course.getId();
        }

        // Prevent duplicates: same instructor + same course already active.
        boolean exists = assignmentRepository
                .findByInstructorIdAndStatus(instructorId, "ACTIVE")
                .stream()
                .anyMatch(a -> Objects.equals(a.getCourseId(), courseId));

        if (exists) {
            throw new RuntimeException("This instructor is already assigned to this course");
        }

        InstructorCourseAssignment assignment = new InstructorCourseAssignment(
                instructorId,
                courseId,
                subjectId,
                request.getAssignedBy() != null ? request.getAssignedBy() : null
        );

        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            assignment.setStatus(request.getStatus().toUpperCase());
        } else {
            assignment.setStatus("ACTIVE");
        }

        return assignmentRepository.save(assignment);
    }

    @Transactional
    public InstructorCourseAssignment updateAssignment(Long id, HODRequest request) {
        InstructorCourseAssignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));

        if (request.getCourseId() != null) {
            Long oldCourseId = assignment.getCourseId();
            Long newCourseId = request.getCourseId();

            // If a new course is being set, make sure the instructor is not
            // already actively assigned to it (duplicate guard).
            if (newCourseId == null || !newCourseId.equals(oldCourseId)) {
                boolean duplicate = assignmentRepository
                        .findByInstructorIdAndStatus(assignment.getInstructorId(), "ACTIVE")
                        .stream()
                        .anyMatch(a -> Objects.equals(a.getCourseId(), newCourseId));

        if (oldCourseId != null && !oldCourseId.equals(newCourseId)) {
            assignmentRepository.findByInstructorIdAndCourseIdAndStatus(
                    assignment.getInstructorId(), oldCourseId, "ACTIVE")
                    .stream()
                    .filter(a -> a.getSubjectId() != null && a.getSubjectId() != 0L)
                    .findFirst()
                    .ifPresent(a -> assignmentRepository.delete(a));
        }

                if (duplicate) {
                    throw new RuntimeException("This instructor is already assigned to the selected course");
                }
            }

            // If removing from the current course, also clean up any
            // subject-level row pointing to the same subject.
            if (oldCourseId != null && !oldCourseId.equals(newCourseId)) {
                assignmentRepository
                        .findByInstructorIdAndCourseIdAndStatus(assignment.getInstructorId(), oldCourseId, "ACTIVE")
                        .stream()
                        .filter(a -> a.getSubjectId() != null && a.getSubjectId() != 0L)
                        .findFirst()
                        .ifPresent(a -> {
                            assignmentRepository.delete(a);
                        });
            }

            assignment.setCourseId(newCourseId);
        }

        if (request.getSubjectId() != null) {
            assignment.setSubjectId(request.getSubjectId());
        }

        if (request.getAssignedBy() != null) {
            assignment.setAssignedBy(request.getAssignedBy());
        }

        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            assignment.setStatus(request.getStatus().toUpperCase());
        }

        return assignmentRepository.save(assignment);
    }

    @Transactional
    public void deleteAssignment(Long instructorId, Long subjectId) {
        assignmentRepository.deleteByInstructorIdAndSubjectId(instructorId, subjectId);
    }

    /** Run updateAssignment once for a full replace of an instructor's assignment. */
    @Transactional
    public InstructorCourseAssignment assignInstructor(Long instructorId, Long courseId, Long subjectId, String status) {
        InstructorCourseAssignment assignment = new InstructorCourseAssignment(
                instructorId, courseId, subjectId, null
        );
        assignment.setStatus(status == null || status.isBlank() ? "ACTIVE" : status.toUpperCase());
        return assignmentRepository.save(assignment);
    }

    // =========================
    // DASHBOARD
    // =========================

    public HODDashboardView getDashboard() {
        HODDashboardView view = new HODDashboardView();

        Long totalCourses = (long) courseRepository.count();
        Long totalSubjects = (long) courseRepository.countDistinctSubjects();

        Long totalInstructors = (long) courseRepository.countDistinctInstructorsAndHODs();

        // Every user with role INSTRUCTOR is an instructor on the platform.
        Long totalStudents = (long) courseRepository.countDistinctStudents();

        Long totalAssignments = (long) assignmentRepository.count();
        Long totalExams = (long) examRepository.count();
        Long totalQuizzes = (long) quizRepository.count();

        Long totalStudentsEnrolled = (long) enrollmentRepository.count();
        Long totalActiveAssignments = (long) assignmentRepository.countByStatus("ACTIVE");
        Long pendingAssignments = (long) assignmentRepository.countByStatus("PENDING");

        view.setTotalCourses(totalCourses);
        view.setTotalSubjects(totalSubjects);
        view.setTotalInstructors(totalInstructors);
        view.setTotalStudents(totalStudents);
        view.setTotalAssignments(totalAssignments);
        view.setTotalExams(totalExams);
        view.setTotalQuizzes(totalQuizzes);
        view.setTotalStudentsEnrolled(totalStudentsEnrolled);
        view.setTotalActiveAssignments(totalActiveAssignments);
        view.setPendingAssignments(pendingAssignments);

        return view;
    }

    // =========================
    // PRIVATE HELPERS
    // =========================

    private HODAssignmentView toView(InstructorCourseAssignment a) {
        HODAssignmentView v = new HODAssignmentView();
        v.setId(a.getId());
        v.setInstructorId(a.getInstructorId());
        v.setCourseId(a.getCourseId());
        v.setSubjectId(a.getSubjectId());
        v.setAssignedBy(a.getAssignedBy());
        v.setStatus(a.getStatus());
        v.setAssignedAt(a.getAssignedAt() == null
                ? null
                : DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss").format(a.getAssignedAt()));

        // Resolve the instructor user name.
        User instructor = courseRepository.findUserById(a.getInstructorId()).orElse(null);
        if (instructor != null) {
            v.setInstructorId(instructor.getId());
            v.setInstructorName(instructor.getName());
        }

        // Resolve the course name.
        Course course = courseRepository.findById(a.getCourseId()).orElse(null);
        if (course != null) {
            v.setCourseId(course.getId());
            v.setCourseName(course.getTitle());
            // Also grab the subject name if this points at a subject.
            if (a.getSubjectId() != null && a.getSubjectId() != 0L) {
                Subject subject = courseRepository.findSubjectById(a.getSubjectId()).orElse(null);
                if (subject != null) {
                    v.setSubjectId(subject.getId());
                    v.setSubjectName(subject.getSubjectName());
                }
            }
        }

        // The user who assigned this (usually the HOD / current admin).
        User assignedBy = courseRepository.findUserById(a.getAssignedBy()).orElse(null);
        if (assignedBy != null) {
            v.setAssignedByEmail(assignedBy.getEmail());
            v.setAssignedByRole(assignedBy.getRole() == null ? null : assignedBy.getRole().name());
        }

        return v;
    }
}
