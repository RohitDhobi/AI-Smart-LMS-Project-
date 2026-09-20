package com.aismartlms.backend.service;

import com.aismartlms.backend.dto.AuthResponse;
import com.aismartlms.backend.dto.LoginRequest;
import com.aismartlms.backend.dto.RegisterRequest;
import com.aismartlms.backend.entity.Course;
import com.aismartlms.backend.entity.Enrollment;
import com.aismartlms.backend.entity.Role;
import com.aismartlms.backend.entity.User;
import com.aismartlms.backend.repository.CourseRepository;
import com.aismartlms.backend.repository.EnrollmentRepository;
import com.aismartlms.backend.repository.UserRepository;
import com.aismartlms.backend.security.JwtService;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
            UserRepository userRepository,
            CourseRepository courseRepository,
            EnrollmentRepository enrollmentRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService) {

        this.userRepository = userRepository;
        this.courseRepository = courseRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    // =========================
    // REGISTER
    // =========================

    @Transactional
    public AuthResponse register(RegisterRequest request) {

        // Check whether email already exists
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {

            return new AuthResponse(
                    "Email already registered",
                    null
            );
        }

        // Check password confirmation
        if (request.getConfirmPassword() != null
                && !request.getConfirmPassword().isBlank()
                && !request.getConfirmPassword().equals(request.getPassword())) {

            return new AuthResponse(
                    "Password and confirm password do not match",
                    null
            );
        }

        // Check that the selected course exists
        Course course = null;

        if (request.getCourseId() != null) {

            course = courseRepository
                    .findById(request.getCourseId())
                    .orElse(null);

            if (course == null) {

                return new AuthResponse(
                        "Course not found",
                        null
                );
            }
        }

        // Create new user
        User user = new User();

        user.setName(request.getName());
        user.setEmail(request.getEmail());

        // Encrypt password before saving
        user.setPassword(
                passwordEncoder.encode(request.getPassword())
        );

        // Role: allow if specified, else default to STUDENT
        user.setRole(
            request.getRole() != null
                ? request.getRole()
                : Role.STUDENT
        );
        user.setActive(true);

        // Student profile details
        user.setPhone(request.getPhone());
        user.setDateOfBirth(request.getDateOfBirth());
        user.setGender(request.getGender());
        user.setCourse(course);

        // Save user
        userRepository.save(user);

        // Auto-enroll the student in their degree course so the
        // existing enrollment / progress / certificate flows work
        if (course != null
                && !enrollmentRepository.existsByUserAndCourse(user, course)) {

            enrollmentRepository.save(
                    new Enrollment(user, course)
            );
        }

        // Generate JWT
        String token = jwtService.generateToken(user.getEmail());

        return new AuthResponse(
                "Registration successful",
                token,
                userInfo(user)
        );
    }

    // =========================
    // LOGIN
    // =========================

    public AuthResponse login(LoginRequest request) {

        // Find user by email
        User user = userRepository
                .findByEmail(request.getEmail())
                .orElse(null);

        // User not found
        if (user == null) {

            return new AuthResponse(
                    "Invalid email or password",
                    null
            );
        }

        if (!Boolean.TRUE.equals(user.getActive())) {
            return new AuthResponse("Account is inactive", null);
        }

        // Check password
        boolean passwordMatches =
                passwordEncoder.matches(
                        request.getPassword(),
                        user.getPassword()
                );

        // Wrong password
        if (!passwordMatches) {

            return new AuthResponse(
                    "Invalid email or password",
                    null
            );
        }

        // Generate JWT
        String token = jwtService.generateToken(user.getEmail());

        return new AuthResponse(
                "Login successful",
                token,
                userInfo(user)
        );
    }

    // =========================
    // USER INFO (never exposes the password)
    // =========================

    private Map<String, Object> userInfo(User user) {

        Map<String, Object> info = new LinkedHashMap<>();

        info.put("id", user.getId());
        info.put("name", user.getName());
        info.put("email", user.getEmail());
        info.put("role", user.getRole().name());
        info.put("phone", user.getPhone());
        info.put("gender", user.getGender());
        info.put("dateOfBirth", user.getDateOfBirth());

        if (user.getCourse() != null) {
            info.put("courseId", user.getCourse().getId());
            info.put("courseName", user.getCourse().getCourseName());
            info.put("courseCode", user.getCourse().getCourseCode());
        } else {
            info.put("courseId", null);
            info.put("courseName", null);
            info.put("courseCode", null);
        }

        return info;
    }
}
