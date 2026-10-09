package com.aismartlms.backend.security;

import com.aismartlms.backend.entity.User;
import com.aismartlms.backend.repository.UserRepository;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;

import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;

import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;

import org.springframework.security.config.http.SessionCreationPolicy;

import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import javax.servlet.http.HttpServletResponse;

import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final UserRepository userRepository;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(
            UserRepository userRepository,
            JwtAuthenticationFilter jwtAuthenticationFilter
    ) {
        this.userRepository = userRepository;
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    // =========================================================
    // PASSWORD ENCODER
    // =========================================================

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // =========================================================
    // USER DETAILS SERVICE
    // =========================================================

    @Bean
    public UserDetailsService userDetailsService() {

        return email -> {

            User user = userRepository
                    .findByEmail(email)
                    .orElseThrow(() ->
                            new UsernameNotFoundException(
                                    "User not found with email: " + email
                            )
                    );

            return org.springframework.security.core.userdetails.User
                    .withUsername(user.getEmail())
                    .password(user.getPassword())
                    .roles(user.getRole().name())
                    .build();
        };
    }

    // =========================================================
    // AUTHENTICATION PROVIDER
    // =========================================================

    @Bean
    public AuthenticationProvider authenticationProvider(
            UserDetailsService userDetailsService,
            PasswordEncoder passwordEncoder
    ) {

        DaoAuthenticationProvider provider =
                new DaoAuthenticationProvider();

        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder);

        return provider;
    }

    // =========================================================
    // AUTHENTICATION MANAGER
    // =========================================================

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration configuration
    ) throws Exception {

        return configuration.getAuthenticationManager();
    }

    // =========================================================
    // SECURITY FILTER CHAIN
    // =========================================================

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            AuthenticationProvider authenticationProvider
    ) throws Exception {

        http
                // CORS
                .cors().configurationSource(corsConfigurationSource())
                .and()

                // CSRF disabled because this is a REST API
                .csrf().disable()

                // No server-side sessions
                .sessionManagement()
                    .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                .and()

                // Authentication provider
                .authenticationProvider(authenticationProvider)

                // API permissions
                .authorizeRequests()

                    // Public authentication endpoints
                    .antMatchers(
                            "/api/auth/register",
                            "/api/auth/register/instructor",
                            "/api/auth/login"
                    ).permitAll()

                    // Public course catalog (needed on the
                    // registration page before login).
                    //
                    // Restricted to GET: antMatchers matches the path and
                    // ignores the method, so the bare pattern "/api/courses"
                    // used to also cover an anonymous POST / PUT / DELETE.
                    // Catalog reads must stay public; course mutations never
                    // are (see CourseController).
                    .antMatchers(
                            org.springframework.http.HttpMethod.GET,
                            "/api/courses",
                            "/api/courses/*/semesters",
                            "/api/courses/*/subjects",
                            "/api/courses/*/subjects/*"
                    ).permitAll()

                    // Actuator
                    .antMatchers(
                            "/actuator/**"
                    ).permitAll()

                    // Everything else requires JWT
                    .anyRequest().authenticated()
                .and()

                // Anonymous / over-privileged requests must be reported as
                // real HTTP errors with a JSON body. Without this,
                // Http403ForbiddenEntryPoint answered every unauthenticated
                // request with a bare 403 and no body, so the SPA could not
                // tell "your session expired" apart from a genuine
                // permission problem and showed "Access denied" forever.
                .exceptionHandling()
                    .authenticationEntryPoint(authenticationEntryPoint())
                    .accessDeniedHandler(accessDeniedHandler())
                .and()

                // JWT filter
                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }

    /** No/expired JWT -> 401 with a message the frontend can act on. */
    private AuthenticationEntryPoint authenticationEntryPoint() {
        return (request, response, authException) -> {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");
            response.getWriter().write(
                    "{\"error\":\"Unauthorized. Please login again.\"}");
        };
    }

    /** Authenticated but not allowed -> 403 with a message, never empty. */
    private AccessDeniedHandler accessDeniedHandler() {
        return (request, response, accessDeniedException) -> {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");
            response.getWriter().write(
                    "{\"error\":\"Access denied. You don't have permission.\"}");
        };
    }

    // =========================================================
    // CORS CONFIGURATION
    // =========================================================

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration =
                new CorsConfiguration();

        configuration.setAllowedOriginPatterns(
                Arrays.asList(
                        "http://localhost:*",
                        "http://127.0.0.1:*",
                        "*"
                )
        );

        configuration.setAllowedMethods(
                Arrays.asList(
                        "GET",
                        "POST",
                        "PUT",
                        "DELETE",
                        "PATCH",
                        "OPTIONS"
                )
        );

        configuration.setAllowedHeaders(
                Arrays.asList(
                        "Authorization",
                        "Content-Type",
                        "Accept"
                )
        );

        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration(
                "/**",
                configuration
        );

        return source;
    }
}
