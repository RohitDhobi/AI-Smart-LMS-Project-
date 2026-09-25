package com.aismartlms.backend.controller;

import com.aismartlms.backend.entity.Question;
import com.aismartlms.backend.entity.Quiz;
import com.aismartlms.backend.repository.QuizRepository;
import com.aismartlms.backend.service.InstructorAccessService;
import com.aismartlms.backend.service.QuestionService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/questions")
public class QuestionController {

    private final QuestionService questionService;
    private final QuizRepository quizRepository;
    private final InstructorAccessService access;

    public QuestionController(
            QuestionService questionService,
            QuizRepository quizRepository,
            InstructorAccessService access) {
        this.questionService = questionService;
        this.quizRepository = quizRepository;
        this.access = access;
    }

    // ==========================================
    // BACKEND SECURITY
    //
    // Creating, editing or deleting a question is a management action on
    // the course the quiz belongs to. The logged-in instructor must have
    // been assigned that course by an HOD, otherwise HTTP 403.
    // ==========================================

    private void requireManageQuiz(Long quizId) {

        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() ->
                        new RuntimeException("Quiz not found with id: " + quizId));

        if (quiz.getCourse() == null) {
            return;
        }

        access.requireCourseManage(quiz.getCourse().getId());
    }

    private void requireManageQuestion(Long questionId) {

        Question question = questionService.getQuestionById(questionId);

        if (question.getQuiz() != null && question.getQuiz().getCourse() != null) {
            access.requireCourseManage(question.getQuiz().getCourse().getId());
        }
    }

    // ==========================================
    // CREATE QUESTION
    // ==========================================

    @PostMapping("/quiz/{quizId}")
    public ResponseEntity<Question> createQuestion(
            @PathVariable Long quizId,
            @RequestBody Question question) {

        requireManageQuiz(quizId);

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

        requireManageQuestion(id);

        return ResponseEntity.ok(
                questionService.updateQuestion(id, question));
    }

    // ==========================================
    // DELETE QUESTION
    // ==========================================

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteQuestion(
            @PathVariable Long id) {

        requireManageQuestion(id);

        questionService.deleteQuestion(id);

        return ResponseEntity.ok(
                "Question deleted successfully");
    }
}
