# Security Remediation Plan for AI-Smart-LMS

**Project**: AI-Smart-LMS-Level-1-to-9-Complete  
**Plan Name**: Security Remediation Plan  
**Language**: Java (Spring Boot Backend) + JavaScript (React Frontend)  
**Date Created**: September 1, 2026  
**Assessment Report**: `.github/modernize/assessment/reports/report-20260901172503/report.json`  

---

## Executive Summary

This document outlines a comprehensive security remediation strategy for the AI-Smart-LMS project, addressing 14 critical security categories identified in the Java AppCAT security assessment. The plan targets 14 CWE (Common Weakness Enumeration) vulnerabilities and 3 high-severity CVEs in project dependencies.

**Security Assessment Findings**:
- **Critical Issues (Mandatory)**: 4 issues
  - 3 CVE vulnerabilities in Spring Boot and MySQL dependencies
  - 1 CWE-434 (Unrestricted File Upload)
- **High Priority (Potential)**: 6 issues
  - Hard-coded cryptographic key and credentials
  - Insufficient security logging
  - Resource lifecycle management problems
  - Data access pattern violations
  - Numeric type conversion vulnerabilities
- **Medium Priority (Optional)**: 4 issues
  - Hard-coded passwords
  - Path traversal vulnerabilities (3 variants)
  - Cross-Site Scripting (XSS)

**Risk Impact**: These vulnerabilities violate OWASP Top 10 standards (A02:2021 Cryptographic Failures, A06:2021 Vulnerable Components, A03:2021 Injection). If unresolved, they enable:
- Unauthorized access and privilege escalation
- Data breach and credential theft
- Malicious file execution
- Brute force attacks
- Cross-site scripting attacks
- Path traversal attacks

---

## Remediation Strategy

### Phase 1: Critical Dependency Patching (Immediate)
**Priority**: MANDATORY  
**Duration**: 1-2 days  
**Tasks**:
- Task 001: Upgrade Spring Boot and MySQL dependencies to patched versions
  - Addresses: CVE-2026-22733, CVE-2026-40972, CVE-2023-22102
  - Validates: Full build pass, unit test suite passes

### Phase 2: File Upload Security (High Priority)
**Priority**: MANDATORY  
**Duration**: 3-4 days  
**Tasks**:
- Task 002: Implement file type whitelist and validation
  - Addresses: CWE-434 (Unrestricted File Upload)
  - Includes: MIME type validation, file size limits, secure storage

### Phase 3: Credential & Secrets Management (High Priority)
**Priority**: POTENTIAL  
**Duration**: 4-5 days  
**Tasks**:
- Task 003: Externalize hard-coded credentials
  - Addresses: CWE-259, CWE-321, CWE-798
  - Removes: Database passwords, JWT keys, default accounts
  - Implements: Environment-based configuration, secrets vault integration

### Phase 4: Path Security & Input Validation (High Priority)
**Priority**: POTENTIAL  
**Duration**: 3-4 days  
**Tasks**:
- Task 004: Path traversal prevention in file operations
  - Addresses: CWE-22, CWE-23, CWE-36
  - Implements: Strict path canonicalization, traversal detection
- Task 009: Numeric type conversion validation
  - Addresses: CWE-681
  - Implements: Range checking, bounds validation, type safety

### Phase 5: Frontend Security Hardening (Medium Priority)
**Priority**: OPTIONAL  
**Duration**: 2-3 days  
**Tasks**:
- Task 005: XSS prevention in AI response rendering
  - Addresses: CWE-79
  - Implements: HTML sanitization (DOMPurify), safe markdown parsing
- Task 007: Resource lifecycle management
  - Addresses: CWE-772, CWE-775
  - Implements: Proper cleanup of window handles and DOM elements

### Phase 6: Application Architecture Improvements (Medium Priority)
**Priority**: POTENTIAL  
**Duration**: 5-6 days  
**Tasks**:
- Task 006: Enhanced security logging
  - Addresses: CWE-778
  - Implements: Audit logging, brute force detection
