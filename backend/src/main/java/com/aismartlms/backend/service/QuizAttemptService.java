package com.aismartlms.backend.service;

import com.aismartlms.backend.entity.Question;
import com.aismartlms.backend.entity.User;
import com.aismartlms.backend.repository.UserRepository;
import com.aismartlms.backend.entity.Quiz;
import com.aismartlms.backend.entity.QuizAttempt;
import com.aismartlms.backend.repository.QuestionRepository;
import com.aismartlms.backend.repository.QuizAttemptRepository;
import com.aismartlms.backend.repository.QuizRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class QuizAttemptService {

    private final QuizAttemptRepository quizAttemptRepository;
    private final QuizRepository quizRepository;
    private final QuestionRepository questionRepository;
    private final UserRepository userRepository;

    public QuizAttemptService(
            QuizAttemptRepository quizAttemptRepository,
            QuizRepository quizRepository,
            QuestionRepository questionRepository,
            UserRepository userRepository) {

        this.quizAttemptRepository = quizAttemptRepository;
        this.quizRepository = quizRepository;
        this.questionRepository = questionRepository;
        this.userRepository = userRepository;
    }

    // ==========================================
    // SUBMIT QUIZ
    // ==========================================

    public QuizAttempt submitQuiz(
            Long quizId,
            Map<Long, String> answers) {
        return submitQuiz(quizId, answers, null);
    }

    public QuizAttempt submitQuiz(
            Long quizId, Map<Long, String> answers, String email) {

        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Quiz not found with id: " + quizId));

        List<Question> questions =
                questionRepository.findByQuizIdOrderByQuestionOrderAsc(quizId);

        if (questions.isEmpty()) {
            throw new RuntimeException(
                    "No questions found for quiz id: " + quizId);
        }

        int score = 0;
        int totalMarks = 0;

        // ==========================================
        // CHECK EACH QUESTION
        // ==========================================

        for (Question question : questions) {

            int marks = question.getMarks();

            totalMarks += marks;

            String correctAnswer =
                    question.getCorrectAnswer();

            String studentAnswer =
                    answers != null
                            ? answers.get(question.getId())
                            : null;

            if (studentAnswer != null
                    && correctAnswer != null
                    && studentAnswer.equalsIgnoreCase(correctAnswer)) {

                score += marks;
            }
        }

        // ==========================================
        // CALCULATE PERCENTAGE
        // ==========================================

        double percentage = 0.0;

        if (totalMarks > 0) {
            percentage =
                    ((double) score / totalMarks) * 100;
        }

        // ==========================================
        // PASSING MARK = 40%
        // ==========================================

        boolean passed = percentage >= 40.0;

        // ==========================================
        // CREATE ATTEMPT
        // ==========================================

        QuizAttempt attempt = new QuizAttempt();

        attempt.setQuiz(quiz);
        if (email != null) {
            User user = userRepository.findByEmail(email).orElse(null);
            attempt.setUser(user);
        }
        attempt.setScore(score);
        attempt.setTotalMarks(totalMarks);
        attempt.setPercentage(percentage);
        attempt.setPassed(passed);
        attempt.setAttemptedAt(LocalDateTime.now());

        return quizAttemptRepository.save(attempt);
    }

    // ==========================================
    // GET ALL ATTEMPTS (admin)
    // ==========================================

    @Transactional(readOnly = true)
    public List<QuizAttempt> getAllAttempts() {
        return quizAttemptRepository.findAllWithQuizAndUser();
    }

    // ==========================================
    // GET MY ATTEMPTS (student/instructor)
    // ==========================================

    @Transactional(readOnly = true)
    public List<QuizAttempt> getMyAttempts(String email) {
        return quizAttemptRepository.findByUserEmailWithQuiz(email);
    }

    // ==========================================
    // GET ATTEMPTS BY QUIZ
    // ==========================================

    @Transactional(readOnly = true)
    public List<QuizAttempt> getAttemptsByQuiz(Long quizId) {
        return quizAttemptRepository.findByQuizId(quizId);
    }

    // ==========================================
    // GET ATTEMPT BY ID
    // ==========================================

    @Transactional(readOnly = true)
    public QuizAttempt getAttemptById(Long id) {
        return quizAttemptRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Quiz attempt not found with id: " + id));
    }
}
