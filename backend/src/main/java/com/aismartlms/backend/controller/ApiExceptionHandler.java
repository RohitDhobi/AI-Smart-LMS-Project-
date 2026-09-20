package com.aismartlms.backend.controller;
import com.aismartlms.backend.exception.AccessDeniedException;
import org.springframework.http.*; import org.springframework.web.bind.annotation.*; import java.util.*;
@RestControllerAdvice
public class ApiExceptionHandler { @ExceptionHandler(RuntimeException.class) public ResponseEntity<Map<String,Object>> handle(RuntimeException e){return ResponseEntity.badRequest().body(Map.of("error",e.getMessage()==null?"Request failed":e.getMessage()));}
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String,Object>> handleAccessDenied(AccessDeniedException e){
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage() == null ? "Access denied" : e.getMessage()));
    }
 }