- Task 008: Centralized data manager
  - Addresses: CWE-1057
  - Implements: Unified data access pattern, encryption

### Phase 7: Testing & Validation (All Phases)
**Priority**: HIGH  
**Duration**: Ongoing  
**Tasks**:
- Task 010: Comprehensive security testing suite
  - Implements: Security test automation, SAST integration
  - Validates: All 14 CWE categories covered

---

## Detailed Task Breakdown

### Task 001: Remediate Critical CVE Vulnerabilities (Mandatory)
**Issue ID**: CVE-2026-22733, CVE-2026-40972, CVE-2023-22102  
**Severity**: CRITICAL  
**Type**: Security Dependency Upgrade  

**Changes Required**:
1. **File**: `backend/pom.xml`
   - Upgrade `org.springframework.boot:spring-boot-starter-actuator` from 2.7.18 → 4.0.4
   - Upgrade `org.springframework.boot:spring-boot-devtools` from 2.7.18 → 4.0.6
   - Upgrade `mysql:mysql-connector-java` from 8.0.33 → `com.mysql:mysql-connector-j:8.2.0`

2. **Validation**:
   - Run `mvn clean install` - must pass
   - Run `mvn test` - all tests must pass
   - No breaking API changes in Spring Boot 4.0.x (minor migration needed)

**Success Criteria**:
- ✓ pom.xml dependencies updated to minimum patched versions
- ✓ Maven build succeeds without errors
- ✓ All unit tests pass
- ✓ No new dependency conflicts introduced

---

### Task 002: Restrict File Upload Types (Mandatory)
**Issue ID**: CWE-434  
**Severity**: CRITICAL  
**Type**: Input Validation & File Security  

**Changes Required**:
1. **File**: `backend/src/main/java/com/aismartlms/backend/service/FileStorageService.java`
   - Add whitelist of safe extensions: `.pdf, .doc, .docx, .xls, .xlsx, .ppt, .pptx, .jpg, .jpeg, .png, .gif, .mp4, .avi, .mov`
   - Blacklist dangerous types: `.exe, .sh, .bat, .jar, .dll, .com, .scr, .msi, .app, .bin`
   - Implement MIME type validation using Apache Tika
   - Store uploaded files with UUID-based names
   - Implement file size limits

2. **File**: `backend/src/main/java/com/aismartlms/backend/controller/ResourceController.java`
   - Add validation before file storage
   - Add logging for rejected uploads

**Success Criteria**:
- ✓ File type validation implemented and tested
- ✓ Dangerous files rejected with clear error messages
- ✓ MIME type validation prevents spoofing
- ✓ Unit tests for whitelist/blacklist scenarios
- ✓ Build passes, tests pass

---

### Task 003: Remove Hard-Coded Credentials (Mandatory)
**Issue ID**: CWE-259, CWE-321, CWE-798  
**Severity**: HIGH  
**Type**: Secrets Management  

**Changes Required**:
1. **File**: `backend/src/main/resources/application.properties`
   - Remove: `spring.datasource.password=Rocky.2004#`
   - Add: `spring.datasource.password=${DB_PASSWORD}`
   - Environment variable: `DB_PASSWORD=<random-secure-password>`

2. **File**: `backend/src/main/java/com/aismartlms/backend/security/JwtService.java`
   - Remove: `static final String SECRET_KEY = 'AI-Smart-LMS-Super-Secret-Key-2026-Change-This'`
   - Add: `@Value("${jwt.secret.key}") private String secretKey;`
   - Environment variable: `JWT_SECRET_KEY=<min-32-char-random-value>`

3. **File**: `backend/src/main/java/com/aismartlms/backend/config/DataSeeder.java`
   - Remove: Default admin account `admin@example.com/admin123`
   - Remove: Default instructor accounts with password `teacher123`
   - Add: Environment-based initialization

