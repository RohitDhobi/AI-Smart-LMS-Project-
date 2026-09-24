package com.aismartlms.backend.controller;

import com.aismartlms.backend.dto.AuthResponse;
import com.aismartlms.backend.dto.LoginRequest;
import com.aismartlms.backend.dto.RegisterRequest;
import com.aismartlms.backend.service.AuthService;
import com.aismartlms.backend.security.JwtService;
import org.springframework.security.core.Authentication;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService authService;
    private final JwtService jwtService;

    public AuthController(AuthService authService, JwtService jwtService) {
        this.authService = authService;
        this.jwtService = jwtService;
    }

    // =========================
    // REGISTER
    // =========================

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(
            @RequestBody RegisterRequest request) {

        AuthResponse response = authService.register(request);

        // Registration failed
        if (response.getToken() == null) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(response);
        }

        // Registration successful
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    // =========================
    // REGISTER INSTRUCTOR (PENDING ADMIN APPROVAL)
    // =========================

    @PostMapping("/register/instructor")
    public ResponseEntity<AuthResponse> registerInstructor(
            @RequestBody RegisterRequest request) {

        AuthResponse response =
                authService.registerInstructor(request);

        boolean pending =
                AuthService.PENDING_APPROVAL.equals(response.getMessage());

        return ResponseEntity
                .status(pending ? HttpStatus.CREATED : HttpStatus.BAD_REQUEST)
                .body(response);
    }

    // =========================
    // LOGIN
    // =========================

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @RequestBody LoginRequest request) {

        AuthResponse response = authService.login(request);

        // Login failed
        if (response.getToken() == null) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(response);
        }

        // Login successful
        return ResponseEntity
                .ok(response);
    }
    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(Authentication authentication) {
        return ResponseEntity.ok(new AuthResponse("Token refreshed", jwtService.generateToken(authentication.getName())));
    }
}
