package com.example.demo.controller;

import com.example.demo.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Quick smoke-test endpoint – hit POST /api/test-email?to=you@example.com
 * Only active when NOT running with the "prod" profile.
 */
@RestController
@RequestMapping("/api/test-email")
@RequiredArgsConstructor
public class TestEmailController {

    private final EmailService emailService;

    @PostMapping
    public ResponseEntity<Map<String, String>> send(@RequestParam String to) {
        emailService.sendTaskAssignedEmail(
                to,
                "Test User",
                "Email connectivity test",
                "Nexus Dev",
                null);
        return ResponseEntity.ok(Map.of(
                "status", "queued",
                "message", "Email dispatched asynchronously to " + to + ". Check backend logs for result."));
    }
}
