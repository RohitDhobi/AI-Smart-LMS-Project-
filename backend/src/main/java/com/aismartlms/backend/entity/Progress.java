package com.aismartlms.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import javax.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "progress")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Progress {

    // =========================
    // ID
    // =========================

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // =========================
    // USER
    // =========================

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;

    // =========================
    // LESSON
    // =========================

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lesson_id", nullable = false)
    @JsonIgnoreProperties({"course"})
    private Lesson lesson;

    // =========================
    // PROGRESS PERCENTAGE
    // =========================

    @Column(nullable = false)
    private Integer progressPercentage = 0;

    // =========================
    // COMPLETED
    // =========================

    @Column(nullable = false)
    private Boolean completed = false;

    // =========================
    // STARTED AT
    // =========================

    private LocalDateTime startedAt;

    // =========================
    // COMPLETED AT
    // =========================

    private LocalDateTime completedAt;

    // =========================
    // DEFAULT CONSTRUCTOR
    // =========================

    public Progress() {
    }

    // =========================
    // CONSTRUCTOR
    // =========================

    public Progress(User user, Lesson lesson) {
        this.user = user;
        this.lesson = lesson;
        this.progressPercentage = 0;
        this.completed = false;
        this.startedAt = LocalDateTime.now();
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

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Lesson getLesson() {
        return lesson;
    }

    public void setLesson(Lesson lesson) {
        this.lesson = lesson;
    }

    public Integer getProgressPercentage() {
        return progressPercentage;
    }

    public void setProgressPercentage(Integer progressPercentage) {
        this.progressPercentage = progressPercentage;
    }

    public Boolean getCompleted() {
        return completed;
    }

    public void setCompleted(Boolean completed) {
        this.completed = completed;
    }

    public LocalDateTime getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(LocalDateTime startedAt) {
        this.startedAt = startedAt;
    }

    public LocalDateTime getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(LocalDateTime completedAt) {
        this.completedAt = completedAt;
    }
}