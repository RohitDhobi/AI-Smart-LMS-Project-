package com.aismartlms.backend.repository;
import com.aismartlms.backend.entity.*; import org.springframework.data.jpa.repository.JpaRepository; import java.util.*;
public interface NotificationRepository extends JpaRepository<Notification,Long>{ List<Notification> findByUserOrderByCreatedAtDesc(User user); }
