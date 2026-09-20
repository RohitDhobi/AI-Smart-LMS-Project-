package com.aismartlms.backend.controller;

import com.aismartlms.backend.entity.Course;
import com.aismartlms.backend.entity.User;
import com.aismartlms.backend.entity.Certificate;
import com.aismartlms.backend.service.InstructorCertificateService;
import com.aismartlms.backend.repository.CourseRepository;
import com.aismartlms.backend.repository.UserRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/instructor/certificates")
@CrossOrigin(origins = "*")
public class InstructorCertificateController {

    private final InstructorCertificateService certificateService;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;

    public InstructorCertificateController(
            InstructorCertificateService certificateService,
            CourseRepository courseRepository,
            UserRepository userRepository) {

        this.certificateService = certificateService;
        this.courseRepository = courseRepository;
        this.userRepository = userRepository;
    }

    // =========================
    // GET STATS
    // =========================

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats(Authentication auth) {
        String instructorName = getInstructorName(auth);
        return ResponseEntity.ok(certificateService.getStats(instructorName));
    }

    // =========================
    // GET INSTRUCTOR COURSES
    // =========================

    @GetMapping("/courses")
    public ResponseEntity<List<Course>> getCourses(Authentication auth) {
        String instructorName = getInstructorName(auth);
        return ResponseEntity.ok(certificateService.getInstructorCourses(instructorName));
    }

    // =========================
    // GET STUDENTS WITH ELIGIBILITY FOR A COURSE
    // =========================

    @GetMapping("/course/{courseId}/students")
    public ResponseEntity<List<Map<String, Object>>> getCourseStudents(
            @PathVariable Long courseId,
            Authentication auth) {

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));

        List<Map<String, Object>> students = certificateService.getEligibleStudents(course);
        return ResponseEntity.ok(students);
    }

    // =========================
    // CHECK ELIGIBILITY FOR SPECIFIC STUDENT
    // =========================

    @GetMapping("/course/{courseId}/student/{studentId}/eligibility")
    public ResponseEntity<Map<String, Object>> checkEligibility(
            @PathVariable Long courseId,
            @PathVariable Long studentId,
            Authentication auth) {

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));

        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        Map<String, Object> eligibility = certificateService.checkEligibility(student, course);
        return ResponseEntity.ok(eligibility);
    }

    // =========================
    // GENERATE CERTIFICATE
    // =========================

    @PostMapping("/generate")
    public ResponseEntity<?> generateCertificate(
            @RequestBody Map<String, Long> body,
            Authentication auth) {

        Long courseId = body.get("courseId");
        Long studentId = body.get("studentId");

        if (courseId == null || studentId == null) {
            return ResponseEntity.badRequest().body("courseId and studentId are required");
        }

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));

        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        String instructorName = getInstructorName(auth);

        try {
            Certificate cert = certificateService.generateCertificate(student, course, instructorName);
            return ResponseEntity.ok(cert);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // =========================
    // REVOKE CERTIFICATE
    // =========================

    @PutMapping("/{id}/revoke")
    public ResponseEntity<?> revokeCertificate(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            Authentication auth) {

        String reason = body.getOrDefault("reason", "No reason provided");

        try {
            Certificate cert = certificateService.revokeCertificate(id, reason);
            return ResponseEntity.ok(cert);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // =========================
    // VERIFY CERTIFICATE
    // =========================

    @GetMapping("/verify/{certId}")
    public ResponseEntity<?> verifyCertificate(@PathVariable String certId) {
        try {
            Map<String, Object> result = certificateService.verifyCertificate(certId);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // =========================
    // GET ALL CERTIFICATES
    // =========================

    @GetMapping
    public ResponseEntity<List<Certificate>> getAllCertificates(
            @RequestParam(required = false) String status,
            Authentication auth) {

        String instructorName = getInstructorName(auth);

        if (status != null && !status.isEmpty()) {
            return ResponseEntity.ok(certificateService.getCertificatesByStatus(instructorName, status));
        }

        return ResponseEntity.ok(certificateService.getAllCertificates(instructorName));
    }

    // =========================
    // HELPER: GET INSTRUCTOR NAME
    // =========================

    private String getInstructorName(Authentication auth) {
        return userRepository.findByEmail(auth.getName())
                .map(User::getName)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
