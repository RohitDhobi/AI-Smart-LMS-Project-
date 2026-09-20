package com.aismartlms.backend.service;

import com.aismartlms.backend.entity.Question;
import com.aismartlms.backend.entity.Quiz;
import com.aismartlms.backend.repository.QuestionRepository;
import com.aismartlms.backend.repository.QuizRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class QuestionService {

    private final QuestionRepository questionRepository;
    private final QuizRepository quizRepository;

    public QuestionService(
            QuestionRepository questionRepository,
            QuizRepository quizRepository) {

        this.questionRepository = questionRepository;
        this.quizRepository = quizRepository;
    }

    // ==========================================
    // CREATE QUESTION
    // ==========================================

    public Question createQuestion(Long quizId, Question question) {

        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() ->
                        new RuntimeException("Quiz not found with id: " + quizId));

        question.setQuiz(quiz);

        return questionRepository.save(question);
    }

    // ==========================================
    // GET QUESTION BY ID
    // ==========================================

    public Question getQuestionById(Long id) {

        return questionRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Question not found with id: " + id));
    }

    // ==========================================
    // GET ALL QUESTIONS
    // ==========================================

    public List<Question> getAllQuestions() {

        return questionRepository.findAll();
    }

    // ==========================================
    // GET QUESTIONS BY QUIZ
    // ==========================================

    public List<Question> getQuestionsByQuiz(Long quizId) {

        // First make sure quiz exists
        if (!quizRepository.existsById(quizId)) {
            throw new RuntimeException(
                    "Quiz not found with id: " + quizId);
        }

        return questionRepository
                .findByQuizIdOrderByQuestionOrderAsc(quizId);
    }

    // ==========================================
    // UPDATE QUESTION
    // ==========================================

    public Question updateQuestion(Long id, Question updatedQuestion) {

        Question existingQuestion = questionRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Question not found with id: " + id));

        existingQuestion.setQuestionText(
                updatedQuestion.getQuestionText());

        existingQuestion.setOptionA(
                updatedQuestion.getOptionA());

        existingQuestion.setOptionB(
                updatedQuestion.getOptionB());

        existingQuestion.setOptionC(
                updatedQuestion.getOptionC());

        existingQuestion.setOptionD(
                updatedQuestion.getOptionD());

        existingQuestion.setCorrectAnswer(
                updatedQuestion.getCorrectAnswer());

        existingQuestion.setMarks(
                updatedQuestion.getMarks());

        existingQuestion.setQuestionOrder(
                updatedQuestion.getQuestionOrder());

        return questionRepository.save(existingQuestion);
    }

    // ==========================================
    // DELETE QUESTION
    // ==========================================

    public void deleteQuestion(Long id) {

        if (!questionRepository.existsById(id)) {
            throw new RuntimeException(
                    "Question not found with id: " + id);
        }

        questionRepository.deleteById(id);
    }
}