package com.aismartlms.backend.service;

import com.aismartlms.backend.entity.Exam;
import com.aismartlms.backend.entity.Course;
import com.aismartlms.backend.entity.User;
import com.aismartlms.backend.repository.ExamRepository;
import com.aismartlms.backend.repository.CourseRepository;
import com.aismartlms.backend.repository.UserRepository;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class ExamService {

    private final ExamRepository examRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public ExamService(
            ExamRepository examRepository,
            CourseRepository courseRepository,
            UserRepository userRepository) {
        this.examRepository = examRepository;
        this.courseRepository = courseRepository;
        this.userRepository = userRepository;
    }

    // =========================================================
    // SCHEDULED DAY / TIME SLOT
    // =========================================================

    /**
     * The moment the paper closes: the explicit end time, or the start time
     * plus the exam duration when only a start was given.
     */
    public LocalDateTime effectiveEnd(Exam exam) {
        if (exam == null) {
            return null;
        }
        if (exam.getEndTime() != null) {
            return exam.getEndTime();
        }
        if (exam.getStartTime() != null && exam.getDurationMinutes() != null) {
            return exam.getStartTime().plusMinutes(exam.getDurationMinutes());
        }
        return null;
    }

    /** May the paper be opened at {@code now}? */
    public boolean isOpenAt(Exam exam, LocalDateTime now) {
        if (exam == null) {
            return false;
        }
        LocalDateTime start = exam.getStartTime();
        LocalDateTime end = effectiveEnd(exam);

        // Never scheduled: keep it open so existing exams do not lock out.
        if (start == null && end == null) {
            return true;
        }
        if (start != null && now.isBefore(start)) {
            return false;
        }
        if (end != null && now.isAfter(end)) {
            return false;
        }
        return true;
    }

    /** May the paper be opened right now (server clock)? */
    public boolean isOpenNow(Exam exam) {
        return isOpenAt(exam, LocalDateTime.now());
    }

    /** Reject a slot whose closing time is not after its opening time. */
    private void validateSchedule(LocalDateTime start, LocalDateTime end) {
        if (start != null && end != null && !end.isAfter(start)) {
            throw new RuntimeException("Closing time must be later than the opening time.");
        }
    }

    /**
     * The exam as a student may receive it: everything except the answer key
     * while the paper is outside its slot.
     */
    public Exam visibleToStudent(Exam exam) {
        if (exam == null || isOpenNow(exam) || exam.getQuestionPaper() == null) {
            return exam;
        }
        return withoutPaper(exam);
    }

    /** Same, for a list of exams. */
    public List<Exam> visibleToStudent(List<Exam> exams) {
        if (exams == null) {
            return List.of();
        }
        List<Exam> result = new ArrayList<>(exams.size());
        for (Exam exam : exams) {
            result.add(visibleToStudent(exam));
        }
        return result;
    }

    /** A detached copy of the exam with the question paper stripped. */
    private Exam withoutPaper(Exam exam) {
        Exam copy = new Exam();
        copy.setId(exam.getId());
        copy.setTitle(exam.getTitle());
        copy.setDescription(exam.getDescription());
        copy.setCourse(exam.getCourse());
        copy.setDurationMinutes(exam.getDurationMinutes());
        copy.setTotalMarks(exam.getTotalMarks());
        copy.setPassingMarks(exam.getPassingMarks());
        copy.setNegativeMarking(exam.getNegativeMarking());
        copy.setNegativeMarkValue(exam.getNegativeMarkValue());
        copy.setStartTime(exam.getStartTime());
        copy.setEndTime(exam.getEndTime());
        copy.setStatus(exam.getStatus());
        copy.setCreatedAt(exam.getCreatedAt());
        copy.setQuestionPaper(null);
        return copy;
    }

    // =========================================================
    // GRADING A STUDENT SUBMISSION (only inside the time slot)
    // =========================================================

    /**
     * Grades the answers a student sent for this exam.
     *
     * @param answers keyed by the flat question index ("0", "1", ...) with
     *                the chosen option letter (A-D) or the written answer
     * @return a result map: awardedMarks, gradedMarks, percentage, passed,
     *         correct, wrong, skipped, pendingManual
     */
    public Map<String, Object> gradeSubmission(
            Exam exam, Map<String, String> answers, LocalDateTime now) {

        if (!isOpenAt(exam, now)) {
            throw new RuntimeException(
                    "This exam is not open right now. It opens at "
                            + (exam.getStartTime() == null ? "the scheduled time"
                                    : exam.getStartTime().toString().replace('T', ' '))
                            + ".");
        }

        List<JsonNode> questions = flattenPaper(exam.getQuestionPaper());
        if (questions.isEmpty()) {
            throw new RuntimeException("This exam has no question paper yet.");
        }

        double awarded = 0.0;
        double gradedMarks = 0.0;
        double penalty = Boolean.TRUE.equals(exam.getNegativeMarking())
                && exam.getNegativeMarkValue() != null
                ? exam.getNegativeMarkValue() : 0.0;

        int correct = 0, wrong = 0, skipped = 0, pendingManual = 0;

        for (int i = 0; i < questions.size(); i++) {
            JsonNode q = questions.get(i);
            int marks = q.path("marks").asInt(1);
            String type = q.path("type").asText("mcq").toLowerCase();
            String key = q.path("answer").asText(null);
            boolean hasOptions = q.path("options").isArray() && q.path("options").size() > 0;

            // Descriptive questions (or MCQs without an answer key) need a
            // human to mark them - they never count towards the score here.
            if (!type.startsWith("mcq") || !hasOptions
                    || key == null || key.trim().isEmpty()) {
                pendingManual += 1;
                continue;
            }

            gradedMarks += marks;
            String given = answers == null ? null : answers.get(String.valueOf(i));
            given = given == null ? null : given.trim();

            if (given == null || given.isEmpty()) {
                skipped += 1;
            } else if (given.equalsIgnoreCase(key.trim())) {
                correct += 1;
                awarded += marks;
            } else {
                wrong += 1;
                awarded -= penalty;
            }
        }

        if (awarded < 0) {
            awarded = 0;
        }
        double percentage = gradedMarks > 0 ? (awarded / gradedMarks) * 100 : 0.0;

        double passingPct = 40.0;
        if (exam.getTotalMarks() != null && exam.getTotalMarks() > 0
                && exam.getPassingMarks() != null) {
            passingPct = ((double) exam.getPassingMarks() / exam.getTotalMarks()) * 100;
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("examId", exam.getId());
        result.put("awardedMarks", round2(awarded));
        result.put("gradedMarks", round2(gradedMarks));
        result.put("percentage", round2(percentage));
        result.put("passingPercentage", round2(passingPct));
        result.put("passed", percentage >= passingPct);
        result.put("correct", correct);
        result.put("wrong", wrong);
        result.put("skipped", skipped);
        result.put("pendingManual", pendingManual);
        result.put("submittedAt", now.toString());
        return result;
    }

    /** Questions of a paper in a stable, flat order (sections first). */
    private List<JsonNode> flattenPaper(String raw) {
        List<JsonNode> flat = new ArrayList<>();
        if (raw == null || raw.trim().isEmpty()) {
            return flat;
        }
        try {
            JsonNode paper = objectMapper.readTree(raw);
            if (paper.path("sections").isArray()) {
                for (JsonNode section : paper.path("sections")) {
                    if (!section.path("questions").isArray()) {
                        continue;
                    }
                    for (JsonNode question : section.path("questions")) {
                        flat.add(question);
                    }
                }
            }
            if (flat.isEmpty() && paper.path("questions").isArray()) {
                for (JsonNode question : paper.path("questions")) {
                    flat.add(question);
                }
            }
        } catch (Exception e) {
            // A malformed paper simply grades as empty.
        }
        return flat;
    }

    private double round2(double value) {
        return Math.round(value * 100.0) / 100.0;
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
        validateSchedule(exam.getStartTime(), exam.getEndTime());
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
        validateSchedule(updated.getStartTime(), updated.getEndTime());
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
