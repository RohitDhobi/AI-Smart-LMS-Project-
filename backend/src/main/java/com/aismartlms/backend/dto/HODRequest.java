package com.aismartlms.backend.dto;

/**
 * Simple flat DTO used by HOD endpoints that accept a small JSON body.
 * Kept separate from the existing DTOs so the existing RegisterRequest /
 * LoginRequest / InstructorRequest classes are untouched.
 */
public class HODRequest {

    private Long instructorId;
    private Long courseId;
    private Long subjectId;
    private Long assignedBy;
    private String status;

    public HODRequest() {
    }

    public Long getInstructorId() {
        return instructorId;
    }

    public void setInstructorId(Long instructorId) {
        this.instructorId = instructorId;
    }

    public Long getCourseId() {
        return courseId;
    }

    public void setCourseId(Long courseId) {
        this.courseId = courseId;
    }

    public Long getSubjectId() {
        return subjectId;
    }

    public void setSubjectId(Long subjectId) {
        this.subjectId = subjectId;
    }

    public Long getAssignedBy() {
        return assignedBy;
    }

    public void setAssignedBy(Long assignedBy) {
        this.assignedBy = assignedBy;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
