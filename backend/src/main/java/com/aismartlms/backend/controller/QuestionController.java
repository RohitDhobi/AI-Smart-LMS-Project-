package com.aismartlms.backend.controller;

import com.aismartlms.backend.entity.Question;
import com.aismartlms.backend.service.QuestionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/questions")
public class QuestionController {

    private final QuestionService questionService;

    public QuestionController(QuestionService questionService) {
        this.questionService = questionService;
    }

    // ==========================================
    // CREATE QUESTION
    // ==========================================

    @PostMapping("/quiz/{quizId}")
    public ResponseEntity<Question> createQuestion(
            @PathVariable Long quizId,
            @RequestBody Question question) {

        Question createdQuestion =
                questionService.createQuestion(quizId, question);

        return new ResponseEntity<>(
                createdQuestion,
                HttpStatus.CREATED);
    }

    // ==========================================
    // GET ALL QUESTIONS
    // ==========================================

    @GetMapping
    public ResponseEntity<List<Question>> getAllQuestions() {

        return ResponseEntity.ok(
                questionService.getAllQuestions());
    }

    // ==========================================
    // GET QUESTION BY ID
    // ==========================================

    @GetMapping("/{id}")
    public ResponseEntity<Question> getQuestionById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                questionService.getQuestionById(id));
    }

    // ==========================================
    // GET QUESTIONS BY QUIZ
    // ==========================================

    @GetMapping("/quiz/{quizId}")
    public ResponseEntity<List<Question>> getQuestionsByQuiz(
            @PathVariable Long quizId) {

        return ResponseEntity.ok(
                questionService.getQuestionsByQuiz(quizId));
    }

    // ==========================================
    // UPDATE QUESTION
    // ==========================================

    @PutMapping("/{id}")
    public ResponseEntity<Question> updateQuestion(
            @PathVariable Long id,
            @RequestBody Question question) {

        return ResponseEntity.ok(
                questionService.updateQuestion(id, question));
    }

    // ==========================================
    // DELETE QUESTION
    // ==========================================

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteQuestion(
            @PathVariable Long id) {

        questionService.deleteQuestion(id);

        return ResponseEntity.ok(
                "Question deleted successfully");
    }
}