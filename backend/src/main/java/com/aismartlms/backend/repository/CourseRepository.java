package com.aismartlms.backend.repository;

import com.aismartlms.backend.entity.Course;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CourseRepository extends JpaRepository<Course, Long> {

    java.util.Optional<Course> findByCourseCodeIgnoreCase(String courseCode);

    List<Course> findByTitleContainingIgnoreCaseOrDescriptionContainingIgnoreCaseOrInstructorContainingIgnoreCaseOrCategoryContainingIgnoreCaseOrDifficultyContainingIgnoreCase(
            String title, String description, String instructor, String category, String difficulty);

    List<Course> findByPrice(Double price);

    List<Course> findByPriceIsNull();

    List<Course> findByCategoryIgnoreCase(String category);

    List<Course> findByStatusIgnoreCase(String status);

    List<Course> findByInstructorIgnoreCase(String instructor);
}
