package com.aismartlms.backend.service;

import com.aismartlms.backend.entity.Exam;
import com.aismartlms.backend.entity.ExamAttempt;
import com.aismartlms.backend.entity.User;
import com.aismartlms.backend.repository.ExamAttemptRepository;

import com.fasterxml.jackson.databind.ObjectMapper;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Persists graded exam submissions and reads them back as history.
 * <p>
 * Before this existed the grade was a throwaway {@code Map}: closing the
 * result modal lost the result forever (FEATURE-MATRIX §7).
 */
@Service
public class ExamAttemptService {

    private final ExamAttemptRepository attempts;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public ExamAttemptService(ExamAttemptRepository attempts) {
        this.attempts = attempts;
    }

    // =========================================================
    // SAVE
    // =========================================================

    /**
     * Records one graded submission.
     *
     * @param exam    the paper that was sat
     * @param student who sat it (never null - the caller is authenticated)
     * @param answers the raw answer map as submitted (may be null)
     * @param result  the map returned by {@code ExamService.gradeSubmission}
     * @return the saved row, or {@code null} when the grade could not be read
     *         (a persistence failure must never swallow a student's result
     *         response, so the controller ignores a null)
     */
    public ExamAttempt saveAttempt(
            Exam exam,
            User student,
            Map<String, String> answers,
            Map<String, Object> result) {

        if (exam == null || student == null || result == null) {
            return null;
        }

        try {
            ExamAttempt attempt = new ExamAttempt();

            attempt.setExamId(exam.getId());
            attempt.setUserId(student.getId());
            attempt.setExamTitle(exam.getTitle());
            attempt.setCourseTitle(exam.getCourse() == null
                    ? null
                    : exam.getCourse().getTitle());
            attempt.setStudentName(student.getName());

            attempt.setAnswersJson(answers == null
                    ? "{}"
                    : objectMapper.writeValueAsString(answers));

            attempt.setAwardedMarks(number(result, "awardedMarks"));
            attempt.setGradedMarks(number(result, "gradedMarks"));
            attempt.setPercentage(number(result, "percentage"));
            attempt.setPassingPercentage(number(result, "passingPercentage"));
            attempt.setPassed(Boolean.TRUE.equals(result.get("passed")));
            attempt.setCorrect((int) number(result, "correct"));
            attempt.setWrong((int) number(result, "wrong"));
            attempt.setSkipped((int) number(result, "skipped"));

            int pending = (int) number(result, "pendingManual");
            attempt.setPendingManual(pending);
            attempt.setStatus(pending > 0 ? "AWAITING_MANUAL" : "AUTO_GRADED");

            attempt.setSubmittedAt(parseInstant(result.get("submittedAt")));

            return attempts.save(attempt);

        } catch (Exception e) {
            // Never let bookkeeping failure cost the student their grade.
            return null;
        }
    }

    // =========================================================
    // READ
    // =========================================================

    /** Newest first: every paper this user has ever sat. */
    public List<Map<String, Object>> myAttempts(Long userId) {
        return view(attempts.findByUserIdOrderBySubmittedAtDesc(userId));
    }

    /** Newest first: every attempt at one exam (staff only). */
    public List<Map<String, Object>> attemptsForExam(Long examId) {
        return view(attempts.findByExamIdOrderBySubmittedAtDesc(examId));
    }

    /** Newest first: one user's attempts at one exam. */
    public List<Map<String, Object>> attemptsForExamByUser(Long examId, Long userId) {
        return view(attempts.findByExamIdAndUserIdOrderBySubmittedAtDesc(examId, userId));
    }

    /**
     * One of the caller's own attempts, answers included.
     *
     * @return the view, or empty when the row does not exist or belongs to
     *         somebody else (the caller turns that into a 403)
     */
    public Optional<Map<String, Object>> myAttempt(Long userId, Long attemptId) {

        return attempts.findById(attemptId)
                .filter(row -> userId != null && userId.equals(row.getUserId()))
                .map(this::viewWithAnswers);
    }

    /**
     * Serialised view. The submitted answers are only ever handed back to
     * their own author - staff get the score, not the paper.
     */
    private List<Map<String, Object>> view(List<ExamAttempt> rows) {

        List<Map<String, Object>> out = new ArrayList<>(rows.size());

        for (ExamAttempt row : rows) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", row.getId());
            item.put("examId", row.getExamId());
            item.put("examTitle", row.getExamTitle());
            item.put("courseTitle", row.getCourseTitle());
            item.put("studentName", row.getStudentName());
            item.put("awardedMarks", row.getAwardedMarks());
            item.put("gradedMarks", row.getGradedMarks());
            item.put("percentage", row.getPercentage());
            item.put("passingPercentage", row.getPassingPercentage());
            item.put("passed", row.getPassed());
            item.put("correct", row.getCorrect());
            item.put("wrong", row.getWrong());
            item.put("skipped", row.getSkipped());
            item.put("pendingManual", row.getPendingManual());
            item.put("status", row.getStatus());
            item.put("submittedAt", row.getSubmittedAt() == null
                    ? null
                    : row.getSubmittedAt().toString());
            out.add(item);
        }

        return out;
    }

    /** The author's own view, answers included. */
    private Map<String, Object> viewWithAnswers(ExamAttempt row) {

        Map<String, Object> item = new LinkedHashMap<>();

        item.putAll(view(List.of(row)).get(0));

        Map<String, Object> parsed = new LinkedHashMap<>();
        try {
            parsed = objectMapper.readValue(
                    row.getAnswersJson() == null ? "{}" : row.getAnswersJson(),
                    objectMapper.getTypeFactory().constructMapType(
                            Map.class, String.class, String.class));
        } catch (Exception e) {
            // A corrupt blob simply reads as "no answers stored".
        }
        item.put("answers", parsed);

        return item;
    }

    // =========================================================
    // HELPERS
    // =========================================================

    private double number(Map<String, Object> result, String key) {
        Object value = result.get(key);
        if (value instanceof Number) {
            return ((Number) value).doubleValue();
        }
        if (value != null) {
            try {
                return Double.parseDouble(value.toString());
            } catch (NumberFormatException ignored) {
                // fall through to zero
            }
        }
        return 0.0;
    }

    private LocalDateTime parseInstant(Object value) {
        if (value instanceof LocalDateTime) {
            return (LocalDateTime) value;
        }
        if (value != null) {
            try {
                return LocalDateTime.parse(value.toString());
            } catch (Exception ignored) {
                // fall through
            }
        }
        return LocalDateTime.now();
    }
}
