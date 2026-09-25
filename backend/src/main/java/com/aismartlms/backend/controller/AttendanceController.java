package com.aismartlms.backend.controller;

import com.aismartlms.backend.entity.Attendance;
import com.aismartlms.backend.service.AttendanceService;
import com.aismartlms.backend.service.InstructorAccessService;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/attendance")
@CrossOrigin(origins = "*")
public class AttendanceController {

    private final AttendanceService attendanceService;
    private final InstructorAccessService access;

    public AttendanceController(
            AttendanceService attendanceService,
            InstructorAccessService access) {
        this.attendanceService = attendanceService;
        this.access = access;
    }

    // Attendance marking is a management action on a course: only the
    // instructor the HOD assigned to that course may record it (HTTP 403).
    @PostMapping
    public ResponseEntity<Attendance> markAttendance(@RequestBody Attendance attendance) {

        if (attendance.getCourse() != null
                && attendance.getCourse().getId() != null) {
            access.requireCourseManage(attendance.getCourse().getId());
        }

        return ResponseEntity.ok(attendanceService.markAttendance(attendance));
    }

    @GetMapping("/my")
    public ResponseEntity<List<Attendance>> getMyAttendance(Authentication authentication) {
        return ResponseEntity.ok(attendanceService.getMyAttendance(authentication.getName()));
    }

    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<Attendance>> getAttendanceByCourse(@PathVariable Long courseId) {
        return ResponseEntity.ok(attendanceService.getAttendanceByCourse(courseId));
    }

    @GetMapping("/course/{courseId}/date/{date}")
    public ResponseEntity<List<Attendance>> getAttendanceByCourseAndDate(
            @PathVariable Long courseId,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(attendanceService.getAttendanceByCourseAndDate(courseId, date));
    }

    @GetMapping("/my/course/{courseId}")
    public ResponseEntity<List<Attendance>> getMyAttendanceByCourse(
            @PathVariable Long courseId,
            Authentication authentication) {
        return ResponseEntity.ok(attendanceService.getMyAttendanceByCourse(authentication.getName(), courseId));
    }
}
