package com.aismartlms.backend.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import javax.persistence.*;

@Entity
@Table(name = "lessons")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Lesson {

    // =========================
    // ID
    // =========================

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // =========================
    // LESSON TITLE
    // =========================

    @Column(nullable = false)
    private String title;

    // =========================
    // LESSON DESCRIPTION
    // =========================

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    // =========================
    // LESSON CONTENT
    // =========================

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    // =========================
    // VIDEO URL
    // =========================

    private String videoUrl;

    // =========================
    // LESSON ORDER
    // =========================

    @Column(nullable = false)
    private Integer lessonOrder;

    // =========================
    // DURATION
    // =========================

    @Column(nullable = false)
    private Integer durationMinutes;

    // =========================
    // COURSE
    // =========================

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    @JsonBackReference
    private Course course;

    // =========================
    // SUBJECT (optional - lessons can belong to a subject)
    // =========================

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id")
    @JsonBackReference("subject-lessons")
    private Subject subject;

    // =========================
    // DEFAULT CONSTRUCTOR
    // =========================

    public Lesson() {
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

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getVideoUrl() {
        return videoUrl;
    }

    public void setVideoUrl(String videoUrl) {
        this.videoUrl = videoUrl;
    }

    public Integer getLessonOrder() {
        return lessonOrder;
    }

    public void setLessonOrder(Integer lessonOrder) {
        this.lessonOrder = lessonOrder;
    }

    public Integer getDurationMinutes() {
        return durationMinutes;
    }

    public void setDurationMinutes(Integer durationMinutes) {
        this.durationMinutes = durationMinutes;
    }

    public Course getCourse() {
        return course;
    }

    public void setCourse(Course course) {
        this.course = course;
    }

    public Subject getSubject() {
        return subject;
    }

    public void setSubject(Subject subject) {
        this.subject = subject;
    }
}