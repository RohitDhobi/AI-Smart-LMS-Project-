package com.aismartlms.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import javax.persistence.*;

@Entity
@Table(name = "questions")
public class Question {

    // =========================
    // ID
    // =========================

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // =========================
    // QUESTION TEXT
    // =========================

    @Column(nullable = false, columnDefinition = "TEXT")
    private String questionText;

    // =========================
    // OPTION A
    // =========================

    @Column(nullable = false)
    private String optionA;

    // =========================
    // OPTION B
    // =========================

    @Column(nullable = false)
    private String optionB;

    // =========================
    // OPTION C
    // =========================

    @Column(nullable = false)
    private String optionC;

    // =========================
    // OPTION D
    // =========================

    @Column(nullable = false)
    private String optionD;

    // =========================
    // CORRECT ANSWER
    // =========================

    @Column(nullable = false)
    private String correctAnswer;

    // =========================
    // QUESTION MARKS
    // =========================

    @Column(nullable = false)
    private Integer marks = 1;

    // =========================
    // QUESTION ORDER
    // =========================

    @Column(nullable = false)
    private Integer questionOrder;

    // =========================
    // QUIZ
    // =========================

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_id", nullable = false)
    @JsonIgnore
    private Quiz quiz;

    // =========================
    // DEFAULT CONSTRUCTOR
    // =========================

    public Question() {
    }

    // =========================
    // GETTERS AND SETTERS
    // =========================

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getQuestionText() {
        return questionText;
    }

    public void setQuestionText(String questionText) {
        this.questionText = questionText;
    }

    public String getOptionA() {
        return optionA;
    }

    public void setOptionA(String optionA) {
        this.optionA = optionA;
    }

    public String getOptionB() {
        return optionB;
    }

    public void setOptionB(String optionB) {
        this.optionB = optionB;
    }

    public String getOptionC() {
        return optionC;
    }

    public void setOptionC(String optionC) {
        this.optionC = optionC;
    }

    public String getOptionD() {
        return optionD;
    }

    public void setOptionD(String optionD) {
        this.optionD = optionD;
    }

    public String getCorrectAnswer() {
        return correctAnswer;
    }

    public void setCorrectAnswer(String correctAnswer) {
        this.correctAnswer = correctAnswer;
    }

    public Integer getMarks() {
        return marks;
    }

    public void setMarks(Integer marks) {
        this.marks = marks;
    }

    public Integer getQuestionOrder() {
        return questionOrder;
    }

    public void setQuestionOrder(Integer questionOrder) {
        this.questionOrder = questionOrder;
    }

    public Quiz getQuiz() {
        return quiz;
    }

    public void setQuiz(Quiz quiz) {
        this.quiz = quiz;
    }
}