package com.aismartlms.backend.repository;

import com.aismartlms.backend.entity.Lesson;
import com.aismartlms.backend.entity.Course;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LessonRepository extends JpaRepository<Lesson, Long> {

    List<Lesson> findByCourseOrderByLessonOrderAsc(Course course);

    List<Lesson> findByCourseIdOrderByLessonOrderAsc(Long courseId);

    List<Lesson> findBySubjectIdOrderByLessonOrderAsc(Long subjectId);
}