package com.aismartlms.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import javax.persistence.*;
import java.time.LocalDateTime;

/**
 * A Division / Section (e.g. "BCA - Division A") inside a degree Course.
 * <p>
 * Students are linked to a Division through {@link User#getDivision()}.
 * A unique constraint prevents duplicate codes for the same course + academic year.
 */
@Entity
@Table(
    name = "divisions",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_division_course_code_year",
        columnNames = {"course_id", "code", "academic_year"}
    )
)
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Division {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Display name, e.g. "Division A". */
    @Column(nullable = false)
    private String name;

    /** Short code, e.g. "A", "B", "C". */
    @Column(nullable = false, length = 8)
    private String code;

    /** Academic year, e.g. 2025. */
    private Integer academicYear;

    /** Optional semester link (1-8). */
    private Integer semester;

    /** Maximum number of students that can be assigned. */
    @Column(nullable = false)
    private Integer maxCapacity = 60;

    /** The degree Course (BCA, MCA, B.Tech ...) this division belongs to. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    /** Optional assigned faculty / class coordinator. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_teacher_id")
    private User classTeacher;

    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Division() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public Integer getAcademicYear() {
        return academicYear;
    }

    public void setAcademicYear(Integer academicYear) {
        this.academicYear = academicYear;
    }

    public Integer getSemester() {
        return semester;
    }

    public void setSemester(Integer semester) {
        this.semester = semester;
    }

    public Integer getMaxCapacity() {
        return maxCapacity;
    }

    public void setMaxCapacity(Integer maxCapacity) {
        this.maxCapacity = maxCapacity;
    }

    public Course getCourse() {
        return course;
    }

    public void setCourse(Course course) {
        this.course = course;
    }

    public User getClassTeacher() {
        return classTeacher;
    }

    public void setClassTeacher(User classTeacher) {
        this.classTeacher = classTeacher;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
