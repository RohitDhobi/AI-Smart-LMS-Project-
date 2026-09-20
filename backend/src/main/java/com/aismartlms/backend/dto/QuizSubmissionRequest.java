package com.aismartlms.backend.dto;

import java.util.Map;

public class QuizSubmissionRequest {

    private Long quizId;

    private Map<Long, String> answers;

    public QuizSubmissionRequest() {
    }

    public Long getQuizId() {
        return quizId;
    }

    public void setQuizId(Long quizId) {
        this.quizId = quizId;
    }

    public Map<Long, String> getAnswers() {
        return answers;
    }

    public void setAnswers(Map<Long, String> answers) {
        this.answers = answers;
    }
}