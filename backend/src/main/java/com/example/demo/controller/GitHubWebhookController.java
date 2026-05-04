package com.example.demo.controller;

import com.example.demo.service.GitHubWebhookService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/github")
@RequiredArgsConstructor
@Slf4j
public class GitHubWebhookController {

    private final GitHubWebhookService gitHubWebhookService;

    @PostMapping("/webhook")
    public ResponseEntity<Void> webhook(
            @RequestHeader(value = "X-GitHub-Event", defaultValue = "ping") String event,
            @RequestHeader(value = "X-Hub-Signature-256", required = false) String signature,
            @RequestBody byte[] body) {

        if (!gitHubWebhookService.verifySignature(body, signature)) {
            log.warn("GitHub webhook rejected: invalid signature");
            return ResponseEntity.status(401).build();
        }

        if ("ping".equals(event)) {
            return ResponseEntity.ok().build();
        }

        gitHubWebhookService.handle(event, body);
        return ResponseEntity.ok().build();
    }
}
