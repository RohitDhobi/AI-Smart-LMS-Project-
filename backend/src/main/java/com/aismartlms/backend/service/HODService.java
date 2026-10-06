package com.aismartlms.backend.service;

import com.aismartlms.backend.dto.HODAssignmentView;
import com.aismartlms.backend.dto.HODDashboardView;
import com.aismartlms.backend.dto.HODRequest;
import com.aismartlms.backend.dto.DivisionRequest;
import com.aismartlms.backend.dto.DivisionResponse;
import com.aismartlms.backend.entity.AcademicYear;
import com.aismartlms.backend.entity.Announcement;
import com.aismartlms.backend.entity.Course;
import com.aismartlms.backend.entity.Division;
import com.aismartlms.backend.entity.Enrollment;
import com.aismartlms.backend.entity.InstructorCourseAssignment;
import com.aismartlms.backend.entity.Role;
import com.aismartlms.backend.entity.Semester;
import com.aismartlms.backend.entity.Subject;
import com.aismartlms.backend.entity.User;
import com.aismartlms.backend.repository.AcademicYearRepository;
import com.aismartlms.backend.repository.AnnouncementRepository;
import com.aismartlms.backend.repository.CourseRepository;
import com.aismartlms.backend.repository.DivisionRepository;
import com.aismartlms.backend.repository.ExamRepository;
import com.aismartlms.backend.repository.InstructorCourseAssignmentRepository;
import com.aismartlms.backend.repository.QuestionRepository;
import com.aismartlms.backend.repository.EnrollmentRepository;
import com.aismartlms.backend.repository.QuizRepository;
import com.aismartlms.backend.repository.SemesterRepository;
import com.aismartlms.backend.repository.SubjectRepository;
import com.aismartlms.backend.repository.UserRepository;
import com.aismartlms.backend.exception.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for all HOD (Head of Department) operations.
 * Reuses the existing Course, Subject, Instructor and User systems.
 */
@Service
public class HODService {

    private final InstructorCourseAssignmentRepository assignmentRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final QuizRepository quizRepository;
    private final ExamRepository examRepository;
    private final QuestionRepository questionRepository;
    private final SubjectRepository subjectRepository;
    private final UserRepository userRepository;
    private final AnnouncementRepository announcementRepository;
    private final DivisionRepository divisionRepository;
    private final SemesterRepository semesterRepository;
    private final AcademicYearRepository academicYearRepository;

    public HODService(
            InstructorCourseAssignmentRepository assignmentRepository,
            CourseRepository courseRepository,
            EnrollmentRepository enrollmentRepository,
            QuizRepository quizRepository,
            ExamRepository examRepository,
            QuestionRepository questionRepository,
            SubjectRepository subjectRepository,
            UserRepository userRepository,
            AnnouncementRepository announcementRepository,
            DivisionRepository divisionRepository,
            SemesterRepository semesterRepository,
            AcademicYearRepository academicYearRepository) {

        this.assignmentRepository = assignmentRepository;
        this.courseRepository = courseRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.quizRepository = quizRepository;
        this.examRepository = examRepository;
        this.questionRepository = questionRepository;
        this.subjectRepository = subjectRepository;
        this.userRepository = userRepository;
        this.announcementRepository = announcementRepository;
        this.divisionRepository = divisionRepository;
        this.semesterRepository = semesterRepository;
        this.academicYearRepository = academicYearRepository;
    }

    // =========================
    // READ ASSIGNMENT LIST
    // =========================

    /** All assignments in the whole platform. Used by the HOD "Instructor Assignment" page. */
    public List<HODAssignmentView> getAllAssignments() {
        return assignmentRepository.findAll().stream()
                .map(this::toView)
                .collect(Collectors.toList());
    }

    /** Assignments belonging to a specific instructor. */
    public List<HODAssignmentView> getAssignmentsByInstructorId(Long instructorId) {
        return assignmentRepository.findByInstructorId(instructorId).stream()
                .map(this::toView)
                .collect(Collectors.toList());
    }

    /** Assignments belonging to a specific course. */
    public List<HODAssignmentView> getAssignmentsByCourseId(Long courseId) {
        return assignmentRepository.findByCourseId(courseId).stream()
                .map(this::toView)
                .collect(Collectors.toList());
    }

    /** Assignments belonging to a specific subject. */
    public List<HODAssignmentView> getAssignmentsBySubjectId(Long subjectId) {
        return assignmentRepository.findBySubjectId(subjectId).stream()
                .map(this::toView)
                .collect(Collectors.toList());
    }

    /** Simple existence check used by the controller to decide 403 vs 200. */
    public boolean isInstructorAssignedToCourse(Long instructorId, Long courseId) {
        return assignmentRepository.findByInstructorIdAndStatus(instructorId, "ACTIVE")
                .stream()
                .anyMatch(a -> Objects.equals(a.getCourseId(), courseId));
    }

