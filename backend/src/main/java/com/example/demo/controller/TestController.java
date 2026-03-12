package com.example.demo.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class TestController {

    @GetMapping("/api/admin/test")
    public ResponseEntity<Map<String, String>> adminTest(Authentication authentication) {
        return ResponseEntity.ok(Map.of(
                "message", "Hello Admin! You have ADMIN access.",
                "user", authentication.getName(),
                "authorities", authentication.getAuthorities().toString()));
    }

    @GetMapping("/api/projects/test")
    public ResponseEntity<Map<String, String>> projectsTest(Authentication authentication) {
        return ResponseEntity.ok(Map.of(
                "message", "Hello! You have access to projects (ADMIN or MANAGER).",
                "user", authentication.getName(),
                "authorities", authentication.getAuthorities().toString()));
    }

    @GetMapping("/api/me")
    public ResponseEntity<Map<String, String>> me(Authentication authentication) {
        return ResponseEntity.ok(Map.of(
                "message", "You are authenticated.",
                "user", authentication.getName(),
                "authorities", authentication.getAuthorities().toString()));
    }
}
