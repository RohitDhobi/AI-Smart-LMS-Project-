package com.aismartlms.backend.repository;

import com.aismartlms.backend.entity.DiscussionReply;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
public interface DiscussionReplyRepository extends JpaRepository<DiscussionReply, Long> {
    List<DiscussionReply> findByDiscussionIdOrderByCreatedAtAsc(Long discussionId);
}
