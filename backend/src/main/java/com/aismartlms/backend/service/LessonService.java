package com.aismartlms.backend.service;

import com.aismartlms.backend.entity.Course;
import com.aismartlms.backend.entity.Lesson;
import com.aismartlms.backend.repository.CourseRepository;
import com.aismartlms.backend.repository.LessonRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class LessonService {

    private final LessonRepository lessonRepository;
    private final CourseRepository courseRepository;

    public LessonService(
            LessonRepository lessonRepository,
            CourseRepository courseRepository) {

        this.lessonRepository = lessonRepository;
        this.courseRepository = courseRepository;
    }

    // =========================
    // CREATE LESSON
    // =========================

    public Lesson createLesson(
            Long courseId,
            Lesson lesson) {

        Course course = courseRepository
                .findById(courseId)
                .orElseThrow(() ->
                        new RuntimeException("Course not found"));

        lesson.setCourse(course);

        return lessonRepository.save(lesson);
    }

    // =========================
    // GET ALL LESSONS
    // =========================

    public List<Lesson> getAllLessons() {
        return lessonRepository.findAll();
    }

    // =========================
    // GET LESSON BY ID
    // =========================

    public Lesson getLessonById(Long id) {

        return lessonRepository
                .findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Lesson not found"));
    }

    // =========================
    // GET LESSONS BY COURSE
    // =========================

    public List<Lesson> getLessonsByCourse(
            Long courseId) {

        if (!courseRepository.existsById(courseId)) {
            throw new RuntimeException("Course not found");
        }

        return lessonRepository
                .findByCourseIdOrderByLessonOrderAsc(courseId);
    }

    // =========================
    // UPDATE LESSON
    // =========================

    public Lesson updateLesson(
            Long id,
            Lesson updatedLesson) {

        Lesson existingLesson = getLessonById(id);

        existingLesson.setTitle(
                updatedLesson.getTitle());

        existingLesson.setDescription(
                updatedLesson.getDescription());

        existingLesson.setContent(
                updatedLesson.getContent());

        existingLesson.setVideoUrl(
                updatedLesson.getVideoUrl());

        existingLesson.setLessonOrder(
                updatedLesson.getLessonOrder());

        existingLesson.setDurationMinutes(
                updatedLesson.getDurationMinutes());

        return lessonRepository.save(existingLesson);
    }

    // =========================
    // DELETE LESSON
    // =========================

    public void deleteLesson(Long id) {

        if (!lessonRepository.existsById(id)) {
            throw new RuntimeException("Lesson not found");
        }

        lessonRepository.deleteById(id);
    }
}