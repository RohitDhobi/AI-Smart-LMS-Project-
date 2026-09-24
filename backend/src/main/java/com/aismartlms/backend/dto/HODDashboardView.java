package com.aismartlms.backend.dto;

import java.util.List;

/** Read-only view returned for the HOD dashboard. */
public class HODDashboardView {

    private Long totalCourses;
    private Long totalSubjects;
    private Long totalInstructors;
    private Long totalStudents;
    private Long totalAssignments;
    private Long totalExams;
    private Long totalQuizzes;
    private Long totalStudentsEnrolled;
    private Long totalActiveAssignments;
    private Long pendingAssignments;
    private Long pendingExams;
    private Long pendingQuizzes;

    public Long getTotalCourses() {
        return totalCourses;
    }

    public void setTotalCourses(Long totalCourses) {
        this.totalCourses = totalCourses;
    }

    public Long getTotalSubjects() {
        return totalSubjects;
    }

    public void setTotalSubjects(Long totalSubjects) {
        this.totalSubjects = totalSubjects;
    }

    public Long getTotalInstructors() {
        return totalInstructors;
    }

    public void setTotalInstructors(Long totalInstructors) {
        this.totalInstructors = totalInstructors;
    }

    public Long getTotalStudents() {
        return totalStudents;
    }

    public void setTotalStudents(Long totalStudents) {
        this.totalStudents = totalStudents;
    }

    public Long getTotalAssignments() {
        return totalAssignments;
    }

    public void setTotalAssignments(Long totalAssignments) {
        this.totalAssignments = totalAssignments;
    }

    public Long getTotalExams() {
        return totalExams;
    }

    public void setTotalExams(Long totalExams) {
        this.totalExams = totalExams;
    }

    public Long getTotalQuizzes() {
        return totalQuizzes;
    }

    public void setTotalQuizzes(Long totalQuizzes) {
        this.totalQuizzes = totalQuizzes;
    }

    public Long getTotalStudentsEnrolled() {
        return totalStudentsEnrolled;
    }

    public void setTotalStudentsEnrolled(Long totalStudentsEnrolled) {
        this.totalStudentsEnrolled = totalStudentsEnrolled;
    }

    public Long getTotalActiveAssignments() {
        return totalActiveAssignments;
    }

    public void setTotalActiveAssignments(Long totalActiveAssignments) {
        this.totalActiveAssignments = totalActiveAssignments;
    }

    public Long getPendingAssignments() {
        return pendingAssignments;
    }

    public void setPendingAssignments(Long pendingAssignments) {
        this.pendingAssignments = pendingAssignments;
    }

    public Long getPendingExams() {
        return pendingExams;
    }

    public void setPendingExams(Long pendingExams) {
        this.pendingExams = pendingExams;
    }

    public Long getPendingQuizzes() {
        return pendingQuizzes;
    }

    public void setPendingQuizzes(Long pendingQuizzes) {
        this.pendingQuizzes = pendingQuizzes;
    }

    public List<HODAssignmentView> getAssignments() {
        return null;
    }

    public void setAssignments(List<HODAssignmentView> assignments) {
    }
}
