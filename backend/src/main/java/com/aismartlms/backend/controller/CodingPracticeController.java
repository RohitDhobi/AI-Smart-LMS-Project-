package com.aismartlms.backend.controller;

import com.aismartlms.backend.entity.CodingProblem;
import com.aismartlms.backend.entity.CodingTestCase;
import com.aismartlms.backend.entity.User;
import com.aismartlms.backend.repository.UserRepository;
import com.aismartlms.backend.service.CodingPracticeService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/coding")
@CrossOrigin(origins = "*")
public class CodingPracticeController {

    private final CodingPracticeService codingPracticeService;
    private final UserRepository userRepository;

    public CodingPracticeController(
            CodingPracticeService codingPracticeService,
            UserRepository userRepository) {
        this.codingPracticeService = codingPracticeService;
        this.userRepository = userRepository;
    }

    private User getCurrentUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return null;
        }
        return userRepository.findByEmail(authentication.getName()).orElse(null);
    }

    // =========================================================
    // CATALOG & DETAILS
    // =========================================================

    @GetMapping("/problems")
    public ResponseEntity<?> getProblems(
            Authentication authentication,
            @RequestParam(required = false) String difficulty,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status) {
        User user = getCurrentUser(authentication);
        return ResponseEntity.ok(codingPracticeService.getProblems(user, difficulty, category, search, status));
    }

    @GetMapping("/problems/{id}")
    public ResponseEntity<?> getProblemDetail(
            @PathVariable Long id,
            Authentication authentication) {
        User user = getCurrentUser(authentication);
        return ResponseEntity.ok(codingPracticeService.getProblemDetail(id, user));
    }

    @GetMapping("/problems/slug/{slug}")
    public ResponseEntity<?> getProblemBySlug(
            @PathVariable String slug,
            Authentication authentication) {
        User user = getCurrentUser(authentication);
        return ResponseEntity.ok(codingPracticeService.getProblemBySlug(slug, user));
    }

    @GetMapping("/problems/daily")
    public ResponseEntity<?> getDailyChallenge(Authentication authentication) {
        User user = getCurrentUser(authentication);
        return ResponseEntity.ok(codingPracticeService.getDailyChallenge(user));
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getStats(Authentication authentication) {
        User user = getCurrentUser(authentication);
        return ResponseEntity.ok(codingPracticeService.getSummaryStats(user));
    }

    // =========================================================
    // TEST RUNNER & SUBMISSIONS
    // =========================================================

    @PostMapping("/run")
    public ResponseEntity<?> runCode(@RequestBody Map<String, Object> payload) {
        Long problemId = Long.valueOf(payload.get("problemId").toString());
        String language = payload.get("language") != null ? payload.get("language").toString() : "javascript";
        String code = payload.get("code") != null ? payload.get("code").toString() : "";
        String customInput = payload.get("customInput") != null ? payload.get("customInput").toString() : null;

        Map<String, Object> result = codingPracticeService.runCode(problemId, language, code, customInput);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/submit")
    public ResponseEntity<?> submitCode(
            Authentication authentication,
            @RequestBody Map<String, Object> payload) {
        User user = getCurrentUser(authentication);
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Authentication required to submit solutions."));
        }

        Long problemId = Long.valueOf(payload.get("problemId").toString());
        String language = payload.get("language") != null ? payload.get("language").toString() : "javascript";
        String code = payload.get("code") != null ? payload.get("code").toString() : "";

        Map<String, Object> result = codingPracticeService.submitCode(user, problemId, language, code);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/submissions")
    public ResponseEntity<?> getSubmissions(
            Authentication authentication,
            @RequestParam(required = false) Long problemId) {
        User user = getCurrentUser(authentication);
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Authentication required."));
        }

        return ResponseEntity.ok(codingPracticeService.getUserSubmissions(user, problemId));
    }

    @GetMapping("/submissions/problem/{id}")
    public ResponseEntity<?> getSubmissionsForProblem(
            @PathVariable Long id,
            Authentication authentication) {
        User user = getCurrentUser(authentication);
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Authentication required."));
        }

        return ResponseEntity.ok(codingPracticeService.getUserSubmissions(user, id));
    }

    // =========================================================
    // AI CODING ASSISTANT
    // =========================================================

    @PostMapping("/ai-assist")
    public ResponseEntity<?> getAiAssist(@RequestBody Map<String, Object> payload) {
        Long problemId = Long.valueOf(payload.get("problemId").toString());
        String language = payload.get("language") != null ? payload.get("language").toString() : "javascript";
        String code = payload.get("code") != null ? payload.get("code").toString() : "";
        String action = payload.get("action") != null ? payload.get("action").toString() : "hint";
        String userPrompt = payload.get("userPrompt") != null ? payload.get("userPrompt").toString() : "";

        Map<String, Object> result = codingPracticeService.getAiAssist(problemId, language, code, action, userPrompt);
        return ResponseEntity.ok(result);
    }

    // =========================================================
    // ADMIN / INSTRUCTOR PROBLEM MANAGEMENT
    // =========================================================

    public static class ProblemCreateRequest {
        public CodingProblem problem;
        public List<CodingTestCase> testCases;
    }

    @PostMapping("/admin/problems")
    public ResponseEntity<?> createProblem(
            Authentication authentication,
            @RequestBody ProblemCreateRequest request) {
        User user = getCurrentUser(authentication);
        if (user == null) {
            return ResponseEntity.status(401).body("Authentication required");
        }

        CodingProblem created = codingPracticeService.createProblem(request.problem, request.testCases);
        return ResponseEntity.ok(created);
    }

    @PutMapping("/admin/problems/{id}")
    public ResponseEntity<?> updateProblem(
            @PathVariable Long id,
            Authentication authentication,
            @RequestBody ProblemCreateRequest request) {
        User user = getCurrentUser(authentication);
        if (user == null) {
            return ResponseEntity.status(401).body("Authentication required");
        }

        CodingProblem updated = codingPracticeService.updateProblem(id, request.problem, request.testCases);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/admin/problems/{id}")
    public ResponseEntity<?> deleteProblem(
            @PathVariable Long id,
            Authentication authentication) {
        User user = getCurrentUser(authentication);
        if (user == null) {
            return ResponseEntity.status(401).body("Authentication required");
        }

        codingPracticeService.deleteProblem(id);
        return ResponseEntity.ok(Map.of("message", "Problem deleted successfully"));
    }
}
