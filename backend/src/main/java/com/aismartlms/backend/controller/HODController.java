package com.aismartlms.backend.controller;

import com.aismartlms.backend.dto.HODAssignmentView;
import com.aismartlms.backend.dto.HODDashboardView;
import com.aismartlms.backend.dto.HODRequest;
import com.aismartlms.backend.entity.Announcement;
import com.aismartlms.backend.entity.Question;
import com.aismartlms.backend.entity.Role;
import com.aismartlms.backend.entity.User;
import com.aismartlms.backend.exception.AccessDeniedException;
import com.aismartlms.backend.repository.InstructorCourseAssignmentRepository;
import com.aismartlms.backend.repository.QuestionRepository;
import com.aismartlms.backend.repository.UserRepository;
import com.aismartlms.backend.service.AIQuestionService;
import com.aismartlms.backend.service.HODService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * HOD (Head of Department) REST & HTML endpoints.
 * <p>
 * All routes live under /api/hod to stay clearly separated from existing
 * /api/instructor and /api/admin endpoints. Permission checks are performed
 * here, never only in the React UI.
 */
@RestController
@RequestMapping("/api/hod")
@CrossOrigin(origins = "*")
public class HODController {

    private final HODService hodService;
    private final InstructorCourseAssignmentRepository assignmentRepository;
    private final UserRepository users;
    private final QuestionRepository questionRepository;
    private final AIQuestionService aiQuestionService;
    private final com.aismartlms.backend.repository.ExamRepository examRepository;

    public HODController(
            HODService hodService,
            InstructorCourseAssignmentRepository assignmentRepository,
            UserRepository users,
            QuestionRepository questionRepository,
            AIQuestionService aiQuestionService,
            com.aismartlms.backend.repository.ExamRepository examRepository) {

        this.hodService = hodService;
        this.assignmentRepository = assignmentRepository;
        this.users = users;
        this.questionRepository = questionRepository;
        this.aiQuestionService = aiQuestionService;
        this.examRepository = examRepository;
    }

    // =========================
    // DASHBOARD (LEVEL 1)
    // =========================

    @GetMapping("/dashboard")
    public HODDashboardView getDashboard(Authentication authentication) {
        requireHOD(authentication);
        return hodService.getDashboard();
    }

    // =========================
    // INSTRUCTOR ASSIGNMENT LIST (SECTION 3)
    // =========================

    /** Return the full assignment table: Subject/Course | Assigned Instructor | Status | Action */
    @GetMapping("/assignments")
    public java.util.List<HODAssignmentView> getAssignments(Authentication authentication) {
        requireHOD(authentication);
        return hodService.getAllAssignments();
    }

    /** Return only assignments for a single instructor (one data point for their row). */
    @GetMapping("/assignments/instructor/{instructorId}")
    public java.util.List<HODAssignmentView> getAssignmentsByInstructor(
            @PathVariable Long instructorId,
            Authentication authentication) {
        requireHOD(authentication);
        return hodService.getAssignmentsByInstructorId(instructorId);
    }

    /** Return only assignments for a single course. */
    @GetMapping("/assignments/course/{courseId}")
    public java.util.List<HODAssignmentView> getAssignmentsByCourse(
            @PathVariable Long courseId,
            Authentication authentication) {
        requireHOD(authentication);
        return hodService.getAssignmentsByCourseId(courseId);
    }

    // =========================
    // COURSES / SUBJECTS (SECTION 2)
    //
    // The HOD can see every course and subject, and view its details.
    // =========================

    @GetMapping("/courses")
    public List<Map<String, Object>> getCourses(Authentication authentication) {
        requireHOD(authentication);
        return hodService.getCourses();
    }

    @GetMapping("/subjects")
    public List<Map<String, Object>> getSubjects(Authentication authentication) {
        requireHOD(authentication);
        return hodService.getSubjects();
    }

    /** Instructors - source for the Assign/Change dropdown. */
    @GetMapping("/instructors")
    public List<Map<String, Object>> getInstructors(Authentication authentication) {
        requireHOD(authentication);
        return hodService.getInstructors();
    }

    // =========================
    // STUDENTS
    // =========================

    @GetMapping("/students")
    public List<Map<String, Object>> getStudents(Authentication authentication) {
        requireHOD(authentication);
        return hodService.getStudents();
    }

    // =========================
    // QUESTION BANK
    // =========================

    /** Question bank listing, shaped for the HOD table. */
    @GetMapping("/questions")
    public List<Map<String, Object>> getQuestions(Authentication authentication) {
        requireHOD(authentication);

        List<Map<String, Object>> result = new ArrayList<>();

        for (Question question : questionRepository.findAll()) {

            Map<String, Object> item = new LinkedHashMap<>();

            item.put("id", question.getId());
            item.put("question", question.getQuestionText());
            item.put("title", question.getQuestionText());
            item.put("type", "MCQ");
            item.put("difficulty", "Medium");
            item.put("status", "ACTIVE");
            item.put("marks", question.getMarks());

            if (question.getQuiz() != null) {
                item.put("quizId", question.getQuiz().getId());
                if (question.getQuiz().getCourse() != null) {
                    item.put("courseId", question.getQuiz().getCourse().getId());
                    item.put("courseName", question.getQuiz().getCourse().getTitle());
                }
            }

            result.add(item);
        }

        return result;
    }