**Success Criteria**:
- ✓ No hard-coded credentials in source code
- ✓ All credentials externalized to environment variables
- ✓ Configuration tested with environment-based secrets
- ✓ Build passes, tests pass
- ✓ Documentation updated with credential setup instructions

---

### Task 004: Prevent Path Traversal Attacks (High Priority)
**Issue ID**: CWE-22, CWE-23, CWE-36  
**Severity**: HIGH  
**Type**: File System Security  

**Changes Required**:
1. **File**: `backend/src/main/java/com/aismartlms/backend/service/FileStorageService.java`
   - Implement strict path validation:
     ```java
     Path resolved = uploadDir.resolve(relativePath).normalize();
     if (!resolved.startsWith(uploadDir.toAbsolutePath())) {
         throw new SecurityException("Path traversal attempt detected");
     }
     if (Files.isSymbolicLink(resolved)) {
         throw new SecurityException("Symlink traversal not allowed");
     }
     ```
   - Reject paths with `..`, `./../../`, absolute paths, symlinks
   - Use canonical path comparison

**Success Criteria**:
- ✓ Path traversal attempts blocked (../../../etc/passwd, etc.)
- ✓ Absolute path attempts rejected (/etc/passwd)
- ✓ Symlink traversal prevented
- ✓ Comprehensive unit tests for attack scenarios
- ✓ Build passes, tests pass

---

### Task 005: Prevent Cross-Site Scripting (XSS) (Medium Priority)
**Issue ID**: CWE-79  
**Severity**: MEDIUM  
**Type**: Frontend Security  

**Changes Required**:
1. **File**: `src/pages/instructor/InstructorAITools.jsx`
   - Remove: `dangerouslySetInnerHTML` usage (lines 119-124)
   - Install: `npm install dompurify`
   - Add: `import DOMPurify from 'dompurify';`
   - Implement: Safe HTML rendering with sanitization
   - Convert markdown to React components instead of HTML

2. **Security Headers**:
   - Add CSP headers to prevent inline script execution
   - Configure: `Content-Security-Policy: script-src 'self'`

**Success Criteria**:
- ✓ dangerouslySetInnerHTML removed
- ✓ DOMPurify sanitization applied
- ✓ XSS payloads tested and blocked
- ✓ React components use safe rendering
- ✓ Build passes, tests pass

---

### Task 006: Enhance Security Logging (High Priority)
**Issue ID**: CWE-778  
**Severity**: HIGH  
**Type**: Audit Logging  

**Changes Required**:
1. **File**: `backend/src/main/java/com/aismartlms/backend/service/AuthService.java`
   - Add logging to `login()` method (lines 142-180):
     - Log successful attempts: user email, timestamp, IP address
     - Log failed attempts: reason (invalid email, wrong password, inactive)
     - Detect brute force patterns: N failed attempts in M minutes
     - Include request metadata: User-Agent, IP
   - Create separate audit log file
   - Use SLF4J with Logback

**Success Criteria**:
- ✓ All authentication events logged
- ✓ Audit log captures security-relevant events
- ✓ No passwords or sensitive data in logs
- ✓ Log retention policy set (90+ days)
- ✓ Brute force detection implemented
- ✓ Build passes, tests pass

---

### Task 007: Implement Resource Cleanup (High Priority)
**Issue ID**: CWE-772, CWE-775  
**Severity**: MEDIUM  
**Type**: Resource Management  

**Changes Required**:
1. **File**: `src/components/CertificateGenerator.jsx`
   - Line 154: Properly close window handle from `window.open()`
   - Lines 13, 145: Manage DOM element lifecycle
   - Implement useEffect cleanup:
     ```javascript
     useEffect(() => {
       // Create resources
       return () => {
         // Cleanup: close windows, remove DOM elements
       };
     }, []);
     ```
   - Use AbortController for fetch operations
   - Use useRef for DOM node management

**Success Criteria**:
- ✓ Window handles properly closed on unmount
- ✓ DOM elements cleaned up
- ✓ No memory leaks detected in DevTools Profiler
- ✓ React DevTools confirms proper cleanup
- ✓ Build passes, tests pass

