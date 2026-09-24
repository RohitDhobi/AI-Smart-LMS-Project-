package com.aismartlms.backend.dto;

/** Read-only HOD view of an instructor-course assignment. */
public class HODAssignmentView {

    private Long id;
    private Long instructorId;
    private Long courseId;
    private Long subjectId;
    private Long assignedBy;
    private String assignedByEmail;
    private String assignedByRole;
    private String status;
    private String assignedAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public String getAssignedByEmail() {
        return assignedByEmail;
    }

    public void setAssignedByEmail(String assignedByEmail) {
        this.assignedByEmail = assignedByEmail;
    }

    public String getAssignedByRole() {
        return assignedByRole;
    }

    public void setAssignedByRole(String assignedByRole) {
        this.assignedByRole = assignedByRole;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getAssignedAt() {
        return assignedAt;
    }

    public void setAssignedAt(String assignedAt) {
        this.assignedAt = assignedAt;
    }
}
