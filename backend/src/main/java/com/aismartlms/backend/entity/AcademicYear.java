package com.aismartlms.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import javax.persistence.*;

/**
 * Academic year an instructor assignment belongs to (e.g. "2025-2026").
 * Exactly one year should be {@code active} at a time; it is the default
 * year used when the HOD creates a new assignment.
 */
@Entity
@Table(name = "academic_years")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class AcademicYear {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Display name, e.g. "2025-2026". */
    @Column(nullable = false, unique = true)
    private String yearName;

    /** Whether this is the current academic year. */
    @Column(nullable = false)
    private boolean active = true;

    public AcademicYear() {
    }

    public AcademicYear(String yearName, boolean active) {
        this.yearName = yearName;
        this.active = active;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getYearName() {
        return yearName;
    }

    public void setYearName(String yearName) {
        this.yearName = yearName;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}
