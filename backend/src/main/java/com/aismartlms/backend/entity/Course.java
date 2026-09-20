package com.aismartlms.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import javax.persistence.*;

import java.util.ArrayList;
import java.util.List;
import java.time.LocalDateTime;

@Entity
@Table(name = "courses")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Course {

    // =========================
    // ID
    // =========================

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // =========================
    // COURSE TITLE
    // =========================

    @Column(nullable = false)
    private String title;

    // =========================
    // DEGREE COURSE CODE (BCA, MCA, MBA ...)
    // =========================

    private String courseCode;

    // =========================
    // DEGREE COURSE NAME (full name of the program)
    // =========================

    private String courseName;

    // =========================
    // COURSE DURATION
    // =========================

    private String duration;

    // =========================
    // TOTAL SEMESTERS
    // =========================

    private Integer totalSemesters;

    // =========================
    // COURSE DESCRIPTION
    // =========================

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    // =========================
    // INSTRUCTOR
    // =========================

    @Column(nullable = false)
    private String instructor;

    private String category;

    private String difficulty = "BEGINNER";

    private String status = "APPROVED";

    private Double price = 0.0;

    private LocalDateTime createdAt = LocalDateTime.now();

    // =========================
    // LESSONS
    // =========================

    @OneToMany(
        mappedBy = "course",
        cascade = CascadeType.ALL,
        orphanRemoval = true
    )
    @OrderBy("lessonOrder ASC")
    @JsonManagedReference
    private List<Lesson> lessons = new ArrayList<>();

    // =========================
    // SUBJECTS (degree programs)
    // =========================

    @OneToMany(
        mappedBy = "course",
        cascade = CascadeType.ALL,
        orphanRemoval = true
    )
    @OrderBy("semester ASC, subjectName ASC")
    @JsonManagedReference("course-subjects")
    private List<Subject> subjects = new ArrayList<>();

    // =========================
    // DEFAULT CONSTRUCTOR
    // =========================

    public Course() {
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

    public String getCourseCode() { return courseCode; }
    public void setCourseCode(String courseCode) { this.courseCode = courseCode; }
    public String getCourseName() { return courseName; }
    public void setCourseName(String courseName) { this.courseName = courseName; }
    public String getDuration() { return duration; }
    public void setDuration(String duration) { this.duration = duration; }
    public Integer getTotalSemesters() { return totalSemesters; }
    public void setTotalSemesters(Integer totalSemesters) { this.totalSemesters = totalSemesters; }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getInstructor() { return instructor; }
    public void setInstructor(String instructor) { this.instructor = instructor; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Double getPrice() { return price; }
    public void setPrice(Double price) { this.price = price; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public List<Lesson> getLessons() {
        return lessons;
    }

    public void setLessons(List<Lesson> lessons) {
        this.lessons = lessons;
    }

    public List<Subject> getSubjects() {
        return subjects;
    }

    public void setSubjects(List<Subject> subjects) {
        this.subjects = subjects;
    }

    // =========================
    // ADD SUBJECT
    // =========================

    public void addSubject(Subject subject) {
        subjects.add(subject);
        subject.setCourse(this);
    }

    // =========================
    // ADD LESSON
    // =========================

    public void addLesson(Lesson lesson) {
        lessons.add(lesson);
        lesson.setCourse(this);
    }

    // =========================
    // REMOVE LESSON
    // =========================

    public void removeLesson(Lesson lesson) {
        lessons.remove(lesson);
        lesson.setCourse(null);
    }
}