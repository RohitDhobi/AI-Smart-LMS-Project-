package com.aismartlms.backend.repository;
import com.aismartlms.backend.entity.*; import org.springframework.data.jpa.repository.JpaRepository; import java.util.*;
public interface WishlistRepository extends JpaRepository<Wishlist,Long>{ List<Wishlist> findByUser(User user); Optional<Wishlist> findByUserAndCourse(User user,Course course); List<Wishlist> findByCourse(Course course); }
