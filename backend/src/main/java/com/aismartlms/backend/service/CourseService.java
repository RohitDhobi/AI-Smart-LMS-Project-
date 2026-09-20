package com.aismartlms.backend.service;

import com.aismartlms.backend.entity.Course;
import com.aismartlms.backend.repository.CourseRepository;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CourseService {

    private final CourseRepository courseRepository;

    public CourseService(CourseRepository courseRepository) {
        this.courseRepository = courseRepository;
    }

    // =========================
    // CREATE COURSE
    // =========================

    public Course createCourse(Course course) {
        if (course.getStatus() == null || course.getStatus().isBlank()) course.setStatus("APPROVED");
        if (course.getDifficulty() == null || course.getDifficulty().isBlank()) course.setDifficulty("BEGINNER");
        if (course.getPrice() == null) course.setPrice(0.0);
        return courseRepository.save(course);
    }

    // =========================
    // GET ALL COURSES
    // =========================

    public List<Course> getAllCourses() {
        return courseRepository.findAll();
    }

    // =========================
    // GET COURSE BY ID
    // =========================

    public Course getCourseById(Long id) {

        return courseRepository
                .findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Course not found")
                );
    }

    // =========================
    // DELETE COURSE
    // =========================

    public void deleteCourse(Long id) {

        if (!courseRepository.existsById(id)) {
            throw new RuntimeException("Course not found");
        }

        courseRepository.deleteById(id);
    }
}