package com.example.demo.controller;

import com.example.demo.ai.AiService;
import com.example.demo.dto.*;
import com.example.demo.model.User;
import org.springframework.web.bind.annotation.RequestBody;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AiController {

    private final AiService aiService;
    private final UserRepository userRepository;

    @PostMapping("/ask")
    public ResponseEntity<AiChatResponse> ask(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody AiChatRequest request) {
        User user = resolve(userDetails);
        return ResponseEntity.ok(aiService.ask(request.getMessage(), user.getEmail(), user.getRole()));
    }

    @GetMapping("/insights")
    public ResponseEntity<AiInsightsResponse> insights(
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = resolve(userDetails);
        return ResponseEntity.ok(aiService.getInsights(user.getEmail(), user.getRole()));
    }

    @PostMapping("/tasks/decompose")
    public ResponseEntity<AiChatResponse> decompose(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody TaskDecomposeRequest request) {
        User user = resolve(userDetails);
        return ResponseEntity.ok(
                aiService.decomposeTasks(request.getGoal(), request.getProjectId(), user.getEmail(), user.getRole()));
    }

    @GetMapping("/project/{id}/risk")
    public ResponseEntity<AiChatResponse> risk(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        User user = resolve(userDetails);
        return ResponseEntity.ok(aiService.analyzeRisk(id, user.getEmail(), user.getRole()));
    }

    @PostMapping("/project/simulate")
    public ResponseEntity<ProjectSimulationResponse> simulate(
            @RequestBody ProjectSimulationRequest request) {
        return ResponseEntity.ok(aiService.simulateProject(request));
    }

    private User resolve(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }
}
