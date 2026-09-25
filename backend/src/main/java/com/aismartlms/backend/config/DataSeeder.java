package com.aismartlms.backend.config;

import com.aismartlms.backend.entity.Course;
import com.aismartlms.backend.entity.InstructorCourseAssignment;
import com.aismartlms.backend.entity.Lesson;
import com.aismartlms.backend.entity.Role;
import com.aismartlms.backend.entity.Subject;
import com.aismartlms.backend.entity.User;
import com.aismartlms.backend.repository.CourseRepository;
import com.aismartlms.backend.repository.InstructorCourseAssignmentRepository;
import com.aismartlms.backend.repository.SubjectRepository;
import com.aismartlms.backend.repository.UserRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.List;
import java.util.Map;

/**
 * Seeds the degree programs (BCA, MBA, ...) with their semesters and
 * subjects on first startup. Idempotent: existing data is never touched.
 */
@Component
public class DataSeeder implements CommandLineRunner {

    private static final Logger log =
            LoggerFactory.getLogger(DataSeeder.class);

    private final CourseRepository courses;
    private final SubjectRepository subjects;
    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final InstructorCourseAssignmentRepository assignments;
    private final DataSource dataSource;

    @Value("${app.seed-data:true}")
    private boolean seedData;

    public DataSeeder(
            CourseRepository courses,
            SubjectRepository subjects,
            UserRepository users,
            PasswordEncoder passwordEncoder,
            InstructorCourseAssignmentRepository assignments,
            DataSource dataSource) {

        this.courses = courses;
        this.subjects = subjects;
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.assignments = assignments;
        this.dataSource = dataSource;
    }

    @Override
    @Transactional
    public void run(String... args) {

        if (!seedData) {
            return;
        }

        widenRoleColumnIfNeeded();

        seedCourses();

        seedAdmin();

        seedInstructors();

        seedHod();

        seedDefaultAssignments();
    }

    // =========================================================
    // SCHEMA GUARD
    // =========================================================

    /**
     * Legacy databases created users.role as a MySQL ENUM that predates the HOD
     * role. ddl-auto=update never changes an existing column type, so inserting
     * Role.HOD would fail with "Data truncated". Widen the column to VARCHAR once.
     * Idempotent: only alters when the column is still an ENUM.
     */
    private void widenRoleColumnIfNeeded() {
        try (Connection conn = dataSource.getConnection()) {
            boolean isEnum = false;
            try (PreparedStatement ps = conn.prepareStatement(
                    "SELECT DATA_TYPE FROM information_schema.COLUMNS "
                            + "WHERE TABLE_SCHEMA = DATABASE() "
                            + "AND TABLE_NAME = 'users' AND COLUMN_NAME = 'role'")) {
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) {
                        isEnum = "enum".equalsIgnoreCase(rs.getString(1));
                    }
                }
            }

