package com.aismartlms.backend.service;

import com.aismartlms.backend.entity.Course;
import com.aismartlms.backend.entity.Resource;
import com.aismartlms.backend.repository.CourseRepository;
import com.aismartlms.backend.repository.ResourceRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ResourceService {

    private final ResourceRepository resourceRepository;
    private final CourseRepository courseRepository;

    public ResourceService(
            ResourceRepository resourceRepository,
            CourseRepository courseRepository) {
        this.resourceRepository = resourceRepository;
        this.courseRepository = courseRepository;
    }

    // CREATE RESOURCE
    public Resource createResource(Long courseId, Resource resource) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));

        resource.setCourse(course);
        resource.setCreatedAt(LocalDateTime.now());
        resource.setUpdatedAt(LocalDateTime.now());

        return resourceRepository.save(resource);
    }

    // GET ALL RESOURCES
    public List<Resource> getAllResources() {
        return resourceRepository.findAll();
    }

    // GET RESOURCE BY ID
    public Resource getResourceById(Long id) {
        return resourceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Resource not found"));
    }

    // GET RESOURCES BY COURSE
    public List<Resource> getResourcesByCourse(Long courseId) {
        return resourceRepository.findByCourseIdOrderByCreatedAtDesc(courseId);
    }

    // GET RESOURCES BY COURSE AND TYPE
    public List<Resource> getResourcesByCourseAndType(Long courseId, String type) {
        return resourceRepository.findByCourseIdAndTypeOrderByCreatedAtDesc(courseId, type);
    }

    // GET RESOURCES BY COURSE AND CATEGORY
    public List<Resource> getResourcesByCourseAndCategory(Long courseId, String category) {
        return resourceRepository.findByCourseIdAndCategoryOrderByCreatedAtDesc(courseId, category);
    }

    // UPDATE RESOURCE
    public Resource updateResource(Long id, Resource updatedResource) {
        Resource existing = getResourceById(id);

        existing.setTitle(updatedResource.getTitle());
        existing.setDescription(updatedResource.getDescription());
        existing.setType(updatedResource.getType());
        existing.setUrl(updatedResource.getUrl());
        existing.setCategory(updatedResource.getCategory());
        existing.setVisibility(updatedResource.getVisibility());
        existing.setUpdatedAt(LocalDateTime.now());

        return resourceRepository.save(existing);
    }

    // DELETE RESOURCE
    public void deleteResource(Long id) {
        if (!resourceRepository.existsById(id)) {
            throw new RuntimeException("Resource not found");
        }
        resourceRepository.deleteById(id);
    }

    // INCREMENT DOWNLOAD COUNT
    public Resource incrementDownload(Long id) {
        Resource resource = getResourceById(id);
        resource.setDownloadCount(resource.getDownloadCount() + 1);
        resource.setUpdatedAt(LocalDateTime.now());
        return resourceRepository.save(resource);
    }

    // GET RESOURCE COUNT BY COURSE
    public long countByCourse(Long courseId) {
        return resourceRepository.countByCourseId(courseId);
    }
}
