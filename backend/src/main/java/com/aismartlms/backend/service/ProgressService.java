package com.aismartlms.backend.service;

import com.aismartlms.backend.dto.CourseProgressResponse;
import com.aismartlms.backend.entity.Course;
import com.aismartlms.backend.entity.Lesson;
import com.aismartlms.backend.entity.Progress;
import com.aismartlms.backend.entity.User;
import com.aismartlms.backend.repository.CourseRepository;
import com.aismartlms.backend.repository.LessonRepository;
import com.aismartlms.backend.repository.ProgressRepository;
import com.aismartlms.backend.repository.UserRepository;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ProgressService {

    private final ProgressRepository progressRepository;
    private final UserRepository userRepository;
    private final LessonRepository lessonRepository;
    private final CourseRepository courseRepository;

    // =========================
    // CONSTRUCTOR
    // =========================

    public ProgressService(
            ProgressRepository progressRepository,
            UserRepository userRepository,
            LessonRepository lessonRepository,
            CourseRepository courseRepository) {

        this.progressRepository = progressRepository;
        this.userRepository = userRepository;
        this.lessonRepository = lessonRepository;
        this.courseRepository = courseRepository;
    }

    // =========================
    // START LESSON
    // =========================

    public Progress startLesson(
            String email,
            Long lessonId) {

        // Find user
        User user = userRepository
                .findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found")
                );

        // Find lesson
        Lesson lesson = lessonRepository
                .findById(lessonId)
                .orElseThrow(() ->
                        new RuntimeException("Lesson not found")
                );

        // Check whether progress already exists
        return progressRepository
                .findByUserEmailAndLessonId(
                        email,
                        lessonId
                )
                .orElseGet(() -> {

                    Progress progress =
                            new Progress();

                    progress.setUser(user);
                    progress.setLesson(lesson);
                    progress.setProgressPercentage(0);
                    progress.setCompleted(false);
                    progress.setStartedAt(
                            LocalDateTime.now()
                    );

                    return progressRepository.save(
                            progress
                    );
                });
    }

    // =========================
    // UPDATE LESSON PROGRESS
    // =========================

    public Progress updateProgress(
            String email,
            Long lessonId,
            Integer progressPercentage) {

        // Validate percentage
        if (progressPercentage < 0 ||
                progressPercentage > 100) {

            throw new RuntimeException(
                    "Progress percentage must be between 0 and 100"
            );
        }

        // Find existing progress
        Progress progress =
                progressRepository
                        .findByUserEmailAndLessonId(
                                email,
                                lessonId
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Progress not found. Start the lesson first."
                                )
                        );

        // Update percentage
        progress.setProgressPercentage(
                progressPercentage
        );

        // Complete lesson when percentage reaches 100
        if (progressPercentage == 100) {

            progress.setCompleted(true);

            if (progress.getCompletedAt() == null) {

                progress.setCompletedAt(
                        LocalDateTime.now()
                );
            }

        } else {

            progress.setCompleted(false);
            progress.setCompletedAt(null);
        }

        return progressRepository.save(progress);
    }

    // =========================
    // GET MY PROGRESS
    // =========================

    public List<Progress> getMyProgress(
            String email) {

        return progressRepository
                .findByUserEmail(email);
    }

    // =========================
    // GET COURSE PROGRESS
    // =========================

    public CourseProgressResponse getCourseProgress(
            String email,
            Long courseId) {

        // Find course
        Course course = courseRepository
                .findById(courseId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Course not found"
                        )
                );

        // Get all lessons of course
        List<Lesson> lessons =
                course.getLessons();

        int totalLessons =
                lessons.size();

        // Get user's progress for this course
        List<Progress> progressList =
                progressRepository
                        .findByUserEmailAndLessonCourseId(
                                email,
                                courseId
                        );

        // Count completed lessons
        int completedLessons =
                (int) progressList.stream()
                        .filter(Progress::getCompleted)
                        .count();

        // Calculate percentage
        double progressPercentage = 0;

        if (totalLessons > 0) {

            progressPercentage =
                    ((double) completedLessons
                            / totalLessons) * 100;
        }

        // Course completed?
        boolean completed =
                totalLessons > 0 &&
                completedLessons == totalLessons;

        // Return response
        return new CourseProgressResponse(
                course.getId(),
                course.getTitle(),
                totalLessons,
                completedLessons,
                progressPercentage,
                completed
        );
    }
}