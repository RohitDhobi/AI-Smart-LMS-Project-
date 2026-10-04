package com.aismartlms.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import javax.persistence.*;

/**
 * One semester of a degree course (e.g. "Semester 1" of BCA).
 *
 * Kept as its own table (per the Instructor Assignment spec) so an
 * instructor assignment can point at Course + Semester + Academic Year.
 */
@Entity
@Table(name = "semesters")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Semester {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 1-based semester number within the course (Semester 1 .. Semester N). */
    @Column(nullable = false)
    private Integer semesterNumber;

    /** The course this semester belongs to. */
    @Column(nullable = false)
    private Long courseId;

    public Semester() {
    }

    public Semester(Integer semesterNumber, Long courseId) {
        this.semesterNumber = semesterNumber;
        this.courseId = courseId;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Integer getSemesterNumber() {
        return semesterNumber;
    }

    public void setSemesterNumber(Integer semesterNumber) {
        this.semesterNumber = semesterNumber;
    }

    public Long getCourseId() {
        return courseId;
    }

    public void setCourseId(Long courseId) {
        this.courseId = courseId;
    }
}
