package com.aismartlms.backend.entity;

import javax.persistence.*;

import java.time.LocalDateTime;

/**
 * One graded exam submission.
 * <p>
 * Previously {@code ExamService.gradeSubmission} returned a {@code Map} and
 * threw it away, so a student's result vanished the moment the modal closed
 * (FEATURE-MATRIX §7 "Exam result persistence — NOT IMPLEMENTED"). Every
 * submission now produces one row here, which is what the student's exam
 * history and the staff results view read from.
 * <p>
 * The exam and the student are stored as plain id columns rather than
 * {@code @ManyToOne} associations. Two reasons: the response must never
 * serialise the {@link Exam} (its {@code questionPaper} column contains the
 * answer key), and this repository is read outside an open session, so a
 * lazy proxy would fail to initialise.
 */
@Entity
@Table(name = "exam_attempts", indexes = {
        @Index(name = "idx_exam_attempts_user", columnList = "user_id"),
        @Index(name = "idx_exam_attempts_exam", columnList = "exam_id")
})
public class ExamAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // =========================
    // TARGETS (plain FK ids)
    // =========================

    @Column(name = "exam_id", nullable = false)
    private Long examId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    // =========================
    // DENORMALISED FOR DISPLAY
    // (so history renders without joins)
    // =========================

    @Column(name = "exam_title")
    private String examTitle;

    @Column(name = "course_title")
    private String courseTitle;

    @Column(name = "student_name")
    private String studentName;

    // =========================
    // THE PAPER AS SUBMITTED
    // =========================

    /** JSON: question index -> chosen option letter / written answer. */
    @Column(name = "answers_json", columnDefinition = "TEXT")
    private String answersJson;

    // =========================
    // GRADE
    // =========================

    @Column(name = "awarded_marks", nullable = false)
    private Double awardedMarks;

    @Column(name = "graded_marks", nullable = false)
    private Double gradedMarks;

    @Column(nullable = false)
    private Double percentage;

    @Column(name = "passing_percentage", nullable = false)
    private Double passingPercentage;

    @Column(nullable = false)
    private Boolean passed;

    @Column(nullable = false)
    private Integer correct;

    @Column(nullable = false)
    private Integer wrong;

    @Column(nullable = false)
    private Integer skipped;

    /** Descriptive questions waiting for a human marker. */
    @Column(name = "pending_manual", nullable = false)
    private Integer pendingManual;

    /**
     * {@code AUTO_GRADED} when the machine marked everything,
     * {@code AWAITING_MANUAL} when {@code pendingManual > 0}.
     */
    @Column(nullable = false)
    private String status;

    @Column(name = "submitted_at", nullable = false)
    private LocalDateTime submittedAt;

    public ExamAttempt() {
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

    public Long getExamId() {
        return examId;
    }

    public void setExamId(Long examId) {
        this.examId = examId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getExamTitle() {
        return examTitle;
    }

    public void setExamTitle(String examTitle) {
        this.examTitle = examTitle;
    }

    public String getCourseTitle() {
        return courseTitle;
    }

    public void setCourseTitle(String courseTitle) {
        this.courseTitle = courseTitle;
    }

    public String getStudentName() {
        return studentName;
    }

    public void setStudentName(String studentName) {
        this.studentName = studentName;
    }

    public String getAnswersJson() {
        return answersJson;
    }

    public void setAnswersJson(String answersJson) {
        this.answersJson = answersJson;
    }

    public Double getAwardedMarks() {
        return awardedMarks;
    }

    public void setAwardedMarks(Double awardedMarks) {
        this.awardedMarks = awardedMarks;
    }

    public Double getGradedMarks() {
        return gradedMarks;
    }

    public void setGradedMarks(Double gradedMarks) {
        this.gradedMarks = gradedMarks;
    }

    public Double getPercentage() {
        return percentage;
    }

    public void setPercentage(Double percentage) {
        this.percentage = percentage;
    }

    public Double getPassingPercentage() {
        return passingPercentage;
    }

    public void setPassingPercentage(Double passingPercentage) {
        this.passingPercentage = passingPercentage;
    }

    public Boolean getPassed() {
        return passed;
    }

    public void setPassed(Boolean passed) {
        this.passed = passed;
    }

    public Integer getCorrect() {
        return correct;
    }

    public void setCorrect(Integer correct) {
        this.correct = correct;
    }

    public Integer getWrong() {
        return wrong;
    }

    public void setWrong(Integer wrong) {
        this.wrong = wrong;
    }

    public Integer getSkipped() {
        return skipped;
    }

    public void setSkipped(Integer skipped) {
        this.skipped = skipped;
    }

    public Integer getPendingManual() {
        return pendingManual;
    }

    public void setPendingManual(Integer pendingManual) {
        this.pendingManual = pendingManual;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getSubmittedAt() {
        return submittedAt;
    }

    public void setSubmittedAt(LocalDateTime submittedAt) {
        this.submittedAt = submittedAt;
    }
}
