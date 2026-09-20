package com.aismartlms.backend.repository;

import com.aismartlms.backend.entity.Resource;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ResourceRepository extends JpaRepository<Resource, Long> {

    List<Resource> findByCourseIdOrderByCreatedAtDesc(Long courseId);

    List<Resource> findByCourseIdAndTypeOrderByCreatedAtDesc(Long courseId, String type);

    List<Resource> findByCourseIdAndCategoryOrderByCreatedAtDesc(Long courseId, String category);

    List<Resource> findByCourseIdAndVisibilityOrderByCreatedAtDesc(Long courseId, String visibility);

    List<Resource> findByUploadedByOrderByCreatedAtDesc(String uploadedBy);

    long countByCourseId(Long courseId);
}