    /** AI question generation for the HOD question bank. */
    @PostMapping("/questions/generate")
    public ResponseEntity<?> generateQuestions(
            Authentication authentication,
            @RequestBody(required = false) Map<String, Object> body) {

        requireHOD(authentication);

        String topic = body != null && body.get("topic") != null
                ? String.valueOf(body.get("topic"))
                : "General";

        int count = 10;
        if (body != null && body.get("count") != null) {
            try {
                count = Integer.parseInt(String.valueOf(body.get("count")));
            } catch (NumberFormatException ignored) {
                count = 10;
            }
        }

        return ResponseEntity.ok(aiQuestionService.generateQuestions(topic, count));
    }

    // =========================
    // EXAMS
    // =========================

    @GetMapping("/exams")
    public List<Map<String, Object>> getExams(Authentication authentication) {
        requireHOD(authentication);

        List<Map<String, Object>> result = new ArrayList<>();

        for (com.aismartlms.backend.entity.Exam exam : examRepository.findAll()) {

            Map<String, Object> item = new LinkedHashMap<>();

            item.put("id", exam.getId());
            item.put("title", exam.getTitle());
            item.put("name", exam.getTitle());
            item.put("description", exam.getDescription());
            item.put("duration", exam.getDurationMinutes());
            item.put("totalMarks", exam.getTotalMarks());
            item.put("status", exam.getStatus());
            item.put("date", exam.getStartTime());
            item.put("questionCount",
                    exam.getQuestions() == null ? 0 : exam.getQuestions().size());

            if (exam.getCourse() != null) {
                item.put("courseId", exam.getCourse().getId());
                item.put("courseName", exam.getCourse().getTitle());
            }

            result.add(item);
        }

        return result;
    }

    // =========================
    // ANNOUNCEMENTS
    // =========================

    @GetMapping("/announcements")
    public List<Announcement> getAnnouncements(Authentication authentication) {
        requireHOD(authentication);
        return hodService.getAnnouncements();
    }

    @PostMapping("/announcements")
    public Announcement createAnnouncement(
            Authentication authentication,
            @RequestBody Map<String, String> body) {

        requireHOD(authentication);

        User me = me(authentication);

        return hodService.createAnnouncement(
                body.get("title"),
                body.get("content"),
                me);
    }

    // =========================
    // ASSIGN INSTRUCTOR TO COURSE (SECTION 3)
    // =========================

    @PostMapping("/assignments")
    public com.aismartlms.backend.entity.InstructorCourseAssignment createAssignment(
            Authentication authentication,
            @RequestBody HODRequest request) {
        requireHOD(authentication);
        if (request.getInstructorId() == null || request.getCourseId() == null) {
            throw new RuntimeException("Instructor ID and Course ID are required");
        }
        return hodService.createAssignment(request);
    }

    // =========================
    // CHANGE/UPDATE INSTRUCTOR ASSIGNMENT (SECTION 3)
    // =========================

    @PutMapping("/assignments/{id}")
    public com.aismartlms.backend.entity.InstructorCourseAssignment editAssignment(
            Authentication authentication,
            @PathVariable Long id,
            @RequestBody HODRequest request) {
        requireHOD(authentication);
        return hodService.updateAssignment(id, request);
    }

    // =========================
    // REMOVE INSTRUCTOR FROM SUBJECT/COURSE (SECTION 3)
    // =========================

    @DeleteMapping("/assignments/instructor/{instructorId}/subject/{subjectId}")
    public ResponseEntity<Map<String, String>> removeInstructorFromSubject(
            Authentication authentication,
            @PathVariable Long instructorId,
            @PathVariable Long subjectId) {
        requireHOD(authentication);
        if (instructorId == null || subjectId == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Instructor ID and Subject ID are required"));
        }
        hodService.deleteAssignment(instructorId, subjectId);
        return ResponseEntity.ok(Map.of("message", "Instructor removed from subject"));
    }

    // =========================
    // COMMON HELPERS
    // =========================

    private User me(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new AccessDeniedException("Authentication required");
        }
        return users.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private boolean isHOD(Authentication authentication) {
        User user = me(authentication);
        return user.getRole() == Role.HOD;
    }

    private void requireHOD(Authentication authentication) {
        if (!isHOD(authentication)) {
            throw new AccessDeniedException("HOD access required");
        }
    }

    private User getUser(Authentication authentication) {
        return me(authentication);
    }
}
