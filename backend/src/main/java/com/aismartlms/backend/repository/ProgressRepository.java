// package com.aismartlms.backend.repository;

// import com.aismartlms.backend.entity.Lesson;
// import com.aismartlms.backend.entity.Progress;
// import com.aismartlms.backend.entity.User;
// import org.springframework.data.jpa.repository.JpaRepository;

// import java.util.List;
// import java.util.Optional;

// public interface ProgressRepository extends JpaRepository<Progress, Long> {

//     // Find progress for a specific student and lesson
//     Optional<Progress> findByUserAndLesson(User user, Lesson lesson);

//     // Find all progress records of a student
//     List<Progress> findByUser(User user);

//     // Find all progress records for a particular lesson
//     List<Progress> findByLesson(Lesson lesson);

//     // Check whether progress already exists
//     boolean existsByUserAndLesson(User user, Lesson lesson);
// }

package com.aismartlms.backend.repository;

import com.aismartlms.backend.entity.Progress;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProgressRepository extends JpaRepository<Progress, Long> {

    Optional<Progress> findByUserEmailAndLessonId(
            String email,
            Long lessonId
    );

    List<Progress> findByUserEmail(String email);

    List<Progress> findByUserEmailAndLessonCourseId(
            String email,
            Long courseId
    );

    List<Progress> findByUserEmailAndLessonSubjectId(
            String email,
            Long subjectId
    );

    void deleteByLessonCourseId(Long courseId);

    void deleteByLessonId(Long lessonId);
}