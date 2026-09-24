package com.aismartlms.backend.repository;

import com.aismartlms.backend.entity.Course;
import com.aismartlms.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CourseRepository extends JpaRepository<Course, Long> {

    java.util.Optional<Course> findByCourseCodeIgnoreCase(String courseCode);

    List<Course> findByTitleContainingIgnoreCaseOrDescriptionContainingIgnoreCaseOrInstructorContainingIgnoreCaseOrCategoryContainingIgnoreCaseOrDifficultyContainingIgnoreCase(
            String title, String description, String instructor, String category, String difficulty);

    List<Course> findByPrice(Double price);

    List<Course> findByPriceIsNull();

    List<Course> findByCategoryIgnoreCase(String category);

    List<Course> findByStatusIgnoreCase(String status);

    List<Course> findByInstructorIgnoreCase(String instructor);

    /** Count courses that have at least one subject (distinct subject rows). */
    @Query("SELECT COUNT(DISTINCT s) FROM Subject s")
    Long countDistinctSubjects();

    /** Count distinct users that hold the INSTRUCTOR or HOD role. */
    @Query("SELECT COUNT(DISTINCT u) FROM User u WHERE u.role = com.aismartlms.backend.entity.Role.INSTRUCTOR OR u.role = com.aismartlms.backend.entity.Role.HOD")
    Long countDistinctInstructorsAndHODs();

    /** Count distinct students (users with STUDENT role). */
    @Query("SELECT COUNT(DISTINCT u) FROM User u WHERE u.role = com.aismartlms.backend.entity.Role.STUDENT")
    Long countDistinctStudents();

    /** Count distinct students (users with STUDENT role). */
    @Query("SELECT COUNT(DISTINCT u) FROM User u WHERE u.role = com.aismartlms.backend.entity.Role.STUDENT")
    Long countDistinctStudents();

    /** Find the User (instructor/HOD/student) by their ID. */
    Optional<User> findUserById(Long id);

    /** Find the User (instructor/HOD/student) by their ID. */
    Optional<User> findUserById(Long id);

    /** Find the Subject by its ID, including its parent Course for navigation. */
    Optional<Subject> findSubjectById(Long id);
}