            if (isEnum) {
                try (Statement st = conn.createStatement()) {
                    st.executeUpdate("ALTER TABLE users MODIFY COLUMN role VARCHAR(255) NOT NULL");
                }
                log.info("Widened users.role from ENUM to VARCHAR(255) so the HOD role can be stored");
            }
        } catch (Exception e) {
            // Non-fatal here: if the column still rejects HOD, seedHod() will report it.
            log.warn("Could not widen users.role column: {}", e.getMessage());
        }
    }

    // =========================================================
    // COURSES + SUBJECTS + LESSONS
    // =========================================================

    private void seedCourses() {

        // courseCode -> (courseName, duration, totalSemesters)
        Map<String, String[]> programs = Map.ofEntries(
                Map.entry("BCA", new String[]{
                        "Bachelor of Computer Applications", "3 Years", "6"}),
                Map.entry("MCA", new String[]{
                        "Master of Computer Applications", "2 Years", "4"}),
                Map.entry("BBA", new String[]{
                        "Bachelor of Business Administration", "3 Years", "6"}),
                Map.entry("MBA", new String[]{
                        "Master of Business Administration", "2 Years", "4"}),
                Map.entry("B.Com", new String[]{
                        "Bachelor of Commerce", "3 Years", "6"}),
                Map.entry("M.Com", new String[]{
                        "Master of Commerce", "2 Years", "4"}),
                Map.entry("BA", new String[]{
                        "Bachelor of Arts", "3 Years", "6"}),
                Map.entry("MA", new String[]{
                        "Master of Arts", "2 Years", "4"}),
                Map.entry("B.Sc", new String[]{
                        "Bachelor of Science", "3 Years", "6"}),
                Map.entry("M.Sc", new String[]{
                        "Master of Science", "2 Years", "4"})
        );

        int createdCourses = 0;
        int createdSubjects = 0;

        for (Map.Entry<String, String[]> entry : programs.entrySet()) {

            String code = entry.getKey();
            String name = entry.getValue()[0];
            String duration = entry.getValue()[1];
            int totalSemesters = Integer.parseInt(entry.getValue()[2]);

            Course course =
                    courses.findByCourseCodeIgnoreCase(code)
                            .orElse(null);

            if (course == null) {

                course = new Course();

                course.setCourseCode(code);
                course.setCourseName(name);
                course.setTitle(name);
                course.setDescription(
                        "Degree program: " + name + " (" + code + ")"
                );
                course.setInstructor("AI Smart LMS");
                course.setCategory("Degree Program");
                course.setStatus("APPROVED");
                course.setDifficulty("BEGINNER");
                course.setPrice(0.0);
                course.setDuration(duration);
                course.setTotalSemesters(totalSemesters);

                course = courses.save(course);

                createdCourses++;
            }

            // Seed the subjects defined for this program
            List<int[]> semesterSubjects = SUBJECTS.get(code);

            if (semesterSubjects == null) {
                continue;
            }

            for (int[] semesterRow : semesterSubjects) {

                int semester = semesterRow[0];

                for (int i = 1; i < semesterRow.length; i++) {

                    String subjectName =
                            SUBJECT_NAMES.get(semesterRow[i]);

                    if (subjectName == null) {
                        continue;
                    }

                    Subject existing =
                            subjects
                                    .findByCourseIdAndSemesterAndSubjectNameIgnoreCase(
                                            course.getId(),
                                            semester,
                                            subjectName
                                    )
                                    .orElse(null);

                    if (existing != null) {
                        continue;
                    }

                    Subject subject = new Subject();

                    subject.setCourse(course);
                    subject.setSemester(semester);
                    subject.setSubjectCode(
                            code + "-" + semester + "-" + i
                    );
                    subject.setSubjectName(subjectName);
                    subject.setDescription(
                            subjectName + " - " + semester +
                                    " semester of " + code
                    );

                    subjects.save(subject);

                    createdSubjects++;

                    seedLessons(subject);
                }
            }
        }

        if (createdCourses > 0 || createdSubjects > 0) {

            log.info(
                    "DataSeeder: ensured {} programs, {} subjects",
                    createdCourses,
                    createdSubjects
            );
        }
    }

    private void seedLessons(Subject subject) {

        String name = subject.getSubjectName();

        // 10 structured lessons per subject
        String[][] lessons = {
                {
                    "Introduction to " + name,
                    "Overview and fundamentals of " + name + ".",
                    "Welcome to \"" + name + "\".\n\n" +
                    "In this introductory lesson, you will learn about the \n" +
                    "history, importance, and core objectives of " + name + ".\n\n" +
                    "Key Topics:\n" +
                    "• What is " + name + "?\n" +
                    "• Why it matters in the modern world\n" +
                    "• Career opportunities\n" +
                    "• Course structure and learning outcomes\n\n" +
                    "Take your time to understand the basics before moving on.",
                    "25"
                },
                {
                    "Fundamentals of " + name,
                    "Master the building blocks of " + name + ".",
                    "This lesson covers the fundamental concepts that form \n" +
                    "the backbone of " + name + ".\n\n" +
                    "Key Topics:\n" +
                    "• Basic terminology and definitions\n" +
                    "• Core principles and theories\n" +
                    "• Foundational models and frameworks\n" +
                    "• Real-world examples and analogies\n\n" +
                    "Exercise: Write down 5 key takeaways from this lesson.",
                    "30"
                },
                {
                    "Key Concepts and Theory – " + name,
                    "Deep dive into important theoretical concepts.",
                    "Building on the fundamentals, this lesson explores the \n" +
                    "key theoretical concepts of " + name + ".\n\n" +
                    "Key Topics:\n" +
                    "• Theoretical frameworks\n" +
                    "• Important models and paradigms\n" +
                    "• Relationships between concepts\n" +
                    "• Historical development of key ideas\n\n" +
                    "Tip: Create concept maps to visualize relationships.",
                    "35"
                },
                {
                    "Practical Applications of " + name,
                    "See how " + name + " is applied in real scenarios.",
                    "Theory meets practice in this hands-on lesson.\n\n" +
                    "Key Topics:\n" +
                    "• Real-world case studies\n" +
                    "• Industry applications\n" +
                    "• Step-by-step walkthroughs\n" +
                    "• Best practices and common pitfalls\n\n" +
                    "Activity: Analyze a real-world scenario using what you learned.",
                    "40"
                },
                {
                    "Advanced Topics in " + name,
                    "Explore more complex and advanced areas.",
                    "Ready to level up? This lesson covers advanced topics \n" +
                    "that will deepen your expertise in " + name + ".\n\n" +
                    "Key Topics:\n" +
                    "• Advanced techniques and methodologies\n" +
                    "• Current research and trends\n" +
                    "• Cutting-edge developments\n" +
                    "• Expert-level strategies\n\n" +
                    "Challenge: Try the advanced exercises at the end.",
                    "40"
                },
                {
                    "Tools and Technologies for " + name,
                    "Learn about the tools used in " + name + ".",
                    "Every field has its tools. This lesson covers the \n" +
                    "essential tools and technologies for " + name + ".\n\n" +
                    "Key Topics:\n" +
                    "• Essential software and platforms\n" +
                    "• Development environments\n" +
                    "• Useful libraries and frameworks\n" +
                    "• Setting up your workspace\n\n" +
                    "Hands-on: Set up your development environment.",
                    "35"
                },
                {
                    "Problem Solving in " + name,
                    "Develop your problem-solving skills.",
                    "Learn systematic approaches to solving problems \n" +
                    "related to " + name + ".\n\n" +
                    "Key Topics:\n" +
                    "• Problem-solving methodology\n" +
                    "• Analytical thinking techniques\n" +
                    "• Debugging and troubleshooting\n" +
                    "• Practice problems and solutions\n\n" +
                    "Practice: Solve the 3 problems at the end of this lesson.",
                    "35"
                },
                {
                    "Project Work in " + name,
                    "Apply your knowledge through a mini project.",
                    "Put everything you have learned into practice with \n" +
                    "a guided project in " + name + ".\n\n" +
                    "Key Topics:\n" +
                    "• Project requirements and planning\n" +
                    "• Implementation steps\n" +
                    "• Testing and validation\n" +
                    "• Presentation of results\n\n" +
                    "Deliverable: Complete the project and submit your work.",
                    "60"
                },
                {
                    "Industry Case Studies – " + name,
                    "Learn from real industry examples.",
                    "Explore how professionals use " + name + " in the \n" +
                    "real world through detailed case studies.\n\n" +
                    "Key Topics:\n" +
                    "• Case Study 1: Industry application\n" +
                    "• Case Study 2: Innovation and disruption\n" +
                    "• Lessons learned from failures\n" +
                    "• Future outlook and emerging trends\n\n" +
                    "Discussion: Which case study resonates most with you?",
                    "30"
                },
                {
                    "Review and Exam Preparation – " + name,
                    "Comprehensive revision and test preparation.",
                    "Let us consolidate everything you have learned about \n" +
                    "" + name + " before the assessment.\n\n" +
                    "Key Topics:\n" +
                    "• Summary of all lessons\n" +
                    "• Key formulas and definitions to memorize\n" +
                    "• Common exam patterns and question types\n" +
                    "• Practice test with answers\n\n" +
                    "Tip: Review all previous lessons and attempt the practice test.",
                    "45"
                }
        };

        for (int i = 0; i < lessons.length; i++) {

            String[] l = lessons[i];

            Lesson lesson = new Lesson();
            lesson.setCourse(subject.getCourse());
            lesson.setSubject(subject);
            lesson.setTitle(l[0]);
            lesson.setDescription(l[1]);
            lesson.setContent(l[2]);
            lesson.setLessonOrder(i + 1);
            lesson.setDurationMinutes(Integer.parseInt(l[3]));

            subject.addLesson(lesson);
        }

        subjects.save(subject);
    }

    // =========================================================
    // DEFAULT ADMIN
    // =========================================================

    private void seedAdmin() {

        // Ensure the documented default admin account exists.
        // Existing accounts are never modified.
        if (users.findByEmail("admin@example.com").isPresent()) {
            return;
        }

        User admin = new User();

        admin.setName("System Admin");
        admin.setEmail("admin@example.com");
        admin.setPassword(
                passwordEncoder.encode("admin123")
        );
        admin.setRole(Role.ADMIN);
        admin.setActive(true);

        users.save(admin);

        log.info(
                "DataSeeder: created default admin account " +
                        "(admin@example.com / admin123)"
        );
    }

    // =========================================================
    // DEFAULT INSTRUCTORS (TEACHERS)
    // =========================================================

    private void seedInstructors() {

        String[][] instructors = {
                {"Dr. Priya Sharma",     "priya.teacher@example.com",   "teacher123", "BCA"},
                {"Prof. Rajesh Kumar",    "rajesh.teacher@example.com",  "teacher123", "MCA"},
                {"Dr. Anita Verma",       "anita.teacher@example.com",   "teacher123", "BBA"},
                {"Prof. Suresh Patel",    "suresh.teacher@example.com",  "teacher123", "MBA"},
                {"Dr. Neha Gupta",        "neha.teacher@example.com",    "teacher123", "B.Com"},
                {"Prof. Amit Singh",      "amit.teacher@example.com",    "teacher123", "M.Com"},
                {"Dr. Kavita Reddy",      "kavita.teacher@example.com",  "teacher123", "BA"},
                {"Prof. Deepak Joshi",    "deepak.teacher@example.com",  "teacher123", "MA"},
                {"Dr. Sanjay Mehta",      "sanjay.teacher@example.com",  "teacher123", "B.Sc"},
                {"Prof. Ritu Agarwal",    "ritu.teacher@example.com",    "teacher123", "M.Sc"}
        };

        int created = 0;

        for (String[] row : instructors) {

            String name    = row[0];
            String email   = row[1];
            String pass    = row[2];

            if (users.findByEmail(email).isPresent()) {
                continue;
            }

            User teacher = new User();

            teacher.setName(name);
            teacher.setEmail(email);
            teacher.setPassword(passwordEncoder.encode(pass));
            teacher.setRole(Role.INSTRUCTOR);
            teacher.setActive(true);

            users.save(teacher);

            created++;

            log.info(
                    "DataSeeder: created instructor {} ({})",
                    name, email
            );
        }

        if (created > 0) {
            log.info(
                    "DataSeeder: created {} default instructor accounts",
                    created
            );
        }
    }

    // =========================================================
    // DEFAULT HOD (HEAD OF DEPARTMENT)
    // =========================================================

    private void seedHod() {

        if (users.findByEmail("hod@example.com").isPresent()) {
            return;
        }

        User hod = new User();

        hod.setName("Head of Department");
        hod.setEmail("hod@example.com");
        hod.setPassword(passwordEncoder.encode("hod123"));
        hod.setRole(Role.HOD);
        hod.setActive(true);

        users.save(hod);

        log.info(
                "DataSeeder: created default HOD account " +
                        "(hod@example.com / hod123)"
        );
    }

    // =========================================================
    // DEFAULT INSTRUCTOR -> COURSE ASSIGNMENTS
    //
    // Backend 403 enforcement means an instructor may only manage a course
    // that an HOD has assigned to them. Seeding a starting set keeps the
    // existing instructor features working out of the box, while courses
    // left unassigned correctly return HTTP 403.
    // =========================================================

    private void seedDefaultAssignments() {

        if (assignments.count() > 0) {
            return; // already seeded, never overwrite HOD decisions
        }

        List<Course> allCourses = courses.findAll();

        if (allCourses.isEmpty()) {
            return;
        }

        List<User> instructors = users.findAll().stream()
                .filter(u -> u.getRole() == Role.INSTRUCTOR)
                .toList();

        if (instructors.isEmpty()) {
            return;
        }

        // Round-robin the course list across the instructor pool so that
        // every instructor owns at least one course (existing instructor
        // features keep working) and every course is covered.
        int created = 0;

        for (int i = 0; i < instructors.size(); i++) {

            User instructor = instructors.get(i);
            Course course = allCourses.get(i % allCourses.size());

            assignments.save(new InstructorCourseAssignment(
                    instructor.getId(),
                    course.getId(),
                    null,
                    null
            ));

            created++;
        }

        // When there are more courses than instructors, hand the remaining
        // courses to instructors in rotation as well.
        for (int i = instructors.size(); i < allCourses.size(); i++) {

            Course course = allCourses.get(i);
            User instructor = instructors.get(i % instructors.size());

            assignments.save(new InstructorCourseAssignment(
                    instructor.getId(),
                    course.getId(),
                    null,
                    null
            ));

            created++;
        }

        if (created > 0) {
            log.info(
                    "DataSeeder: seeded {} default instructor-course assignments",
                    created
            );
        }
    }

    // =========================================================
    // SUBJECT DEFINITIONS
    // Each row: { semester, nameIndex1, nameIndex2, ... }
    // =========================================================

    private static final Map<Integer, String> SUBJECT_NAMES = Map.ofEntries(
            Map.entry(1, "Programming in C"),
            Map.entry(2, "Computer Fundamentals"),
            Map.entry(3, "Mathematics"),
            Map.entry(4, "Digital Electronics"),
            Map.entry(5, "Communication Skills"),
            Map.entry(6, "Data Structures"),
            Map.entry(7, "Object-Oriented Programming"),
            Map.entry(8, "Database Management System"),
            Map.entry(9, "Computer Organization"),
            Map.entry(10, "Operating Systems"),
            Map.entry(11, "Java Programming"),
            Map.entry(12, "Web Development"),
            Map.entry(13, "Computer Networks"),
            Map.entry(14, "Software Engineering"),
            Map.entry(15, "Probability and Statistics"),
            Map.entry(16, "Python Programming"),
            Map.entry(17, "Advanced Database Management"),
            Map.entry(18, "Operating System Concepts"),
            Map.entry(19, "Web Technologies"),
            Map.entry(20, "Software Testing"),
            Map.entry(21, "Artificial Intelligence"),
            Map.entry(22, "Machine Learning"),
            Map.entry(23, "Cloud Computing"),
            Map.entry(24, "Cyber Security"),
            Map.entry(25, "Project Management"),
            Map.entry(26, "Advanced Java"),
            Map.entry(27, "Data Analytics"),
            Map.entry(28, "Mobile Application Development"),
            Map.entry(29, "Project"),
            Map.entry(30, "Internship"),
            Map.entry(31, "Advanced Programming"),
            Map.entry(32, "Data Structures and Algorithms"),
            Map.entry(33, "Database Management Systems"),
            Map.entry(34, "Advanced Database Systems"),
            Map.entry(35, "Computer Architecture"),
            Map.entry(36, "Major Project"),
            Map.entry(37, "Seminar"),
            Map.entry(38, "Advanced Elective"),
            Map.entry(39, "Principles of Management"),
            Map.entry(40, "Business Economics"),
            Map.entry(41, "Financial Accounting"),
            Map.entry(42, "Business Communication"),
            Map.entry(43, "Business Mathematics"),
            Map.entry(44, "Marketing Management"),
            Map.entry(45, "Organizational Behaviour"),
            Map.entry(46, "Business Statistics"),
            Map.entry(47, "Human Resource Management"),
            Map.entry(48, "Business Environment"),
            Map.entry(49, "Financial Management"),
            Map.entry(50, "Operations Management"),
            Map.entry(51, "Consumer Behaviour"),
            Map.entry(52, "Business Law"),
            Map.entry(53, "Entrepreneurship"),
            Map.entry(54, "Strategic Management"),
            Map.entry(55, "Digital Marketing"),
            Map.entry(56, "Management Information Systems"),
            Map.entry(57, "Research Methodology"),
            Map.entry(58, "Cost Accounting"),
            Map.entry(59, "International Business"),
            Map.entry(60, "Investment Management"),
            Map.entry(61, "E-Commerce"),
            Map.entry(62, "Elective"),
            Map.entry(63, "Business Analytics"),
            Map.entry(64, "Entrepreneurship Development"),
            Map.entry(65, "Corporate Governance"),
            Map.entry(66, "Managerial Economics"),
            Map.entry(67, "Business Research Methods"),
            Map.entry(68, "Specialization Subject 1"),
            Map.entry(69, "Specialization Subject 2"),
            Map.entry(70, "Dissertation/Project"),
            Map.entry(71, "Corporate Accounting"),
            Map.entry(72, "Income Tax"),
            Map.entry(73, "Auditing"),
            Map.entry(74, "Company Law"),
            Map.entry(75, "Banking"),
            Map.entry(76, "Management Accounting"),
            Map.entry(77, "Indirect Taxation"),
            Map.entry(78, "Business Finance"),
            Map.entry(79, "Advanced Accounting"),
            Map.entry(80, "Taxation"),
            Map.entry(81, "Corporate Finance"),
            Map.entry(82, "Auditing & Assurance"),
            Map.entry(83, "Financial Analysis"),
            Map.entry(84, "Advanced Financial Accounting"),
            Map.entry(85, "Advanced Cost Accounting"),
            Map.entry(86, "Tax Management"),
            Map.entry(87, "Advanced Auditing"),
            Map.entry(88, "Dissertation")
    );

    private static final Map<String, List<int[]>> SUBJECTS = Map.ofEntries(
            Map.entry("BCA", List.of(
                    new int[]{1, 1, 2, 3, 4, 5},
                    new int[]{2, 6, 7, 8, 9, 10},
                    new int[]{3, 11, 12, 13, 14, 15},
                    new int[]{4, 16, 17, 18, 19, 20},
                    new int[]{5, 21, 22, 23, 24, 25},
                    new int[]{6, 26, 27, 28, 29, 30}
            )),
            Map.entry("MCA", List.of(
                    new int[]{1, 31, 32, 33, 13, 10},
                    new int[]{2, 7, 19, 14, 34, 35},
                    new int[]{3, 21, 22, 23, 24, 27},
                    new int[]{4, 36, 30, 37, 38}
            )),
            Map.entry("BBA", List.of(
                    new int[]{1, 39, 40, 41, 42, 43},
                    new int[]{2, 44, 45, 46, 47, 48},
                    new int[]{3, 49, 50, 51, 52, 53},
                    new int[]{4, 54, 55, 56, 57, 58},
                    new int[]{5, 59, 60, 61, 25, 62},
                    new int[]{6, 63, 64, 65, 36, 30}
            )),
            Map.entry("MBA", List.of(
                    new int[]{1, 39, 66, 41, 42, 45},
                    new int[]{2, 44, 47, 49, 50, 67},
                    new int[]{3, 54, 63, 53, 59, 68},
                    new int[]{4, 25, 65, 69, 70, 30}
            )),
            Map.entry("B.Com", List.of(
                    new int[]{1, 41, 40, 42, 43, 39},
                    new int[]{2, 71, 52, 58, 46, 44},
                    new int[]{3, 72, 49, 73, 74, 75},
                    new int[]{4, 76, 77, 78, 53, 61},
                    new int[]{5, 79, 60, 59, 80, 62},
                    new int[]{6, 81, 82, 83, 29, 30}
            )),
            Map.entry("M.Com", List.of(
                    new int[]{1, 84, 40, 57, 49, 45},
                    new int[]{2, 85, 86, 81, 44, 46},
                    new int[]{3, 60, 59, 54, 87, 62},
                    new int[]{4, 65, 83, 88, 29, 30}
            ))
    );
}
