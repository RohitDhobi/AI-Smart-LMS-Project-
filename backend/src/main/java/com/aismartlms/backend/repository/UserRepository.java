// package com.aismartlms.backend.repository;

// import com.aismartlms.backend.entity.User;
// import org.springframework.data.jpa.repository.JpaRepository;

// import java.util.Optional;

// public interface UserRepository extends JpaRepository<User, Long> {

//     Optional<User> findByEmail(String email);

//     boolean existsByEmail(String email);
// }
package com.aismartlms.backend.repository;

import com.aismartlms.backend.entity.Course;
import com.aismartlms.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    List<User> findByCourse(Course course);
}