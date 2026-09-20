package com.aismartlms.backend.controller;

import com.aismartlms.backend.entity.Lesson;
import com.aismartlms.backend.service.LessonService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/lessons")
@CrossOrigin(origins = "*")
public class LessonController {

    private final LessonService lessonService;

    public LessonController(
            LessonService lessonService) {

        this.lessonService = lessonService;
    }

    // =========================
    // CREATE LESSON
    // =========================

    @PostMapping("/course/{courseId}")
    public ResponseEntity<Lesson> createLesson(
            @PathVariable Long courseId,
            @RequestBody Lesson lesson) {

        return ResponseEntity.ok(
                lessonService.createLesson(
                        courseId,
                        lesson
                )
        );
    }

    // =========================
    // GET ALL LESSONS
    // =========================

    @GetMapping
    public ResponseEntity<List<Lesson>> getAllLessons() {

        return ResponseEntity.ok(
                lessonService.getAllLessons()
        );
    }

    // =========================
    // GET LESSON BY ID
    // =========================

    @GetMapping("/{id}")
    public ResponseEntity<Lesson> getLessonById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                lessonService.getLessonById(id)
        );
    }

    // =========================
    // GET LESSONS BY COURSE
    // =========================

    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<Lesson>> getLessonsByCourse(
            @PathVariable Long courseId) {

        return ResponseEntity.ok(
                lessonService.getLessonsByCourse(
                        courseId
                )
        );
    }

    // =========================
    // UPDATE LESSON
    // =========================

    @PutMapping("/{id}")
    public ResponseEntity<Lesson> updateLesson(
            @PathVariable Long id,
            @RequestBody Lesson lesson) {

        return ResponseEntity.ok(
                lessonService.updateLesson(
                        id,
                        lesson
                )
        );
    }

    // =========================
    // DELETE LESSON
    // =========================

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteLesson(
            @PathVariable Long id) {

        lessonService.deleteLesson(id);

        return ResponseEntity.ok(
                "Lesson deleted successfully"
        );
    }
}