---

### Task 008: Centralize Data Access Patterns (High Priority)
**Issue ID**: CWE-1057  
**Severity**: MEDIUM  
**Type**: Architecture Pattern  

**Changes Required**:
1. **Create**: `backend/src/main/java/com/aismartlms/backend/service/DataManager.java` (or equivalent)
   - Unified API: `getStoredData(key)`, `setStoredData(key, value)`, `removeStoredData(key)`
   - Implement data validation and sanitization
   - Add encryption for sensitive data (JWT tokens)
   - Add audit logging for data access

2. **Refactor** direct localStorage calls in:
   - `src/gamification.js` (lines 34-47)
   - `src/components/LearningHeatmap.jsx` (lines 7, 14)
   - `src/api.js` (line 12)
   - `src/flashcards.js` (line 17)
   - `src/components/student/StudentSidebar.jsx`
   - `src/components/admin/AdminSidebar.jsx`
   - `src/pages/admin/AdminRoles.jsx`

**Success Criteria**:
- ✓ Centralized DataManager component created
- ✓ All localStorage access through DataManager
- ✓ Data validation implemented
- ✓ Encryption for sensitive data
- ✓ Consistent data handling across components
- ✓ Unit tests for data access patterns
- ✓ Build passes, tests pass

---

### Task 009: Validate Numeric Type Conversions (High Priority)
**Issue ID**: CWE-681  
**Severity**: MEDIUM  
**Type**: Input Validation  

**Changes Required**:
1. **Create**: Helper function for safe numeric conversion
   - Validate numeric string format
   - Check range bounds (min/max values)
   - Handle overflow/underflow
   - Throw clear errors on invalid input

2. **File**: `src/api.js` (line 421)
   - Validate `count`: integer, 0-1000

3. **File**: `src/pages/admin/AdminSemesters.jsx` (line 106)
   - Validate `semester ID`: positive integer, < 2^31

4. **File**: `src/pages/instructor/InstructorCourseCreate.jsx` (line 91)
   - Validate `price`: 0-999999.99, two decimal places

5. **Server-side**: Duplicate validation in Java backend

**Success Criteria**:
- ✓ Safe numeric conversion function implemented
- ✓ All numeric inputs validated
- ✓ Range bounds enforced
- ✓ Edge cases tested (0, -1, max int, NaN, infinity)
- ✓ Unit tests cover all scenarios
- ✓ Build passes, tests pass

---

### Task 010: Security Testing & Validation (All Phases)
**Issue ID**: All CWE & CVE  
**Severity**: HIGH  
**Type**: Testing & CI/CD  

**Changes Required**:
1. **Create Security Test Suite**:
   - Path traversal scenario tests
   - File upload validation tests
   - Credential management tests
   - XSS payload tests
   - Brute force attack simulation
   - Resource cleanup verification
   - Data access pattern conformance

2. **Integrate SAST Tools**:
   - Configure SonarQube for continuous security scanning
   - Set up pre-commit hooks for security checks
   - Add security scanning to CI/CD pipeline

3. **Coverage Requirements**:
   - Minimum 90% code coverage for security-related code
   - All 14 CWE categories covered by tests
   - Automated regression testing for vulnerabilities

**Success Criteria**:
- ✓ Security test suite created and integrated
- ✓ All CWE scenarios covered by automated tests
- ✓ SAST tool (SonarQube) configured and reporting
- ✓ CI/CD pipeline includes security scanning
- ✓ Minimum 90% coverage for security code
- ✓ No new vulnerabilities introduced in builds

---

## Execution Roadmap

