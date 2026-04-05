package com.example.demo.controller;

import com.example.demo.dto.DashboardResponse;
import com.example.demo.dto.HealthScoreResponse;
import com.example.demo.service.HealthScoreService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final HealthScoreService healthScoreService;

    @GetMapping
    public ResponseEntity<DashboardResponse> getDashboard() {
        return ResponseEntity.ok(healthScoreService.getDashboard());
    }

    @GetMapping("/projects/{projectId}/health")
    public ResponseEntity<HealthScoreResponse> calculateProjectHealth(@PathVariable Long projectId) {
        return ResponseEntity.ok(healthScoreService.calculateProjectHealth(projectId));
    }
}
