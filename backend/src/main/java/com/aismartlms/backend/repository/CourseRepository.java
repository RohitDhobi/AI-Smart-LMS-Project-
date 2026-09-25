package com.aismartlms.backend.repository;

import com.aismartlms.backend.entity.Course;
import com.aismartlms.backend.entity.Subject;
import com.aismartlms.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

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

    /** Count distinct instructors and HODs. */
    @Query("SELECT COUNT(DISTINCT u) FROM User u WHERE u.role = com.aismartlms.backend.entity.Role.INSTRUCTOR OR u.role = com.aismartlms.backend.entity.Role.HOD")
    Long countDistinctInstructorsAndHODs();

    /** Count distinct students (users with STUDENT role). */
    @Query("SELECT COUNT(DISTINCT u) FROM User u WHERE u.role = com.aismartlms.backend.entity.Role.STUDENT")
    Long countDistinctStudents();

    /** Find the User (instructor/HOD/student) by their ID.
     *  Must be an explicit @Query: as a derived query on this Course repository,
     *  "findUserById" parsed as Course WHERE id = :id and failed converting
     *  Course -> User ("No converter found capable of converting..."). */
    @Query("SELECT u FROM User u WHERE u.id = :id")
    Optional<User> findUserById(@org.springframework.data.repository.query.Param("id") Long id);

    /** Find the Subject by its ID (same derived-query pitfall as above). */
    @Query("SELECT s FROM Subject s WHERE s.id = :id")
    Optional<Subject> findSubjectById(@org.springframework.data.repository.query.Param("id") Long id);
}