| Phase | Duration | Tasks | Priority |
|-------|----------|-------|----------|
| Phase 1: Critical Patching | 1-2 days | Task 001 | MANDATORY |
| Phase 2: File Upload Security | 3-4 days | Task 002 | MANDATORY |
| Phase 3: Secrets Management | 4-5 days | Task 003 | HIGH |
| Phase 4: Path & Input Security | 3-4 days | Task 004, 009 | HIGH |
| Phase 5: Frontend Security | 2-3 days | Task 005, 007 | MEDIUM |
| Phase 6: Architecture & Logging | 5-6 days | Task 006, 008 | MEDIUM |
| Phase 7: Testing & Validation | Ongoing | Task 010 | HIGH |
| **Total Estimated Timeline** | **3-4 weeks** | **10 tasks** | |

---

## Security Standards & Best Practices

This remediation plan aligns with:
- **OWASP Top 10 2021**: Addresses A02 (Cryptographic Failures), A03 (Injection), A06 (Vulnerable Components)
- **CWE Standards**: Remediation for 14 distinct CWE categories
- **CVE Database**: Patching for 3 high-severity CVEs
- **Azure Security Best Practices**: Secrets management, input validation, secure file handling
- **NIST Cybersecurity Framework**: Identity, Protect, Detect functions

---

## Success Criteria & Validation

**Build & Test Requirements** (All Tasks):
- ✓ Maven build passes: `mvn clean install` succeeds
- ✓ Unit tests pass: `mvn test` passes
- ✓ No new dependency conflicts introduced
- ✓ Zero security warnings from SAST tools

**Security Validation** (After All Tasks):
- ✓ All 14 CWE vulnerabilities addressed
- ✓ All 3 CVEs patched to minimum versions
- ✓ Security test suite passes completely
- ✓ No OWASP Top 10 violations remain
- ✓ Code review approval from security team

---

## Risk Mitigation

**Potential Risks & Mitigations**:
1. **Breaking Changes from Spring Boot 4.0.x Upgrade**
   - Mitigation: Comprehensive testing, reference migration guide
   - Impact: Medium | Probability: Medium

2. **File Upload Performance Impact**
   - Mitigation: Optimize MIME type detection, use async scanning
   - Impact: Low | Probability: Low

3. **Secrets Management Complexity**
   - Mitigation: Use AWS Secrets Manager or HashiCorp Vault
   - Impact: Low | Probability: Medium

4. **XSS Sanitization Over-blocking**
   - Mitigation: Test with DOMPurify default config, adjust as needed
   - Impact: Low | Probability: Low

---

## Dependencies & Prerequisites

- **Java Development Environment**: JDK 21 (already in use)
- **Build Tool**: Maven 3.8.9 or later
- **Frontend Dependencies**: React, Node.js runtime
- **Libraries**: 
  - Apache Tika (file type detection)
  - DOMPurify (XSS prevention)
  - SLF4J/Logback (logging)
  - Spring Cloud Config or HashiCorp Vault (secrets management)

---

## Timeline & Milestones

**Week 1** (Critical):
- Day 1-2: CVE patching (Task 001)
- Day 3-4: File upload security (Task 002)
- Day 5: Credentials externalization start (Task 003)

**Week 2**:
- Day 6-7: Credentials completion (Task 003)
- Day 8-10: Path traversal & numeric validation (Task 004, 009)

**Week 3**:
- Day 11-13: Frontend security (Task 005, 007)
- Day 14: Logging implementation (Task 006)

**Week 4**:
- Day 15-17: Centralized data manager (Task 008)
- Day 18-20: Security testing suite (Task 010)
- Day 21+: Ongoing validation & CI/CD integration

---

## Sign-Off & Approval

**Generated By**: Security Remediation Planning Coordinator  
**Date**: September 1, 2026  
**Status**: Ready for Execution  
**Next Step**: Execute tasks in sequence, starting with Task 001 (CVE Patching)

---

## Additional Resources

- Assessment Report: `.github/modernize/assessment/reports/report-20260901172503/report.json`
- Tasks Configuration: `.github/modernize/security-remediation/.metadata/tasks.json`
- OWASP Guidelines: https://owasp.org/Top10/
- CWE Database: https://cwe.mitre.org/
- CVE Details: https://github.com/advisories/

