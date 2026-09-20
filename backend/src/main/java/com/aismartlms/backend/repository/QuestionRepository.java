package com.aismartlms.backend.repository;

import com.aismartlms.backend.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuestionRepository extends JpaRepository<Question, Long> {

    // Get all questions belonging to a particular quiz
    List<Question> findByQuizIdOrderByQuestionOrderAsc(Long quizId);
}