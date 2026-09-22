package com.aismartlms.backend.service;

import com.aismartlms.backend.entity.Exam;
import com.aismartlms.backend.entity.Course;
import com.aismartlms.backend.repository.ExamRepository;
import com.aismartlms.backend.repository.CourseRepository;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ExamService {

    private final ExamRepository examRepository;
    private final CourseRepository courseRepository;

    public ExamService(ExamRepository examRepository, CourseRepository courseRepository) {
        this.examRepository = examRepository;
        this.courseRepository = courseRepository;
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
        if (exam.getCourse() != null && exam.getCourse().getId() != null) {
            Course course = courseRepository.findById(exam.getCourse().getId())
                    .orElseThrow(() -> new RuntimeException("Course not found"));
            exam.setCourse(course);
        }
        return examRepository.save(exam);
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
