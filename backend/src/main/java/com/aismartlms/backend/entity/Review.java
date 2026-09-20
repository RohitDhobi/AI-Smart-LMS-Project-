package com.aismartlms.backend.entity;
import javax.persistence.*;
import java.time.LocalDateTime;
@Entity @Table(name="reviews", uniqueConstraints=@UniqueConstraint(columnNames={"user_id","course_id"}))
public class Review {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="user_id",nullable=false) private User user;
 @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="course_id",nullable=false) private Course course;
 @Column(nullable=false) private Integer rating;
 @Column(columnDefinition="TEXT") private String comment;
 private LocalDateTime createdAt=LocalDateTime.now();
 public Long getId(){return id;} public User getUser(){return user;} public void setUser(User v){user=v;} public Course getCourse(){return course;} public void setCourse(Course v){course=v;} public Integer getRating(){return rating;} public void setRating(Integer v){rating=v;} public String getComment(){return comment;} public void setComment(String v){comment=v;} public LocalDateTime getCreatedAt(){return createdAt;} public void setCreatedAt(LocalDateTime v){createdAt=v;}
}