package com.aismartlms.backend.controller;

import com.aismartlms.backend.entity.Course;
import com.aismartlms.backend.entity.Quiz;
import com.aismartlms.backend.repository.CourseRepository;
import com.aismartlms.backend.repository.QuizRepository;
import com.aismartlms.backend.service.InstructorAccessService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/quizzes")
public class QuizController {

    private final QuizRepository quizRepository;
    private final CourseRepository courseRepository;
    private final InstructorAccessService access;

    public QuizController(
            QuizRepository quizRepository,
            CourseRepository courseRepository,
            InstructorAccessService access) {
        this.quizRepository = quizRepository;
        this.courseRepository = courseRepository;
        this.access = access;
    }

    // =========================
    // BACKEND SECURITY
    //
    // Creating or deleting a quiz is a management action. The instructor
    // must be assigned the target course by an HOD, else HTTP 403.
    // =========================

    private void requireManageQuiz(Long quizId) {

        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new RuntimeException("Quiz not found with id: " + quizId));

        if (quiz.getCourse() != null && quiz.getCourse().getId() != null) {
            access.requireCourseManage(quiz.getCourse().getId());
        }
    }

    // =========================
    // CREATE QUIZ FOR COURSE
    // =========================

    @PostMapping("/course/{courseId}")
    public ResponseEntity<?> createQuiz(
            @PathVariable Long courseId,
            @RequestBody Quiz quiz) {

        Course course = courseRepository.findById(courseId)
                .orElse(null);

        if (course == null) {
            return ResponseEntity
                    .badRequest()
                    .body("Course not found with id: " + courseId);
        }

        // 403 unless this instructor owns the course.
        access.requireCourseManage(courseId);

        quiz.setCourse(course);

        Quiz savedQuiz = quizRepository.save(quiz);

        return ResponseEntity.ok(savedQuiz);
    }

    // =========================
    // GET QUIZ BY ID
    // =========================

    @GetMapping("/{id}")
    public ResponseEntity<?> getQuiz(@PathVariable Long id) {

        Quiz quiz = quizRepository.findById(id)
                .orElse(null);

        if (quiz == null) {
            return ResponseEntity
                    .notFound()
                    .build();
        }

        return ResponseEntity.ok(quiz);
    }

    // =========================
    // GET ALL QUIZZES
    // =========================

    @GetMapping
    public List<Quiz> getAllQuizzes() {
        return quizRepository.findAll();
    }

    // =========================
    // GET QUIZZES BY COURSE
    // =========================

    @GetMapping("/course/{courseId}")
    public List<Quiz> getQuizzesByCourse(
            @PathVariable Long courseId) {

        return quizRepository.findByCourseId(courseId);
    }

    // =========================
    // DELETE QUIZ
    // =========================

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteQuiz(
            @PathVariable Long id) {

        if (!quizRepository.existsById(id)) {
            return ResponseEntity
                    .notFound()
                    .build();
        }

        requireManageQuiz(id);

        quizRepository.deleteById(id);

        return ResponseEntity.ok(
                "Quiz deleted successfully"
        );
    }
}