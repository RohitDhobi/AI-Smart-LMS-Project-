package com.aismartlms.backend.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import javax.persistence.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "exams")
public class Exam {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    // Write-only: clients can send { "course": { "id": 1 } } when creating an
    // exam, but the (lazy) course is never serialized back in responses.
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private Course course;

    private Integer durationMinutes = 60;

    private Integer totalMarks = 100;

    private Integer passingMarks = 40;

    private Boolean negativeMarking = false;

    private Double negativeMarkValue = 0.0;

    private LocalDateTime startTime;

    private LocalDateTime endTime;

    private String status = "SCHEDULED";

    private LocalDateTime createdAt = LocalDateTime.now();

    // =========================
    // HOD APPROVAL WORKFLOW
    //
    // Status flow:
    //   DRAFT -> PENDING_HOD_APPROVAL -> APPROVED -> PUBLISHED
    //                    \-> REJECTED -> (edit) -> PENDING_HOD_APPROVAL
    // =========================

    /** Optional subject this exam belongs to (degree programs have subjects). */
    private Long subjectId;

    /** Denormalized subject name, kept for list/approval views. */
    private String subjectName;

    /** User id of the instructor who created the exam. */
    private Long createdBy;

    /** Denormalized creator name (list views never join the users table). */
    private String createdByName;

    /** When the instructor submitted the exam for HOD approval. */
    private LocalDateTime submittedAt;

    /** User id of the HOD (or admin) who approved the exam. */
    private Long approvedBy;

    /** Denormalized approver name - shown as "Approved By: ..." in the UI. */
    private String approvedByName;

    private LocalDateTime approvedAt;

    /** Why the HOD rejected the exam (feedback for the instructor). */
    @Column(columnDefinition = "TEXT")
    private String rejectionReason;

    /** When the instructor published the (approved) exam to students. */
    private LocalDateTime publishedAt;

    // JSON-serialized AI-generated question paper (uploaded from AI Tools)
    @Column(columnDefinition = "TEXT")
    private String questionPaper;


    @OneToMany(
            mappedBy = "quiz",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private List<Question> questions = new ArrayList<>();

    public Exam() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Course getCourse() { return course; }
    public void setCourse(Course course) { this.course = course; }
    public Integer getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; }
    public Integer getTotalMarks() { return totalMarks; }
    public void setTotalMarks(Integer totalMarks) { this.totalMarks = totalMarks; }
    public Integer getPassingMarks() { return passingMarks; }
    public void setPassingMarks(Integer passingMarks) { this.passingMarks = passingMarks; }
    public Boolean getNegativeMarking() { return negativeMarking; }
    public void setNegativeMarking(Boolean negativeMarking) { this.negativeMarking = negativeMarking; }
    public Double getNegativeMarkValue() { return negativeMarkValue; }
    public void setNegativeMarkValue(Double negativeMarkValue) { this.negativeMarkValue = negativeMarkValue; }
    public LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }
    public LocalDateTime getEndTime() { return endTime; }
    public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Long getSubjectId() { return subjectId; }
    public void setSubjectId(Long subjectId) { this.subjectId = subjectId; }
    public String getSubjectName() { return subjectName; }
    public void setSubjectName(String subjectName) { this.subjectName = subjectName; }
    public Long getCreatedBy() { return createdBy; }
    public void setCreatedBy(Long createdBy) { this.createdBy = createdBy; }
    public String getCreatedByName() { return createdByName; }
    public void setCreatedByName(String createdByName) { this.createdByName = createdByName; }
    public LocalDateTime getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; }
    public Long getApprovedBy() { return approvedBy; }
    public void setApprovedBy(Long approvedBy) { this.approvedBy = approvedBy; }
    public String getApprovedByName() { return approvedByName; }
    public void setApprovedByName(String approvedByName) { this.approvedByName = approvedByName; }
    public LocalDateTime getApprovedAt() { return approvedAt; }
    public void setApprovedAt(LocalDateTime approvedAt) { this.approvedAt = approvedAt; }
    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }
    public LocalDateTime getPublishedAt() { return publishedAt; }
    public void setPublishedAt(LocalDateTime publishedAt) { this.publishedAt = publishedAt; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public String getQuestionPaper() { return questionPaper; }
    public void setQuestionPaper(String questionPaper) { this.questionPaper = questionPaper; }

    public List<Question> getQuestions() { return questions; }
    public void setQuestions(List<Question> questions) { this.questions = questions; }

    // The course itself is write-only (lazy), so expose read-only ids/names
    // for the exam lists - "My Exams" and the HOD approvals table need them.
    public Long getCourseId() {
        return course == null ? null : course.getId();
    }

    public String getCourseName() {
        return course == null ? null : course.getTitle();
    }
}
