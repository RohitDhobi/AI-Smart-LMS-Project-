package com.aismartlms.backend.service;

import com.aismartlms.backend.entity.Attendance;
import com.aismartlms.backend.entity.Course;
import com.aismartlms.backend.entity.User;
import com.aismartlms.backend.repository.AttendanceRepository;
import com.aismartlms.backend.repository.CourseRepository;
import com.aismartlms.backend.repository.UserRepository;

import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;

    public AttendanceService(
            AttendanceRepository attendanceRepository,
            CourseRepository courseRepository,
            UserRepository userRepository
    ) {
        this.attendanceRepository = attendanceRepository;
        this.courseRepository = courseRepository;
        this.userRepository = userRepository;
    }

    public Attendance markAttendance(Attendance attendance) {
        if (attendance.getCourse() != null && attendance.getCourse().getId() != null) {
            Course course = courseRepository.findById(attendance.getCourse().getId())
                    .orElseThrow(() -> new RuntimeException("Course not found"));
            attendance.setCourse(course);
        }
        if (attendance.getUser() != null && attendance.getUser().getId() != null) {
            User user = userRepository.findById(attendance.getUser().getId())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            attendance.setUser(user);
        }
        return attendanceRepository.save(attendance);
    }

    public List<Attendance> getMyAttendance(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return attendanceRepository.findByUserId(user.getId());
    }

    public List<Attendance> getAttendanceByCourse(Long courseId) {
        return attendanceRepository.findByCourseId(courseId);
    }

    public List<Attendance> getAttendanceByCourseAndDate(Long courseId, LocalDate date) {
        return attendanceRepository.findByCourseIdAndDate(courseId, date);
    }

    public List<Attendance> getAttendanceByCourseAndSubjectAndDate(Long courseId, String subject, LocalDate date) {
        return attendanceRepository.findByCourseIdAndSubjectAndDate(courseId, subject, date);
    }

    public List<Attendance> getMyAttendanceByCourse(String email, Long courseId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return attendanceRepository.findByUserIdAndCourseId(user.getId(), courseId);
    }
}
