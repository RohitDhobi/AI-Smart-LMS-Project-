package com.aismartlms.backend.controller;

import com.aismartlms.backend.dto.CourseProgressResponse;
import com.aismartlms.backend.entity.Progress;
import com.aismartlms.backend.service.ProgressService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/progress")
@CrossOrigin(origins = "*")
public class ProgressController {

    private final ProgressService progressService;

    // =========================
    // CONSTRUCTOR
    // =========================

    public ProgressController(ProgressService progressService) {
        this.progressService = progressService;
    }

    // =========================
    // START LESSON
    // =========================

    @PostMapping("/lesson/{lessonId}")
    public ResponseEntity<Progress> startLesson(
            @PathVariable Long lessonId,
            Authentication authentication) {

        String email = authentication.getName();

        return ResponseEntity.ok(
                progressService.startLesson(
                        email,
                        lessonId
                )
        );
    }

    // =========================
    // UPDATE LESSON PROGRESS
    // =========================

    @PutMapping("/lesson/{lessonId}")
    public ResponseEntity<Progress> updateProgress(
            @PathVariable Long lessonId,
            @RequestParam Integer progressPercentage,
            Authentication authentication) {

        String email = authentication.getName();

        return ResponseEntity.ok(
                progressService.updateProgress(
                        email,
                        lessonId,
                        progressPercentage
                )
        );
    }

    // =========================
    // GET MY PROGRESS
    // =========================

    @GetMapping("/my")
    public ResponseEntity<List<Progress>> getMyProgress(
            Authentication authentication) {

        String email = authentication.getName();

        return ResponseEntity.ok(
                progressService.getMyProgress(email)
        );
    }

    // =========================
    // GET COURSE PROGRESS
    // =========================

    @GetMapping("/course/{courseId}")
    public ResponseEntity<CourseProgressResponse> getCourseProgress(
            @PathVariable Long courseId,
            Authentication authentication) {

        String email = authentication.getName();

        return ResponseEntity.ok(
                progressService.getCourseProgress(
                        email,
                        courseId
                )
        );
    }
}