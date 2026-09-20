package com.aismartlms.backend.controller;

import com.aismartlms.backend.dto.QuizSubmissionRequest;
import com.aismartlms.backend.entity.QuizAttempt;
import com.aismartlms.backend.service.QuizAttemptService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;

import java.util.List;

@RestController
@RequestMapping("/api/quiz-attempts")
@CrossOrigin(origins = "*")
public class QuizAttemptController {

    private final QuizAttemptService quizAttemptService;

    public QuizAttemptController(
            QuizAttemptService quizAttemptService) {

        this.quizAttemptService = quizAttemptService;
    }

    // ==========================================
    // SUBMIT QUIZ
    // ==========================================

    @PostMapping("/submit")
    public ResponseEntity<QuizAttempt> submitQuiz(
            @RequestBody QuizSubmissionRequest request, Authentication authentication) {

        QuizAttempt attempt =
                quizAttemptService.submitQuiz(
                        request.getQuizId(),
                        request.getAnswers(),
                        authentication.getName()
                );

        return ResponseEntity.ok(attempt);
    }

    // ==========================================
    // GET ALL ATTEMPTS (admin)
    // ==========================================

    @GetMapping
    public ResponseEntity<List<QuizAttempt>> getAllAttempts() {

        return ResponseEntity.ok(
                quizAttemptService.getAllAttempts()
        );
    }

    // NOTE: GET /quiz-attempts/my is already handled by
    // AdvancedFeatureController#myAttempts()

    // ==========================================
    // GET ATTEMPTS BY QUIZ
    // ==========================================

    @GetMapping("/quiz/{quizId}")
    public ResponseEntity<List<QuizAttempt>> getAttemptsByQuiz(
            @PathVariable Long quizId) {

        return ResponseEntity.ok(
                quizAttemptService.getAttemptsByQuiz(quizId)
        );
    }

    // ==========================================
    // GET ATTEMPT BY ID
    // ==========================================

    @GetMapping("/{id}")
    public ResponseEntity<QuizAttempt> getAttemptById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                quizAttemptService.getAttemptById(id)
        );
    }
}
