package com.aismartlms.backend.repository;

import com.aismartlms.backend.entity.Discussion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
public interface DiscussionRepository extends JpaRepository<Discussion, Long> {
    List<Discussion> findByCourseIdOrderByCreatedAtDesc(Long courseId);
    List<Discussion> findAllByOrderByCreatedAtDesc();
    List<Discussion> findByTagOrderByCreatedAtDesc(String tag);
}
