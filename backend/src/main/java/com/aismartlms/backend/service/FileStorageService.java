package com.aismartlms.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Service
public class FileStorageService {

    private final Path uploadDir;

    public FileStorageService(
            @Value("${app.upload.dir:uploads/resources}") String uploadPath) {
        this.uploadDir = Paths.get(uploadPath).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.uploadDir);
        } catch (IOException e) {
            throw new RuntimeException("Could not create upload directory", e);
        }
    }

    /**
     * Store a file and return the relative path to be saved in the database.
     */
    public String storeFile(MultipartFile file, Long courseId) throws IOException {
        // Create course-specific subdirectory
        Path courseDir = uploadDir.resolve("course-" + courseId);
        Files.createDirectories(courseDir);

        // Generate unique filename
        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }

        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String uniqueName = UUID.randomUUID().toString().substring(0, 8);
        String filename = timestamp + "_" + uniqueName + extension;

        // Save file
        Path targetPath = courseDir.resolve(filename);
        Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

        // Return relative path for database storage
        return "course-" + courseId + "/" + filename;
    }

    /**
     * Get the full path to a stored file.
     */
    public Path getFilePath(String relativePath) {
        return uploadDir.resolve(relativePath).normalize();
    }

    /**
     * Delete a stored file.
     */
    public boolean deleteFile(String relativePath) {
        try {
            Path filePath = getFilePath(relativePath);
            return Files.deleteIfExists(filePath);
        } catch (IOException e) {
            return false;
        }
    }

    /**
     * Get the upload directory path.
     */
    public Path getUploadDir() {
        return uploadDir;
    }
}
