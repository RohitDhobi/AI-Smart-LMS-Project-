package com.aismartlms.backend.dto;

import java.util.Map;

/**
 * A student's answers for one exam paper.
 * <p>
 * Keys are the flat question index ("0", "1", ...) in the order the questions
 * appear in the paper; values are the chosen option letter (A-D) or the text
 * the student typed for a descriptive question.
 */
public class ExamSubmissionRequest {

    private Map<String, String> answers;

    public ExamSubmissionRequest() {
    }

    public Map<String, String> getAnswers() {
        return answers;
    }

    public void setAnswers(Map<String, String> answers) {
        this.answers = answers;
    }
}
