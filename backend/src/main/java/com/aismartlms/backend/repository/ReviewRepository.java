package com.aismartlms.backend.repository;
import com.aismartlms.backend.entity.*; import org.springframework.data.jpa.repository.JpaRepository; import java.util.*;
public interface ReviewRepository extends JpaRepository<Review,Long>{ List<Review> findByCourseId(Long courseId); Optional<Review> findByUserAndCourse(User user,Course course); }
