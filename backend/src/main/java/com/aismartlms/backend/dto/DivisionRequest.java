package com.aismartlms.backend.dto;

import javax.validation.constraints.Min;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;

/**
 * Payload for creating / updating a Division.
 * Mirrors the HOD "Create Division" form fields.
 */
public class DivisionRequest {

    @NotBlank(message = "Division name is required")
    private String name;

    @NotBlank(message = "Division code is required")
    @Size(max = 8, message = "Division code must be 8 characters or fewer")
    private String code;

    @NotNull(message = "Course is required")
    private Long courseId;

    private Integer academicYear;

    private Integer semester;

    @Min(value = 1, message = "Maximum capacity must be at least 1")
    private Integer maxCapacity = 60;

    /** Optional faculty / class coordinator (User id, role INSTRUCTOR or HOD). */
    private Long classTeacherId;

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

    public Long getCourseId() {
        return courseId;
    }

    public void setCourseId(Long courseId) {
        this.courseId = courseId;
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

    public Long getClassTeacherId() {
        return classTeacherId;
    }

    public void setClassTeacherId(Long classTeacherId) {
        this.classTeacherId = classTeacherId;
    }
}
