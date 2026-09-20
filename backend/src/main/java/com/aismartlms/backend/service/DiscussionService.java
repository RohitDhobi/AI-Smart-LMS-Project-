package com.aismartlms.backend.service;

import com.aismartlms.backend.entity.Discussion;
import com.aismartlms.backend.entity.DiscussionReply;
import com.aismartlms.backend.entity.User;
import com.aismartlms.backend.entity.Course;
import com.aismartlms.backend.repository.DiscussionRepository;
import com.aismartlms.backend.repository.DiscussionReplyRepository;
import com.aismartlms.backend.repository.UserRepository;
import com.aismartlms.backend.repository.CourseRepository;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DiscussionService {

    private final DiscussionRepository discussionRepository;
    private final DiscussionReplyRepository replyRepository;
    private final UserRepository userRepository;
    private final CourseRepository courseRepository;

    public DiscussionService(
            DiscussionRepository discussionRepository,
            DiscussionReplyRepository replyRepository,
            UserRepository userRepository,
            CourseRepository courseRepository
    ) {
        this.discussionRepository = discussionRepository;
        this.replyRepository = replyRepository;
        this.userRepository = userRepository;
        this.courseRepository = courseRepository;
    }

    public List<Discussion> getAllDiscussions() {
        return discussionRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<Discussion> getDiscussionsByCourse(Long courseId) {
        return discussionRepository.findByCourseIdOrderByCreatedAtDesc(courseId);
    }

    public Discussion getDiscussionById(Long id) {
        return discussionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Discussion not found"));
    }

    public Discussion createDiscussion(String email, Discussion discussion) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        discussion.setAuthor(user);

        if (discussion.getCourse() != null && discussion.getCourse().getId() != null) {
            Course course = courseRepository.findById(discussion.getCourse().getId())
                    .orElseThrow(() -> new RuntimeException("Course not found"));
            discussion.setCourse(course);
        }

        return discussionRepository.save(discussion);
    }

    public DiscussionReply addReply(String email, Long discussionId, String content) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Discussion discussion = getDiscussionById(discussionId);

        DiscussionReply reply = new DiscussionReply();
        reply.setContent(content);
        reply.setAuthor(user);
        reply.setDiscussion(discussion);
        reply.setIsTeacherResponse(user.getRole().name().equals("INSTRUCTOR") || user.getRole().name().equals("ADMIN"));

        return replyRepository.save(reply);
    }

    public Discussion toggleSolved(Long discussionId) {
        Discussion discussion = getDiscussionById(discussionId);
        discussion.setSolved(!discussion.getSolved());
        return discussionRepository.save(discussion);
    }

    public Discussion toggleLike(Long discussionId) {
        Discussion discussion = getDiscussionById(discussionId);
        discussion.setLikes(discussion.getLikes() + 1);
        return discussionRepository.save(discussion);
    }

    public List<DiscussionReply> getReplies(Long discussionId) {
        return replyRepository.findByDiscussionIdOrderByCreatedAtAsc(discussionId);
    }
}
