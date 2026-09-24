package com.aismartlms.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import javax.persistence.*;
import java.time.LocalDateTime;

/**
 * Assignment of an instructor to a subject (or a whole course) made by an HOD.
 *
 * Either subjectId OR courseId (or both) may be set:
 *  - subjectId set  -> instructor manages that subject
 *  - courseId only  -> instructor manages every subject of that course
 */
@Entity
@Table(name = "instructor_course_assignments")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class InstructorCourseAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long instructorId;

    private Long courseId;

    private Long subjectId;

    /** User id of the HOD (or admin) who made the assignment. */
    private Long assignedBy;

    private LocalDateTime assignedAt = LocalDateTime.now();

    /** ACTIVE | REMOVED */
    @Column(nullable = false)
    private String status = "ACTIVE";

    public InstructorCourseAssignment() {
    }

    public InstructorCourseAssignment(
            Long instructorId,
            Long courseId,
            Long subjectId,
            Long assignedBy) {
        this.instructorId = instructorId;
        this.courseId = courseId;
        this.subjectId = subjectId;
        this.assignedBy = assignedBy;
        this.assignedAt = LocalDateTime.now();
        this.status = "ACTIVE";
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getInstructorId() { return instructorId; }
    public void setInstructorId(Long instructorId) { this.instructorId = instructorId; }

    public Long getCourseId() { return courseId; }
    public void setCourseId(Long courseId) { this.courseId = courseId; }

    public Long getSubjectId() { return subjectId; }
    public void setSubjectId(Long subjectId) { this.subjectId = subjectId; }

    public Long getAssignedBy() { return assignedBy; }
    public void setAssignedBy(Long assignedBy) { this.assignedBy = assignedBy; }

    public LocalDateTime getAssignedAt() { return assignedAt; }
    public void setAssignedAt(LocalDateTime assignedAt) { this.assignedAt = assignedAt; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
