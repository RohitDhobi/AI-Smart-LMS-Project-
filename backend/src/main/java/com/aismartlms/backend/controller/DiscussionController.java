package com.aismartlms.backend.controller;

import com.aismartlms.backend.entity.Discussion;
import com.aismartlms.backend.entity.DiscussionReply;
import com.aismartlms.backend.service.DiscussionService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/discussions")
@CrossOrigin(origins = "*")
public class DiscussionController {

    private final DiscussionService discussionService;

    public DiscussionController(DiscussionService discussionService) {
        this.discussionService = discussionService;
    }

    @GetMapping
    public ResponseEntity<List<Discussion>> getAllDiscussions() {
        return ResponseEntity.ok(discussionService.getAllDiscussions());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Discussion> getDiscussionById(@PathVariable Long id) {
        Discussion discussion = discussionService.getDiscussionById(id);
        return ResponseEntity.ok(discussion);
    }

    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<Discussion>> getDiscussionsByCourse(@PathVariable Long courseId) {
        return ResponseEntity.ok(discussionService.getDiscussionsByCourse(courseId));
    }

    @PostMapping
    public ResponseEntity<Discussion> createDiscussion(
            @RequestBody Discussion discussion,
            Authentication authentication) {
        return ResponseEntity.ok(discussionService.createDiscussion(authentication.getName(), discussion));
    }

    @PostMapping("/{id}/replies")
    public ResponseEntity<DiscussionReply> addReply(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            Authentication authentication) {
        return ResponseEntity.ok(discussionService.addReply(authentication.getName(), id, body.get("content")));
    }

    @PutMapping("/{id}/solve")
    public ResponseEntity<Discussion> toggleSolved(@PathVariable Long id) {
        return ResponseEntity.ok(discussionService.toggleSolved(id));
    }

    @PutMapping("/{id}/like")
    public ResponseEntity<Discussion> toggleLike(@PathVariable Long id) {
        return ResponseEntity.ok(discussionService.toggleLike(id));
    }

    @GetMapping("/{id}/replies")
    public ResponseEntity<List<DiscussionReply>> getReplies(@PathVariable Long id) {
        return ResponseEntity.ok(discussionService.getReplies(id));
    }
}