    /** Whether the instructor has any ACTIVE assignment at all. */
    public boolean isInstructorAssigned(Long instructorId) {
        return assignmentRepository.findByInstructorIdAndStatus(instructorId, "ACTIVE").size() > 0;
    }

    // =========================
    // CREATE / UPDATE / REMOVE
    // =========================

    @Transactional
    public InstructorCourseAssignment createAssignment(HODRequest request) {
        Long instructorId = request.getInstructorId();
        Long courseId = request.getCourseId();
        Long subjectId = request.getSubjectId();

        if (instructorId == null || courseId == null) {
            throw new RuntimeException("Instructor ID and Course ID are required");
        }

        // Normalize legacy: a subject assignment also carries the parent course.
        if (subjectId != null) {
            Subject subject = subjectRepository.findById(subjectId)
                    .orElseThrow(() -> new RuntimeException("Subject not found"));

            if (subject.getCourse() != null) {
                courseId = subject.getCourse().getId();
            }
        }

        // Prevent duplicates at the right scope: a subject row only conflicts
        // with the same subject, a course-wide row with another course-wide row.
        // (The old rule blocked every subject of a course the instructor was
        // already attached to, which made per-subject changes impossible.)
        Long targetCourseId = courseId;
        boolean exists = assignmentRepository
                .findByInstructorIdAndStatus(instructorId, "ACTIVE")
                .stream()
                .anyMatch(a -> {
                    if (subjectId != null) {
                        return Objects.equals(a.getSubjectId(), subjectId);
                    }
                    boolean courseWide = a.getSubjectId() == null || a.getSubjectId() == 0L;
                    return courseWide && Objects.equals(a.getCourseId(), targetCourseId);
                });

        if (exists) {
            throw new RuntimeException(subjectId != null
                    ? "This instructor is already assigned to this subject"
                    : "This instructor is already assigned to this course");
        }

        // Semester + academic year the HOD picked in the assignment form.
        Long semesterId = request.getSemesterId();

        if (semesterId == null && subjectId != null) {
            // Default to the semester the subject belongs to.
            Subject subject = subjectRepository.findById(subjectId).orElse(null);
            if (subject != null && subject.getSemester() != null && courseId != null) {
                semesterId = semesterRepository
                        .findByCourseIdAndSemesterNumber(courseId, subject.getSemester())
                        .map(Semester::getId)
                        .orElse(null);
            }
        }

        if (semesterId != null) {
            Semester semester = semesterRepository.findById(semesterId)
                    .orElseThrow(() -> new RuntimeException("Semester not found"));

            if (courseId != null && !courseId.equals(semester.getCourseId())) {
                throw new RuntimeException("The selected semester does not belong to this course");
            }

            semesterId = semester.getId();
        }

        Long academicYearId = resolveAcademicYearId(request.getAcademicYearId());

        // The Instructor Assignment page shows exactly ONE instructor per
        // subject (and per course for course-wide rows). If somebody already
        // occupies that scope, take that row over instead of stacking a second
        // one on top of it: stacked rows are invisible - the listing keeps
        // showing the older instructor, so the instructor the HOD just assigned
        // never appeared and searching for their name returned nothing.
        InstructorCourseAssignment existing = findActiveRowForScope(courseId, subjectId);

        if (existing != null) {
            existing.setInstructorId(instructorId);
            existing.setStatus("ACTIVE");
            if (semesterId != null) {
                existing.setSemesterId(semesterId);
            }
            existing.setAcademicYearId(academicYearId);
            if (request.getAssignedBy() != null) {
                existing.setAssignedBy(request.getAssignedBy());
            }
            existing.setAssignedAt(LocalDateTime.now());
            return assignmentRepository.save(existing);
        }

        InstructorCourseAssignment assignment = new InstructorCourseAssignment(
                instructorId,
                courseId,
                subjectId,
                request.getAssignedBy() != null ? request.getAssignedBy() : null
        );

        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            assignment.setStatus(request.getStatus().toUpperCase());
        } else {
            assignment.setStatus("ACTIVE");
        }

        assignment.setAcademicYearId(academicYearId);

        if (semesterId != null) {
            assignment.setSemesterId(semesterId);
        }

