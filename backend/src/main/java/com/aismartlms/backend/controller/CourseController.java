package com.aismartlms.backend.controller;

import com.aismartlms.backend.entity.Course;
import com.aismartlms.backend.service.CourseService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/courses")
@CrossOrigin(origins = "*")
public class CourseController {

    private final CourseService courseService;

    public CourseController(CourseService courseService) {
        this.courseService = courseService;
    }

    // =========================
    // CREATE COURSE
    // =========================

    @PostMapping
    public ResponseEntity<Course> createCourse(
            @RequestBody Course course) {

        Course savedCourse =
                courseService.createCourse(course);

        return ResponseEntity.ok(savedCourse);
    }

    // =========================
    // GET ALL COURSES
    // =========================

    @GetMapping
    public ResponseEntity<List<Course>> getAllCourses() {

        return ResponseEntity.ok(
                courseService.getAllCourses()
        );
    }

    // =========================
    // GET COURSE BY ID
    // =========================

    @GetMapping("/{id}")
    public ResponseEntity<Course> getCourseById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                courseService.getCourseById(id)
        );
    }


    @PutMapping("/{id}")
    public ResponseEntity<Course> updateCourse(@PathVariable Long id, @RequestBody Course course) {
        Course existing = courseService.getCourseById(id);
        if (course.getTitle() != null) existing.setTitle(course.getTitle());
        if (course.getDescription() != null) existing.setDescription(course.getDescription());
        if (course.getInstructor() != null) existing.setInstructor(course.getInstructor());
        if (course.getCategory() != null) existing.setCategory(course.getCategory());
        if (course.getDifficulty() != null) existing.setDifficulty(course.getDifficulty());
        if (course.getPrice() != null) existing.setPrice(course.getPrice());
        if (course.getStatus() != null) existing.setStatus(course.getStatus());
        return ResponseEntity.ok(courseService.createCourse(existing));
    }

    // =========================
    // DELETE COURSE
    // =========================

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteCourse(
            @PathVariable Long id) {

        courseService.deleteCourse(id);

        return ResponseEntity.ok(
                "Course deleted successfully"
        );
    }
}