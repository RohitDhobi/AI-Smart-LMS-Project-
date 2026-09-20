package com.aismartlms.backend.controller;

import com.aismartlms.backend.entity.Course;
import com.aismartlms.backend.repository.CourseRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Arrays;
import java.util.Collections;

import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class CourseSearchEndpointTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CourseRepository courseRepository;

    private Course course(Long id, String title) {
        Course course = new Course();
        course.setId(id);
        course.setTitle(title);
        course.setDescription("A test course");
        course.setInstructor("Rohit");
        course.setCategory("Programming");
        course.setDifficulty("BEGINNER");
        course.setPrice(0.0);
        return course;
    }

    @Test
    @WithMockUser
    void searchReturnsFilteredCourses() throws Exception {

        Course java = course(1L, "Java Programming");

        when(courseRepository
                .findByTitleContainingIgnoreCaseOrDescriptionContainingIgnoreCaseOrInstructorContainingIgnoreCaseOrCategoryContainingIgnoreCaseOrDifficultyContainingIgnoreCase(
                        "java", "java", "java", "java", "java"))
                .thenReturn(Arrays.asList(java));

        mockMvc.perform(get("/api/courses/search")
                        .param("keyword", "java"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].title").value("Java Programming"));

        verify(courseRepository)
                .findByTitleContainingIgnoreCaseOrDescriptionContainingIgnoreCaseOrInstructorContainingIgnoreCaseOrCategoryContainingIgnoreCaseOrDifficultyContainingIgnoreCase(
                        "java", "java", "java", "java", "java");
    }

    @Test
    @WithMockUser
    void searchMatchesInstructorField() throws Exception {

        Course spring = course(2L, "Spring Boot");

        when(courseRepository
                .findByTitleContainingIgnoreCaseOrDescriptionContainingIgnoreCaseOrInstructorContainingIgnoreCaseOrCategoryContainingIgnoreCaseOrDifficultyContainingIgnoreCase(
                        "rohit", "rohit", "rohit", "rohit", "rohit"))
                .thenReturn(Arrays.asList(spring));

        mockMvc.perform(get("/api/courses/search")
                        .param("keyword", "rohit"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].title").value("Spring Boot"));
    }

    @Test
    @WithMockUser
    void searchMatchesDifficultyField() throws Exception {

        Course advanced = course(3L, "Microservices");

        when(courseRepository
                .findByTitleContainingIgnoreCaseOrDescriptionContainingIgnoreCaseOrInstructorContainingIgnoreCaseOrCategoryContainingIgnoreCaseOrDifficultyContainingIgnoreCase(
                        "advanced", "advanced", "advanced", "advanced", "advanced"))
                .thenReturn(Arrays.asList(advanced));

        mockMvc.perform(get("/api/courses/search")
                        .param("keyword", "advanced"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].title").value("Microservices"));
    }

    @Test
    @WithMockUser
    void searchMatchesFreeCoursesByPrice() throws Exception {

        Course freeCourse = course(4L, "Web Basics");

        when(courseRepository
                .findByTitleContainingIgnoreCaseOrDescriptionContainingIgnoreCaseOrInstructorContainingIgnoreCaseOrCategoryContainingIgnoreCaseOrDifficultyContainingIgnoreCase(
                        "free", "free", "free", "free", "free"))
                .thenReturn(Collections.emptyList());

        when(courseRepository.findByPrice(0.0))
                .thenReturn(Arrays.asList(freeCourse));

        when(courseRepository.findByPriceIsNull())
                .thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/courses/search")
                        .param("keyword", "free"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].title").value("Web Basics"));

        verify(courseRepository).findByPrice(0.0);
        verify(courseRepository).findByPriceIsNull();
    }

    @Test
    @WithMockUser
    void searchReturnsEmptyWhenNoMatch() throws Exception {

        when(courseRepository
                .findByTitleContainingIgnoreCaseOrDescriptionContainingIgnoreCaseOrInstructorContainingIgnoreCaseOrCategoryContainingIgnoreCaseOrDifficultyContainingIgnoreCase(
                        "python", "python", "python", "python", "python"))
                .thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/courses/search")
                        .param("keyword", "python"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));

        verify(courseRepository, never()).findByPrice(anyDouble());
    }

    @Test
    @WithMockUser
    void blankKeywordReturnsAllCourses() throws Exception {

        Course any = course(5L, "Anything");

        when(courseRepository.findAll()).thenReturn(Arrays.asList(any));

        mockMvc.perform(get("/api/courses/search")
                        .param("keyword", "   "))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));

        verify(courseRepository, never())
                .findByTitleContainingIgnoreCaseOrDescriptionContainingIgnoreCaseOrInstructorContainingIgnoreCaseOrCategoryContainingIgnoreCaseOrDifficultyContainingIgnoreCase(
                        anyString(), anyString(), anyString(), anyString(), anyString());
    }
}
