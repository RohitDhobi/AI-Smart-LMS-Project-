package com.aismartlms.backend.controller;

import com.aismartlms.backend.entity.Course;
import com.aismartlms.backend.entity.Quiz;
import com.aismartlms.backend.repository.CourseRepository;
import com.aismartlms.backend.repository.QuizRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/quizzes")
public class QuizController {

    private final QuizRepository quizRepository;
    private final CourseRepository courseRepository;

    public QuizController(
            QuizRepository quizRepository,
            CourseRepository courseRepository) {
        this.quizRepository = quizRepository;
        this.courseRepository = courseRepository;
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

        quizRepository.deleteById(id);

        return ResponseEntity.ok(
                "Quiz deleted successfully"
        );
    }
}