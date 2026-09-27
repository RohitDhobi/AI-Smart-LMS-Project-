package com.aismartlms.backend.service;

import com.aismartlms.backend.dto.HODAssignmentView;
import com.aismartlms.backend.dto.HODDashboardView;
import com.aismartlms.backend.dto.HODRequest;
import com.aismartlms.backend.dto.DivisionRequest;
import com.aismartlms.backend.dto.DivisionResponse;
import com.aismartlms.backend.entity.Announcement;
import com.aismartlms.backend.entity.Course;
import com.aismartlms.backend.entity.Division;
import com.aismartlms.backend.entity.InstructorCourseAssignment;
import com.aismartlms.backend.entity.Role;
import com.aismartlms.backend.entity.Subject;
import com.aismartlms.backend.entity.User;
import com.aismartlms.backend.repository.AnnouncementRepository;
import com.aismartlms.backend.repository.CourseRepository;
import com.aismartlms.backend.repository.DivisionRepository;
import com.aismartlms.backend.repository.ExamRepository;
import com.aismartlms.backend.repository.InstructorCourseAssignmentRepository;
import com.aismartlms.backend.repository.QuestionRepository;
import com.aismartlms.backend.repository.EnrollmentRepository;
import com.aismartlms.backend.repository.QuizRepository;
import com.aismartlms.backend.repository.SubjectRepository;
import com.aismartlms.backend.repository.UserRepository;
import com.aismartlms.backend.exception.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
            DivisionRepository divisionRepository) {

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

        // Prevent duplicates: same instructor + same course already active.
        Long targetCourseId = courseId;
        boolean exists = assignmentRepository
                .findByInstructorIdAndStatus(instructorId, "ACTIVE")
                .stream()
                .anyMatch(a -> Objects.equals(a.getCourseId(), targetCourseId));

        if (exists) {
            throw new RuntimeException("This instructor is already assigned to this course");
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

        return assignmentRepository.save(assignment);
    }

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

        if (request.getAssignedBy() != null) {
            assignment.setAssignedBy(request.getAssignedBy());
        }

        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            assignment.setStatus(request.getStatus().toUpperCase());
        }

        return assignmentRepository.save(assignment);
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
            item.put("courseName", courseName);

            // Instructor assigned to this subject by the HOD, if any.
            String assigned = null;
            Long assignedInstructorId = null;

            if (courseId != null) {

                List<InstructorCourseAssignment> rows =
                        assignmentRepository.findBySubjectIdAndStatus(subject.getId(), "ACTIVE");

                if (rows.isEmpty()) {
                    rows = assignmentRepository.findByCourseIdAndStatus(courseId, "ACTIVE");
                }

                if (!rows.isEmpty()) {
                    assignedInstructorId = rows.get(0).getInstructorId();
                    assigned = userRepository.findById(assignedInstructorId)
                            .map(User::getName)
                            .orElse(null);
                }
            }

            item.put("assignedInstructor", assigned);
            item.put("assignedInstructorId", assignedInstructorId);

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

        requireStudentInDivisionCourse(student, division);
        requireCapacity(division, student);

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

            boolean courseMatch = student.getCourse() != null
                    && division.getCourse() != null
                    && Objects.equals(student.getCourse().getId(), division.getCourse().getId());
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

    private void requireStudentInDivisionCourse(User student, Division division) {
        if (student.getRole() != Role.STUDENT) {
            throw new RuntimeException("Only students can be assigned to a division");
        }
        if (student.getCourse() == null || division.getCourse() == null
                || !Objects.equals(student.getCourse().getId(), division.getCourse().getId())) {
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
            // Also grab the subject name if this points at a subject.
            if (a.getSubjectId() != null && a.getSubjectId() != 0L) {
                Subject subject = courseRepository.findSubjectById(a.getSubjectId()).orElse(null);
                if (subject != null) {
                    v.setSubjectId(subject.getId());
                    v.setSubjectName(subject.getSubjectName());
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
