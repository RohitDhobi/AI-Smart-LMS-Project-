package com.aismartlms.backend.service;

import com.aismartlms.backend.entity.Exam;
import com.aismartlms.backend.entity.Course;
import com.aismartlms.backend.entity.User;
import com.aismartlms.backend.repository.ExamRepository;
import com.aismartlms.backend.repository.CourseRepository;
import com.aismartlms.backend.repository.UserRepository;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ExamService {

    private final ExamRepository examRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;

    public ExamService(
            ExamRepository examRepository,
            CourseRepository courseRepository,
            UserRepository userRepository) {
        this.examRepository = examRepository;
        this.courseRepository = courseRepository;
        this.userRepository = userRepository;
    }

    public List<Exam> getAllExams() {
        return examRepository.findAll();
    }

    public List<Exam> getExamsByCourse(Long courseId) {
        return examRepository.findByCourseId(courseId);
    }

    public Exam getExamById(Long id) {
        return examRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Exam not found"));
    }

    public Exam createExam(Exam exam) {
        // exams.course_id is NOT NULL, so an exam can never be saved without a
        // course. Callers such as the AI Tools "Upload" button don't send one,
        // so fall back to a sensible course instead of failing the insert.
        Course course = resolveCourse(exam.getCourse());
        exam.setCourse(course);
        return examRepository.save(exam);
    }

    /**
     * Resolves the course a new exam would be saved against, without saving.
     * Lets the controller run the HOD assignment check (HTTP 403) before any
     * write happens.
     */
    public Course peekCourseForNewExam(Exam exam) {
        return resolveCourse(exam.getCourse());
    }

    /**
     * Resolves the course an exam belongs to:
     * 1. The explicitly requested course id (if present),
     * 2. a course taught by the currently authenticated instructor,
     * 3. any existing course (seeded degree programs).
     */
    private Course resolveCourse(Course requested) {
        if (requested != null && requested.getId() != null) {
            return courseRepository.findById(requested.getId())
                    .orElseThrow(() -> new RuntimeException("Course not found for id " + requested.getId()));
        }

        Course instructorsCourse = findCurrentInstructorsCourse();
        if (instructorsCourse != null) {
            return instructorsCourse;
        }

        return courseRepository.findAll().stream()
                .findFirst()
                .orElseThrow(() -> new RuntimeException(
                        "No courses exist yet. Create a course before creating an exam."));
    }

    private Course findCurrentInstructorsCourse() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || auth.getName() == null || auth.getName().isEmpty()) {
                return null;
            }
            User user = userRepository.findByEmail(auth.getName()).orElse(null);
            if (user == null || user.getName() == null) {
                return null;
            }
            List<Course> taught = courseRepository.findByInstructorIgnoreCase(user.getName());
            return taught.isEmpty() ? null : taught.get(0);
        } catch (Exception e) {
            return null;
        }
    }

    public Exam updateExam(Long id, Exam updated) {
        Exam existing = getExamById(id);
        existing.setTitle(updated.getTitle());
        existing.setDescription(updated.getDescription());
        existing.setDurationMinutes(updated.getDurationMinutes());
        existing.setTotalMarks(updated.getTotalMarks());
        existing.setPassingMarks(updated.getPassingMarks());
        existing.setNegativeMarking(updated.getNegativeMarking());
        existing.setNegativeMarkValue(updated.getNegativeMarkValue());
        existing.setStartTime(updated.getStartTime());
        existing.setEndTime(updated.getEndTime());
        existing.setStatus(updated.getStatus());
        existing.setQuestionPaper(updated.getQuestionPaper());
        return examRepository.save(existing);
    }

    public void deleteExam(Long id) {
        examRepository.deleteById(id);
    }
}
