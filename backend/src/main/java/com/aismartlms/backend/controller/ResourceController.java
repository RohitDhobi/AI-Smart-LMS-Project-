package com.aismartlms.backend.controller;

import com.aismartlms.backend.entity.Resource;
import com.aismartlms.backend.service.FileStorageService;
import com.aismartlms.backend.service.InstructorAccessService;
import com.aismartlms.backend.service.ResourceService;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/resources")
@CrossOrigin(origins = "*")
public class ResourceController {

    private final ResourceService resourceService;
    private final FileStorageService fileStorageService;
    private final InstructorAccessService access;

    public ResourceController(
            ResourceService resourceService,
            FileStorageService fileStorageService,
            InstructorAccessService access) {
        this.resourceService = resourceService;
        this.fileStorageService = fileStorageService;
        this.access = access;
    }

    // Uploading, editing or deleting course material is a management action:
    // only the instructor the HOD assigned to that course may do it (403).
    private void requireManageResource(Long id) {

        Resource resource = resourceService.getResourceById(id);

        if (resource.getCourse() != null
                && resource.getCourse().getId() != null) {
            access.requireCourseManage(resource.getCourse().getId());
        }
    }

    // CREATE RESOURCE
    @PostMapping("/course/{courseId}")
    public ResponseEntity<Resource> createResource(
            @PathVariable Long courseId,
            @RequestBody Resource resource) {
        access.requireCourseManage(courseId);
        return ResponseEntity.ok(resourceService.createResource(courseId, resource));
    }

    // GET ALL RESOURCES
    @GetMapping
    public ResponseEntity<List<Resource>> getAllResources() {
        return ResponseEntity.ok(resourceService.getAllResources());
    }

    // GET RESOURCE BY ID
    @GetMapping("/{id}")
    public ResponseEntity<Resource> getResourceById(@PathVariable Long id) {
        return ResponseEntity.ok(resourceService.getResourceById(id));
    }

    // GET RESOURCES BY COURSE
    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<Resource>> getResourcesByCourse(
            @PathVariable Long courseId) {
        return ResponseEntity.ok(resourceService.getResourcesByCourse(courseId));
    }

    // GET RESOURCES BY COURSE AND TYPE
    @GetMapping("/course/{courseId}/type/{type}")
    public ResponseEntity<List<Resource>> getResourcesByCourseAndType(
            @PathVariable Long courseId,
            @PathVariable String type) {
        return ResponseEntity.ok(resourceService.getResourcesByCourseAndType(courseId, type));
    }

    // GET RESOURCES BY COURSE AND CATEGORY
    @GetMapping("/course/{courseId}/category/{category}")
    public ResponseEntity<List<Resource>> getResourcesByCourseAndCategory(
            @PathVariable Long courseId,
            @PathVariable String category) {
        return ResponseEntity.ok(resourceService.getResourcesByCourseAndCategory(courseId, category));
    }

    // UPDATE RESOURCE
    @PutMapping("/{id}")
    public ResponseEntity<Resource> updateResource(
            @PathVariable Long id,
            @RequestBody Resource resource) {
        requireManageResource(id);
        return ResponseEntity.ok(resourceService.updateResource(id, resource));
    }

    // DELETE RESOURCE
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteResource(@PathVariable Long id) {
        requireManageResource(id);
        resourceService.deleteResource(id);
        return ResponseEntity.ok("Resource deleted successfully");
    }

    // UPLOAD FILE
    @PostMapping("/course/{courseId}/upload")
    public ResponseEntity<?> uploadFile(
            @PathVariable Long courseId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "title", required = false) String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "visibility", required = false) String visibility) {
        try {
            access.requireCourseManage(courseId);

            String filePath = fileStorageService.storeFile(file, courseId);

            // Determine type from extension
            String originalFilename = file.getOriginalFilename();
            String type = "OTHER";
            if (originalFilename != null) {
                String lower = originalFilename.toLowerCase();
                if (lower.endsWith(".pdf") || lower.endsWith(".doc") || lower.endsWith(".docx") || lower.endsWith(".txt")) {
                    type = "DOCUMENT";
                } else if (lower.endsWith(".mp4") || lower.endsWith(".avi") || lower.endsWith(".mov") || lower.endsWith(".mkv")) {
                    type = "VIDEO";
                } else if (lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".png") || lower.endsWith(".gif")) {
                    type = "IMAGE";
                }
            }

            Resource resource = new Resource();
            resource.setTitle(title != null ? title : originalFilename);
            resource.setDescription(description);
            resource.setType(type);
            resource.setFileName(originalFilename);
            resource.setFilePath(filePath);
            resource.setFileSize(file.getSize());
            resource.setCategory(category != null ? category : "LECTURE");
            resource.setVisibility(visibility != null ? visibility : "COURSE");
            resource.setUploadedBy("Instructor");

            Resource saved = resourceService.createResource(courseId, resource);
            return ResponseEntity.ok(saved);
        } catch (IOException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "File upload failed: " + e.getMessage()));
        }
    }

    // DOWNLOAD FILE
    @GetMapping("/{id}/download")
    public ResponseEntity<?> downloadFile(@PathVariable Long id) {
        try {
            Resource resource = resourceService.getResourceById(id);
            if (resource.getFilePath() == null) {
                // If it's a URL-based resource, redirect to the URL
                if (resource.getUrl() != null) {
                    return ResponseEntity.status(302).header("Location", resource.getUrl()).build();
                }
                return ResponseEntity.badRequest().body(Map.of("error", "No file available for download"));
            }

            Path filePath = fileStorageService.getFilePath(resource.getFilePath());
            org.springframework.core.io.Resource fileResource = new UrlResource(filePath.toUri());

            if (!fileResource.exists()) {
                return ResponseEntity.notFound().build();
            }

            String contentType = "application/octet-stream";
            if (resource.getFileName() != null) {
                String lower = resource.getFileName().toLowerCase();
                if (lower.endsWith(".pdf")) contentType = "application/pdf";
                else if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) contentType = "image/jpeg";
                else if (lower.endsWith(".png")) contentType = "image/png";
                else if (lower.endsWith(".mp4")) contentType = "video/mp4";
                else if (lower.endsWith(".txt")) contentType = "text/plain";
            }

            resourceService.incrementDownload(id);

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + resource.getFileName() + "\"")
                    .body(fileResource);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Download failed: " + e.getMessage()));
        }
    }

    // INCREMENT DOWNLOAD COUNT
    @PostMapping("/{id}/download")
    public ResponseEntity<Resource> incrementDownload(@PathVariable Long id) {
        return ResponseEntity.ok(resourceService.incrementDownload(id));
    }

    // GET RESOURCE COUNT BY COURSE
    @GetMapping("/course/{courseId}/count")
    public ResponseEntity<Map<String, Long>> getResourceCount(
            @PathVariable Long courseId) {
        return ResponseEntity.ok(Map.of(
                "count", resourceService.countByCourse(courseId)
        ));
    }
}