        return assignmentRepository.save(assignment);
    }

    /**
     * The ACTIVE row that already covers this exact scope - the one subject, or
     * the whole course for a course-wide assignment - or {@code null} when the
     * scope is still free.
     */
    private InstructorCourseAssignment findActiveRowForScope(Long courseId, Long subjectId) {
        if (subjectId != null) {
            return visibleRow(assignmentRepository.findBySubjectIdAndStatus(subjectId, "ACTIVE"));
        }

        if (courseId == null) {
            return null;
        }

        List<InstructorCourseAssignment> courseRows =
                assignmentRepository.findByCourseIdAndStatus(courseId, "ACTIVE");

        return visibleRow(courseRows.stream()
                .filter(r -> !isSubjectScoped(r))
                .collect(Collectors.toList()));
    }

    /**
     * The row the Instructor Assignment page renders for a scope. Legacy data can
     * hold several ACTIVE rows for the same subject / course, and taking
     * "whichever row the database returned first" meant a freshly assigned
     * instructor stayed invisible while the previous one kept showing up (and
     * stayed searchable). The most recently assigned row wins; ties fall back to
     * the lowest id so seeded rows keep displaying exactly as before.
     */
    private InstructorCourseAssignment visibleRow(List<InstructorCourseAssignment> rows) {
        if (rows == null || rows.isEmpty()) {
            return null;
        }
        return rows.stream().min(MOST_RECENT_FIRST).orElse(rows.get(0));
    }

    /** Newest assignment first, null / unknown dates last, ties by lowest id. */
    private static final Comparator<InstructorCourseAssignment> MOST_RECENT_FIRST =
            Comparator
                    .comparing(InstructorCourseAssignment::getAssignedAt,
                            Comparator.<LocalDateTime>nullsFirst(Comparator.naturalOrder()))
                    .reversed()
                    .thenComparing(InstructorCourseAssignment::getId,
                            Comparator.<Long>nullsLast(Comparator.naturalOrder()));

    @Transactional
    public InstructorCourseAssignment updateAssignment(Long id, HODRequest request) {
        InstructorCourseAssignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));

        Long oldCourseId = assignment.getCourseId();
        Long newCourseId = request.getCourseId();
        Long newSubjectId = request.getSubjectId();

        if (newCourseId != null) {
            // If a new course is being set, make sure the instructor is not
            // already actively assigned to it (duplicate guard).
            if (newCourseId == null || !newCourseId.equals(oldCourseId)) {
                boolean duplicate = assignmentRepository
                        .findByInstructorIdAndStatus(assignment.getInstructorId(), "ACTIVE")
                        .stream()
                        .anyMatch(a -> Objects.equals(a.getCourseId(), newCourseId));

                if (duplicate) {
                    throw new RuntimeException("This instructor is already assigned to the selected course");
                }
            }

            // If removing from the current course, also clean up any
            // subject-level row pointing to the same subject.
            if (oldCourseId != null && !oldCourseId.equals(newCourseId)) {
                assignmentRepository
                        .findByInstructorIdAndCourseIdAndStatus(assignment.getInstructorId(), oldCourseId, "ACTIVE")
                        .stream()
                        .filter(a -> a.getSubjectId() != null && a.getSubjectId() != 0L)
                        .findFirst()
                        .ifPresent(a -> {
                            assignmentRepository.delete(a);
                        });
            }

            assignment.setCourseId(newCourseId);
        }

        if (newSubjectId != null) {
            assignment.setSubjectId(newSubjectId);
        }

        // CHANGE THE INSTRUCTOR. This used to be ignored entirely, so the HOD
        // "Change" button reported success while the row kept its old
        // instructor - the exact bug reported on the Instructor Assignment page.
        Long newInstructorId = request.getInstructorId();

        if (newInstructorId != null && !newInstructorId.equals(assignment.getInstructorId())) {

            boolean duplicate = assignmentRepository
                    .findByInstructorIdAndStatus(newInstructorId, "ACTIVE")
                    .stream()
                    .anyMatch(a -> !Objects.equals(a.getId(), assignment.getId())
                            && coversSameScope(a, assignment));

            if (duplicate) {
                throw new RuntimeException(isSubjectScoped(assignment)
                        ? "This instructor is already assigned to this subject"
                        : "This instructor is already assigned to this course");
            }

            assignment.setInstructorId(newInstructorId);
        }

        if (request.getAssignedBy() != null) {
            assignment.setAssignedBy(request.getAssignedBy());
        }

        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            assignment.setStatus(request.getStatus().toUpperCase());
        }

        // Update the semester / academic year scope when the form supplies them.
        if (request.getSemesterId() != null) {
            Semester semester = semesterRepository.findById(request.getSemesterId())
                    .orElseThrow(() -> new RuntimeException("Semester not found"));
            assignment.setSemesterId(semester.getId());
        }

        if (request.getAcademicYearId() != null) {
            AcademicYear year = academicYearRepository.findById(request.getAcademicYearId())
                    .orElseThrow(() -> new RuntimeException("Academic year not found"));
            assignment.setAcademicYearId(year.getId());
        }

        return assignmentRepository.save(assignment);
    }

    /** Subject-level row (scoped to one subject) vs course-wide row. */
    private boolean isSubjectScoped(InstructorCourseAssignment a) {
        return a.getSubjectId() != null && a.getSubjectId() != 0L;
    }

    /** Whether {@code candidate} already covers exactly the same scope as {@code target}. */
    private boolean coversSameScope(
            InstructorCourseAssignment candidate,
            InstructorCourseAssignment target) {

        if (isSubjectScoped(target)) {
            return Objects.equals(candidate.getSubjectId(), target.getSubjectId());
        }

        return !isSubjectScoped(candidate)
                && Objects.equals(candidate.getCourseId(), target.getCourseId());
    }

    /** Delete the assignment row for one instructor + one subject. */
    @Transactional
    public void deleteAssignment(Long instructorId, Long subjectId) {
        assignmentRepository.deleteByInstructorIdAndSubjectId(instructorId, subjectId);
    }

    /** Delete one assignment row by its primary key. */
    @Transactional
    public void deleteAssignmentById(Long id) {
        if (!assignmentRepository.existsById(id)) {
            throw new RuntimeException("Assignment not found");
        }
        assignmentRepository.deleteById(id);
    }

    // =========================
    // ACADEMIC STRUCTURE: SEMESTERS / ACADEMIC YEARS
    // =========================

    /** All semesters, or only those of one course (drop-down source). */
    public List<Map<String, Object>> getSemesters(Long courseId) {

        List<Semester> list = courseId != null
                ? semesterRepository.findByCourseIdOrderBySemesterNumberAsc(courseId)
                : semesterRepository.findAllByOrderByCourseIdAscSemesterNumberAsc();

        List<Map<String, Object>> result = new ArrayList<>();

        for (Semester semester : list) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", semester.getId());
            item.put("semesterNumber", semester.getSemesterNumber());
            item.put("label", "Semester " + semester.getSemesterNumber());
            item.put("courseId", semester.getCourseId());
            result.add(item);
        }

        return result;
    }

    /** All academic years, newest first (drop-down source + filter). */
    public List<Map<String, Object>> getAcademicYears() {

        List<Map<String, Object>> result = new ArrayList<>();

        for (AcademicYear year : academicYearRepository.findAllByOrderByYearNameDesc()) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", year.getId());
            item.put("yearName", year.getYearName());
            item.put("active", year.isActive());
            result.add(item);
        }

        return result;
    }

    /** The HOD may add the next academic year (e.g. 2027-2028). */
    @Transactional
    public Map<String, Object> createAcademicYear(String yearName, Boolean active) {

        if (yearName == null || !yearName.trim().matches("\\d{4}-\\d{4}")) {
            throw new RuntimeException("Academic year must look like 2025-2026");
        }

        String normalized = yearName.trim();

        if (academicYearRepository.findByYearName(normalized).isPresent()) {
            throw new RuntimeException("That academic year already exists");
        }

        boolean makeActive = Boolean.TRUE.equals(active);

        if (makeActive) {
            academicYearRepository.findAll().forEach(existing -> {
                if (existing.isActive()) {
                    existing.setActive(false);
                    academicYearRepository.save(existing);
                }
            });
        }

        AcademicYear saved = academicYearRepository.save(new AcademicYear(normalized, makeActive));

        Map<String, Object> item = new LinkedHashMap<>();
        item.put("id", saved.getId());
        item.put("yearName", saved.getYearName());
        item.put("active", saved.isActive());
        return item;
    }

    /** Display name of an academic year, or null when unset/unknown. */
    private String yearName(Long academicYearId) {
        if (academicYearId == null) {
            return null;
        }
        return academicYearRepository.findById(academicYearId)
                .map(AcademicYear::getYearName)
                .orElse(null);
    }

    /**
     * Academic year to store on an assignment: the one the HOD picked,
     * otherwise the currently active year, otherwise null.
     */
    private Long resolveAcademicYearId(Long requested) {
        if (requested != null) {
            AcademicYear year = academicYearRepository.findById(requested)
                    .orElseThrow(() -> new RuntimeException("Academic year not found"));
            return year.getId();
        }
        return academicYearRepository.findFirstByActiveTrue()
                .map(AcademicYear::getId)
                .orElse(null);
    }

    // =========================
    // DASHBOARD
    // =========================

    public HODDashboardView getDashboard() {
        HODDashboardView view = new HODDashboardView();

        Long totalCourses = (long) courseRepository.count();
        Long totalSubjects = (long) courseRepository.countDistinctSubjects();

        Long totalInstructors = (long) courseRepository.countDistinctInstructorsAndHODs();

        // Every user with role INSTRUCTOR is an instructor on the platform.
        Long totalStudents = (long) courseRepository.countDistinctStudents();

        Long totalAssignments = (long) assignmentRepository.count();
        Long totalExams = (long) examRepository.count();
        Long totalQuizzes = (long) quizRepository.count();

        Long totalStudentsEnrolled = (long) enrollmentRepository.count();
        Long totalActiveAssignments = (long) assignmentRepository.countByStatus("ACTIVE");
        Long pendingAssignments = (long) assignmentRepository.countByStatus("PENDING");

        view.setTotalCourses(totalCourses);
        view.setTotalSubjects(totalSubjects);
        view.setTotalInstructors(totalInstructors);
        view.setTotalStudents(totalStudents);
        view.setTotalAssignments(totalAssignments);
        view.setTotalExams(totalExams);
        view.setTotalQuizzes(totalQuizzes);
        view.setTotalStudentsEnrolled(totalStudentsEnrolled);
        view.setTotalActiveAssignments(totalActiveAssignments);
        view.setPendingAssignments(pendingAssignments);

        return view;
    }

    // =========================
    // COURSES / SUBJECTS / STUDENTS
    //
    // Read-only listings reused by the HOD Courses & Subjects pages.
    // They build on the existing Course / Subject / User tables.
    // =========================

    /** Every course with its subject and student counts. */
    public List<Map<String, Object>> getCourses() {

        List<Map<String, Object>> result = new ArrayList<>();

        for (Course course : courseRepository.findAll()) {

            Map<String, Object> item = new LinkedHashMap<>();

            item.put("id", course.getId());
            item.put("courseCode", course.getCourseCode());
            item.put("courseName", course.getCourseName());
            item.put("title", course.getTitle());
            item.put("description", course.getDescription());
            item.put("category", course.getCategory());
            item.put("difficulty", course.getDifficulty());
            item.put("instructor", course.getInstructor());
            item.put("price", course.getPrice());
            item.put("duration", course.getDuration());
            item.put("status", course.getStatus());
            item.put("totalSemesters", course.getTotalSemesters());

            List<Subject> courseSubjects = subjectRepository.findByCourseId(course.getId());

            item.put("subjectCount", courseSubjects.size());
            item.put("studentCount", userRepository.findByCourse(course).size());

            // How many instructors the HOD has assigned to this course.
            item.put("assignedInstructors",
                    assignmentRepository.findByCourseIdAndStatus(course.getId(), "ACTIVE").size());

            result.add(item);
        }

        return result;
    }

    /** Every subject, flattened with its parent course name. */
    public List<Map<String, Object>> getSubjects() {

        List<Map<String, Object>> result = new ArrayList<>();

        for (Subject subject : subjectRepository.findAll()) {

            Map<String, Object> item = new LinkedHashMap<>();

            item.put("id", subject.getId());
            item.put("subjectCode", subject.getSubjectCode());
            item.put("subjectName", subject.getSubjectName());
            item.put("description", subject.getDescription());
            item.put("semester", subject.getSemester());

            Long courseId = subject.getCourse() == null ? null : subject.getCourse().getId();
            String courseName = subject.getCourse() == null ? null : subject.getCourse().getCourseName();

            item.put("courseId", courseId);
            item.put("courseName", courseName);            // Instructor assigned to this subject by the HOD, if any.
            String assigned = null;
            Long assignedInstructorId = null;
            InstructorCourseAssignment assignmentRow = null;

            if (courseId != null) {

                List<InstructorCourseAssignment> rows =
                        assignmentRepository.findBySubjectIdAndStatus(subject.getId(), "ACTIVE");

                if (rows.isEmpty()) {
                    // Fall back to the course-wide row. Subject-level rows for
                    // OTHER subjects of this course must never leak in here,
                    // otherwise changing one subject would rewrite the whole course.
                    List<InstructorCourseAssignment> courseRows = assignmentRepository.findByCourseIdAndStatus(courseId, "ACTIVE");

                    rows = courseRows.stream()
                            .filter(r -> !isSubjectScoped(r))
                            .collect(Collectors.toList());

                    if (rows.isEmpty()) {
                        rows = courseRows; // legacy data: only subject rows exist
                    }
                }

                if (!rows.isEmpty()) {
                    assignmentRow = visibleRow(rows);
                    assignedInstructorId = assignmentRow.getInstructorId();
                    assigned = userRepository.findById(assignedInstructorId)
                            .map(User::getName)
                            .orElse(null);
                }
            }

            item.put("assignedInstructor", assigned);
            item.put("assignedInstructorId", assignedInstructorId);

            // Semester / academic-year context for the assignment table columns.
            item.put("assignmentId", assignmentRow == null ? null : assignmentRow.getId());
            item.put("assignmentStatus", assignmentRow == null ? null : assignmentRow.getStatus());
            item.put("assignmentSemesterId",
                    assignmentRow == null ? null : assignmentRow.getSemesterId());
            item.put("academicYearId",
                    assignmentRow == null ? null : assignmentRow.getAcademicYearId());
            item.put("academicYear",
                    assignmentRow == null ? null : yearName(assignmentRow.getAcademicYearId()));

            result.add(item);
        }

        return result;
    }

    /** All students (role = STUDENT) with their enrolled course. */
    public List<Map<String, Object>> getStudents() {

        List<Map<String, Object>> result = new ArrayList<>();

        for (User user : userRepository.findAll()) {

            if (user.getRole() != Role.STUDENT) {
                continue;
            }

            Map<String, Object> item = new LinkedHashMap<>();

            item.put("id", user.getId());
            item.put("name", user.getName());
            item.put("email", user.getEmail());
            item.put("phone", user.getPhone());
            item.put("role", user.getRole() == null ? null : user.getRole().name());
            item.put("active", user.getActive());

            if (user.getCourse() != null) {
                item.put("courseId", user.getCourse().getId());
                item.put("courseName", user.getCourse().getCourseName());
            } else {
                item.put("courseId", null);
                item.put("courseName", null);
            }

            // Division / section (e.g. "Div A") the student belongs to.
            if (user.getDivision() != null) {
                item.put("divisionId", user.getDivision().getId());
                item.put("divisionName", user.getDivision().getName());
                item.put("divisionCode", user.getDivision().getCode());
            } else {
                item.put("divisionId", null);
                item.put("divisionName", null);
                item.put("divisionCode", null);
            }

            result.add(item);
        }

        return result;
    }

    /** All instructors (role = INSTRUCTOR) - the Assign dropdown source. */
    public List<Map<String, Object>> getInstructors() {

        List<Map<String, Object>> result = new ArrayList<>();

        for (User user : userRepository.findAll()) {

            if (user.getRole() != Role.INSTRUCTOR) {
                continue;
            }

            Map<String, Object> item = new LinkedHashMap<>();

            item.put("id", user.getId());
            item.put("name", user.getName());
            item.put("email", user.getEmail());
            item.put("active", user.getActive());
            item.put("assignedCourses",
                    assignmentRepository.countByInstructorIdAndStatus(user.getId(), "ACTIVE"));

            result.add(item);
        }

        return result;
    }

    // =========================
    // ANNOUNCEMENTS
    // =========================

    public List<Announcement> getAnnouncements() {
        return announcementRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional
    public Announcement createAnnouncement(
            String title, String content, User postedBy) {

        if (title == null || title.isBlank()) {
            throw new RuntimeException("Announcement title is required");
        }

        Announcement announcement = new Announcement(
                title.trim(),
                content,
                postedBy == null ? null : postedBy.getId());

        if (postedBy != null && postedBy.getRole() != null) {
            announcement.setPostedByRole(postedBy.getRole().name());
        }

        return announcementRepository.save(announcement);
    }

    // =========================
    // DIVISIONS / SECTIONS (e.g. BCA Div A, B, C)
    // =========================

    /** Every division on the platform, newest first. */
    public List<DivisionResponse> getAllDivisions() {
        return divisionRepository.findAll().stream()
                .map(this::toDivisionView)
                .collect(Collectors.toList());
    }

    /** Divisions for one course (optionally filtered by semester). */
    public List<DivisionResponse> getDivisionsByCourse(Long courseId, Integer semester) {
        List<Division> divisions = (semester == null
                ? divisionRepository.findByCourseIdOrderByCodeAsc(courseId)
                : divisionRepository.findByCourseIdAndSemesterOrderByCodeAsc(courseId, semester));

        return divisions.stream()
                .map(this::toDivisionView)
                .collect(Collectors.toList());
    }

    /** Single division (used by the edit form and student allocator). */
    public DivisionResponse getDivision(Long id) {
        Division division = divisionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Division not found with id " + id));
        return toDivisionView(division);
    }

    @Transactional
    public DivisionResponse createDivision(DivisionRequest request) {
        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new RuntimeException("Course not found with id " + request.getCourseId()));

        String code = normalizeDivisionCode(request.getCode());

        if (divisionRepository.existsByCourseIdAndCodeAndAcademicYear(
                course.getId(), code, request.getAcademicYear())) {
            throw new RuntimeException(
                    "Division '" + code + "' already exists for this course and academic year");
        }

        Division division = new Division();
        applyDivisionFields(division, request, course, code);
        division = divisionRepository.save(division);

        return toDivisionView(division);
    }

    @Transactional
    public DivisionResponse updateDivision(Long id, DivisionRequest request) {
        Division division = divisionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Division not found with id " + id));

        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new RuntimeException("Course not found with id " + request.getCourseId()));

        String code = normalizeDivisionCode(request.getCode());

        if (divisionRepository.existsByCourseIdAndCodeAndAcademicYearAndIdNot(
                course.getId(), code, request.getAcademicYear(), id)) {
            throw new RuntimeException(
                    "Division '" + code + "' already exists for this course and academic year");
        }

        applyDivisionFields(division, request, course, code);
        division = divisionRepository.save(division);

        return toDivisionView(division);
    }

    /**
     * Safe delete: student references are cleared first so no student keeps a
     * dangling division id (no cascade delete on purpose).
     */
    @Transactional
    public void deleteDivision(Long id) {
        Division division = divisionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Division not found with id " + id));

        List<User> assigned = userRepository.findByDivisionId(id);
        for (User student : assigned) {
            student.setDivision(null);
        }
        if (!assigned.isEmpty()) {
            userRepository.saveAll(assigned);
        }

        divisionRepository.delete(division);
    }

    /** Put one student into a division (validates course match + capacity). */
    @Transactional
    public DivisionResponse assignStudentToDivision(Long divisionId, Long studentId) {
        Division division = divisionRepository.findById(divisionId)
                .orElseThrow(() -> new RuntimeException("Division not found with id " + divisionId));

        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found with id " + studentId));

        requireCapacity(division, student);
        ensureStudentInDivisionCourse(student, division);

        student.setDivision(division);
        userRepository.save(student);

        return toDivisionView(division);
    }

    /**
     * Bulk assignment: skips students that are already assigned, belong to a
     * different course, or would exceed the division capacity.
     * Returns how many were assigned plus per-student skip reasons.
     */
    @Transactional
    public Map<String, Object> bulkAssignStudents(Long divisionId, List<Long> studentIds) {
        Division division = divisionRepository.findById(divisionId)
                .orElseThrow(() -> new RuntimeException("Division not found with id " + divisionId));

        List<String> skipped = new ArrayList<>();
        int assigned = 0;

        for (Long studentId : studentIds) {
            User student = userRepository.findById(studentId).orElse(null);
            if (student == null) {
                skipped.add("Student " + studentId + ": not found");
                continue;
            }
            if (student.getRole() != Role.STUDENT) {
                skipped.add(student.getName() + ": not a student");
                continue;
            }

            // A student that has no course yet can be pulled into this
            // division's course (see ensureStudentInDivisionCourse); a student
            // who already belongs to another course is skipped.
            boolean courseMatch = division.getCourse() != null
                    && (student.getCourse() == null
                        || Objects.equals(
                            student.getCourse().getId(),
                            division.getCourse().getId()));
            if (!courseMatch) {
                skipped.add(student.getName() + ": different course");
                continue;
            }

            if (student.getDivision() != null
                    && Objects.equals(student.getDivision().getId(), division.getId())) {
                // Already in this division - nothing to do.
                continue;
            }

            long count = userRepository.countByDivisionId(divisionId);
            int capacity = division.getMaxCapacity() == null ? 60 : division.getMaxCapacity();
            if (count >= capacity) {
                skipped.add(student.getName() + ": division is full (" + capacity + ")");
                continue;
            }

            if (student.getCourse() == null) {
                // Course-less student: adopt the division's course so the
                // assignment is consistent with the rest of the system.
                ensureStudentInDivisionCourse(student, division);
            }
            student.setDivision(division);
            userRepository.save(student);
            assigned++;
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("assigned", assigned);
        result.put("skipped", skipped);
        return result;
    }

    /** Take students out of a division (used by the Manage Students view). */
    @Transactional
    public Map<String, Object> removeStudentsFromDivision(Long divisionId, List<Long> studentIds) {
        divisionRepository.findById(divisionId)
                .orElseThrow(() -> new RuntimeException("Division not found with id " + divisionId));

        List<String> removed = new ArrayList<>();
        for (Long studentId : studentIds) {
            User student = userRepository.findById(studentId).orElse(null);
            if (student == null || student.getDivision() == null
                    || !Objects.equals(student.getDivision().getId(), divisionId)) {
                continue;
            }
            student.setDivision(null);
            userRepository.save(student);
            removed.add(student.getName());
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("removed", removed.size());
        result.put("students", removed);
        return result;
    }

    // --- division helpers ---

    private void applyDivisionFields(
            Division division, DivisionRequest request, Course course, String code) {

        String name = request.getName() == null ? "" : request.getName().trim();
        if (name.isEmpty()) {
            throw new RuntimeException("Division name is required");
        }

        division.setName(name);
        division.setCode(code);
        division.setCourse(course);
        division.setAcademicYear(request.getAcademicYear());
        division.setSemester(request.getSemester());
        division.setMaxCapacity(request.getMaxCapacity() == null || request.getMaxCapacity() < 1
                ? 60
                : request.getMaxCapacity());

        // Optional class teacher / faculty in-charge.
        if (request.getClassTeacherId() == null) {
            division.setClassTeacher(null);
        } else {
            User teacher = userRepository.findById(request.getClassTeacherId())
                    .orElseThrow(() -> new RuntimeException(
                            "Faculty not found with id " + request.getClassTeacherId()));
            if (teacher.getRole() == Role.STUDENT) {
                throw new RuntimeException("Class teacher must be a faculty member");
            }
            division.setClassTeacher(teacher);
        }
    }

    private String normalizeDivisionCode(String raw) {
        String code = raw == null ? "" : raw.trim();
        if (code.isEmpty()) {
            throw new RuntimeException("Division code is required");
        }
        if (code.length() > 8) {
            code = code.substring(0, 8);
        }
        return code;
    }

    /**
     * Division membership is course-scoped, so before a student can join a
     * division we make sure they are in that division's course:
     * <ul>
     *   <li>student already in this course -&gt; fine;</li>
     *   <li>student with <b>no course yet</b> -&gt; joins the division's course
     *       (same as registration does: set the course + create the enrollment),
     *       which is what makes them assignable at all;</li>
     *   <li>student in a <b>different</b> course -&gt; rejected.</li>
     * </ul>
     * The caller is responsible for saving the student afterwards.
     */
    private void ensureStudentInDivisionCourse(User student, Division division) {
        if (student.getRole() != Role.STUDENT) {
            throw new RuntimeException("Only students can be assigned to a division");
        }
        if (division.getCourse() == null) {
            throw new RuntimeException("This division is not attached to a course");
        }
        if (student.getCourse() == null) {
            student.setCourse(division.getCourse());

            if (!enrollmentRepository.existsByUserAndCourse(
                    student, division.getCourse())) {
                enrollmentRepository.save(
                        new Enrollment(student, division.getCourse())
                );
            }
            return;
        }
        if (!Objects.equals(
                student.getCourse().getId(), division.getCourse().getId())) {
            throw new RuntimeException("Student is not enrolled in this course");
        }
    }

    private void requireCapacity(Division division, User student) {
        boolean moving = student.getDivision() == null
                || !Objects.equals(student.getDivision().getId(), division.getId());
        if (!moving) {
            return;
        }
        long count = userRepository.countByDivisionId(division.getId());
        int capacity = division.getMaxCapacity() == null ? 60 : division.getMaxCapacity();
        if (count >= capacity) {
            throw new RuntimeException("Division is full (capacity " + capacity + ")");
        }
    }

    private DivisionResponse toDivisionView(Division division) {
        DivisionResponse view = new DivisionResponse();
        view.setId(division.getId());
        view.setName(division.getName());
        view.setCode(division.getCode());
        view.setAcademicYear(division.getAcademicYear());
        view.setSemester(division.getSemester());
        view.setMaxCapacity(division.getMaxCapacity());
        view.setCreatedAt(division.getCreatedAt());

        Course course = division.getCourse();
        if (course != null) {
            view.setCourseId(course.getId());
            view.setCourseName(course.getCourseName() != null ? course.getCourseName() : course.getTitle());
            view.setCourseCode(course.getCourseCode());
        }

        User teacher = division.getClassTeacher();
        if (teacher != null) {
            view.setClassTeacherId(teacher.getId());
            view.setClassTeacherName(teacher.getName());
        }

        view.setStudentCount(userRepository.countByDivisionId(division.getId()));
        return view;
    }

    // =========================
    // PRIVATE HELPERS
    // =========================

    private HODAssignmentView toView(InstructorCourseAssignment a) {
        HODAssignmentView v = new HODAssignmentView();
        v.setId(a.getId());
        v.setInstructorId(a.getInstructorId());
        v.setCourseId(a.getCourseId());
        v.setSubjectId(a.getSubjectId());
        v.setAssignedBy(a.getAssignedBy());
        v.setStatus(a.getStatus());
        v.setAssignedAt(a.getAssignedAt() == null
                ? null
                : DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss").format(a.getAssignedAt()));

        // Semester / academic year columns of the assignment table.
        v.setSemesterId(a.getSemesterId());
        v.setAcademicYearId(a.getAcademicYearId());
        v.setAcademicYear(yearName(a.getAcademicYearId()));

        if (a.getSemesterId() != null) {
            semesterRepository.findById(a.getSemesterId())
                    .ifPresent(s -> v.setSemesterNumber(s.getSemesterNumber()));
        }

        // Resolve the instructor user name.
        User instructor = courseRepository.findUserById(a.getInstructorId()).orElse(null);
        if (instructor != null) {
            v.setInstructorId(instructor.getId());
            v.setInstructorName(instructor.getName());
        }

        // Resolve the course name.
        Course course = courseRepository.findById(a.getCourseId()).orElse(null);
        if (course != null) {
            v.setCourseId(course.getId());
            v.setCourseName(course.getTitle());
            v.setCourseCode(course.getCourseCode());
            // Also grab the subject name if this points at a subject.
            if (a.getSubjectId() != null && a.getSubjectId() != 0L) {
                Subject subject = courseRepository.findSubjectById(a.getSubjectId()).orElse(null);
                if (subject != null) {
                    v.setSubjectId(subject.getId());
                    v.setSubjectName(subject.getSubjectName());

                    // Legacy rows have no semesterId: fall back to the
                    // semester the subject itself belongs to.
                    if (v.getSemesterNumber() == null) {
                        v.setSemesterNumber(subject.getSemester());
                    }
                }
            }
        }

        // The user who assigned this (usually the HOD / current admin).
        User assignedBy = courseRepository.findUserById(a.getAssignedBy()).orElse(null);
        if (assignedBy != null) {
            v.setAssignedByEmail(assignedBy.getEmail());
            v.setAssignedByRole(assignedBy.getRole() == null ? null : assignedBy.getRole().name());
        }

        return v;
    }
}
