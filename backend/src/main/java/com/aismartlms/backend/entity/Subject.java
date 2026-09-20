package com.aismartlms.backend.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import javax.persistence.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "subjects")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Subject {

    // =========================
    // ID
    // =========================

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // =========================
    // SUBJECT CODE
    // =========================

    private String subjectCode;

    // =========================
    // SUBJECT NAME
    // =========================

    @Column(nullable = false)
    private String subjectName;

    // =========================
    // DESCRIPTION
    // =========================

    @Column(columnDefinition = "TEXT")
    private String description;

    // =========================
    // SEMESTER
    // =========================

    @Column(nullable = false)
    private Integer semester;

    // =========================
    // COURSE
    // =========================

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    @JsonBackReference("course-subjects")
    private Course course;

    // =========================
    // LESSONS
    // =========================

    @OneToMany(
            mappedBy = "subject",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    @OrderBy("lessonOrder ASC")
    @JsonManagedReference("subject-lessons")
    private List<Lesson> lessons = new ArrayList<>();

    // =========================
    // DEFAULT CONSTRUCTOR
    // =========================

    public Subject() {
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

    public String getSubjectCode() {
        return subjectCode;
    }

    public void setSubjectCode(String subjectCode) {
        this.subjectCode = subjectCode;
    }

    public String getSubjectName() {
        return subjectName;
    }

    public void setSubjectName(String subjectName) {
        this.subjectName = subjectName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Integer getSemester() {
        return semester;
    }

    public void setSemester(Integer semester) {
        this.semester = semester;
    }

    public Course getCourse() {
        return course;
    }

    public void setCourse(Course course) {
        this.course = course;
    }

    public List<Lesson> getLessons() {
        return lessons;
    }

    public void setLessons(List<Lesson> lessons) {
        this.lessons = lessons;
    }

    // =========================
    // ADD LESSON
    // =========================

    public void addLesson(Lesson lesson) {
        lessons.add(lesson);
        lesson.setSubject(this);
    }
}
