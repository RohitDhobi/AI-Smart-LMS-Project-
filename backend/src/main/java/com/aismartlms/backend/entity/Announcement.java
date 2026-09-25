package com.aismartlms.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import javax.persistence.*;
import java.time.LocalDateTime;

/**
 * A broadcast announcement posted by an HOD (or admin) to everyone on the
 * platform. Reuses the existing auth/role system - {@code postedBy} holds the
 * id of the user who created it.
 */
@Entity
@Table(name = "announcements")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Announcement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String content;

    /** User id of the HOD/admin who posted it. */
    private Long postedBy;

    /** Free-form label shown next to the author (e.g. "HOD"). */
    private String postedByRole;

    private String courseCode;

    private LocalDateTime createdAt = LocalDateTime.now();

    public Announcement() {
    }

    public Announcement(String title, String content, Long postedBy) {
        this.title = title;
        this.content = content;
        this.postedBy = postedBy;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public Long getPostedBy() { return postedBy; }
    public void setPostedBy(Long postedBy) { this.postedBy = postedBy; }

    public String getPostedByRole() { return postedByRole; }
    public void setPostedByRole(String postedByRole) { this.postedByRole = postedByRole; }

    public String getCourseCode() { return courseCode; }
    public void setCourseCode(String courseCode) { this.courseCode = courseCode; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
