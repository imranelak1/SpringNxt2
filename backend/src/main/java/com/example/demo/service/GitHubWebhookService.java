package com.example.demo.service;

import com.example.demo.model.Project;
import com.example.demo.repository.ProjectMemberRepository;
import com.example.demo.repository.ProjectRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class GitHubWebhookService {

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final NotificationService notificationService;
    private final ObjectMapper objectMapper;

    @Value("${app.github.webhook-secret:}")
    private String webhookSecret;

    public boolean verifySignature(byte[] body, String signatureHeader) {
        if (webhookSecret == null || webhookSecret.isBlank()) return true;
        if (signatureHeader == null || !signatureHeader.startsWith("sha256=")) return false;
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(webhookSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            String computed = "sha256=" + HexFormat.of().formatHex(mac.doFinal(body));
            return MessageDigest.isEqual(
                    computed.getBytes(StandardCharsets.UTF_8),
                    signatureHeader.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            log.warn("GitHub signature verification failed: {}", e.getMessage());
            return false;
        }
    }

    public void handle(String eventType, byte[] body) {
        try {
            String raw = new String(body, StandardCharsets.UTF_8);
            if (raw.startsWith("payload=")) {
                raw = java.net.URLDecoder.decode(raw.substring(8), StandardCharsets.UTF_8);
            }
            JsonNode payload = objectMapper.readTree(raw);
            switch (eventType) {
                case "push" -> handlePush(payload);
                case "pull_request" -> handlePullRequest(payload);
                default -> log.debug("Unhandled GitHub event: {}", eventType);
            }
        } catch (Exception e) {
            log.warn("Error processing GitHub webhook ({}): {}", eventType, e.getMessage());
        }
    }

    private void handlePush(JsonNode payload) {
        String ref = payload.path("ref").asText("");
        if (!ref.equals("refs/heads/main") && !ref.endsWith("/main")) return;

        String repoFullName = payload.path("repository").path("full_name").asText(null);
        String pusher = payload.path("pusher").path("name").asText("Someone");
        int commitCount = payload.path("commits").size();
        if (repoFullName == null || commitCount == 0) return;

        String lastMessage = payload.path("head_commit").path("message").asText("").lines().findFirst().orElse("");

        projectRepository.findByGithubRepo(repoFullName).ifPresent(project -> {
            String title = pusher + " pushed " + commitCount + " commit" + (commitCount > 1 ? "s" : "") + " to " + project.getName();
            String body = lastMessage.isBlank() ? "New code pushed to main branch." : "\"" + lastMessage + "\"";
            notifyMembers(project, "GITHUB_PUSH", title, body, "projets");
            log.info("GitHub push event processed for project: {}", project.getName());
        });
    }

    private void handlePullRequest(JsonNode payload) {
        String action = payload.path("action").asText("");
        if (!List.of("opened", "closed", "reopened").contains(action)) return;

        String repoFullName = payload.path("repository").path("full_name").asText(null);
        String prTitle = payload.path("pull_request").path("title").asText("Untitled PR");
        String sender = payload.path("sender").path("login").asText("Someone");
        boolean merged = payload.path("pull_request").path("merged").asBoolean(false);
        if (repoFullName == null) return;

        String label = merged ? "merged" : action;
        projectRepository.findByGithubRepo(repoFullName).ifPresent(project -> {
            String title = "PR " + label + ": " + prTitle;
            String body = sender + " " + label + " a pull request in " + project.getName() + ".";
            notifyMembers(project, "GITHUB_PR", title, body, "projets");
            log.info("GitHub PR event ({}) processed for project: {}", label, project.getName());
        });
    }

    private void notifyMembers(Project project, String type, String title, String body, String link) {
        projectMemberRepository.findByProjectId(project.getId())
                .forEach(pm -> notificationService.create(pm.getUser().getId(), type, title, body, link));
    }
}
