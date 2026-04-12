package com.example.demo.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from:nexus@springnxt.local}")
    private String fromEmail;

    @Value("${app.backend-url}")
    private String backendUrl;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Value("${app.notifications.enabled:false}")
    private boolean notificationsEnabled;

    // ─── Auth emails ───────────────────────────────────────────────

    @Async("emailTaskExecutor")
    public void sendVerificationEmail(String to, String token) {
        String link = backendUrl + "/api/auth/verify?token=" + token;
        String body = row("Verification link", "<a href='" + link + "' style='color:#3d8aff'>Verify my email</a>")
                + "<p style='color:#555;font-size:13px;margin-top:16px'>This link expires in 24 hours.</p>";
        send(to, "Verify your Nexus account",
                buildHtml("Confirm your email", "Please verify your email address to activate your account.", body));
    }

    @Async("emailTaskExecutor")
    public void sendPasswordResetEmail(String to, String token) {
        String link = frontendUrl + "/reset-password?token=" + token;
        String body = row("Reset link", "<a href='" + link + "' style='color:#3d8aff'>Reset my password</a>")
                + "<p style='color:#555;font-size:13px;margin-top:16px'>This link expires in 1 hour.</p>";
        send(to, "Reset your Nexus password",
                buildHtml("Password reset", "You requested a password reset.", body));
    }

    // ─── Task notifications ────────────────────────────────────────

    @Async("emailTaskExecutor")
    public void sendTaskAssignedEmail(String assigneeEmail, String assigneeName,
                                      String taskTitle, String projectName, String dueDate) {
        if (!notificationsEnabled) return;
        String body = row("Task", taskTitle)
                + row("Project", projectName)
                + row("Due date", dueDate != null ? dueDate : "Not set")
                + cta("Open Nexus", frontendUrl);
        send(assigneeEmail,
                "You've been assigned to: " + taskTitle,
                buildHtml("New task assignment",
                        "Hi " + assigneeName + ", a task has been assigned to you.", body));
    }

    @Async("emailTaskExecutor")
    public void sendTaskStatusChangedEmail(String assigneeEmail, String assigneeName,
                                           String taskTitle, String projectName,
                                           String oldStatus, String newStatus) {
        if (!notificationsEnabled) return;
        String body = row("Task", taskTitle)
                + row("Project", projectName)
                + row("Previous status", badge(oldStatus))
                + row("New status", badge(newStatus))
                + cta("Open Nexus", frontendUrl);
        send(assigneeEmail,
                "Task status updated: " + taskTitle,
                buildHtml("Task status changed",
                        "Hi " + assigneeName + ", a task you're assigned to has been updated.", body));
    }

    // ─── Project member notifications ──────────────────────────────

    @Async("emailTaskExecutor")
    public void sendProjectMemberAddedEmail(String memberEmail, String memberName,
                                            String projectName, String role) {
        if (!notificationsEnabled) return;
        String body = row("Project", projectName)
                + row("Your role", role)
                + cta("Open project", frontendUrl);
        send(memberEmail,
                "You've been added to: " + projectName,
                buildHtml("Project invitation",
                        "Hi " + memberName + ", you've been added to a project.", body));
    }

    // ─── Project status notifications ──────────────────────────────

    @Async("emailTaskExecutor")
    public void sendProjectStatusChangedEmail(String projectName,
                                              String oldStatus, String newStatus,
                                              List<String> memberEmails) {
        if (!notificationsEnabled || memberEmails.isEmpty()) return;
        String body = row("Project", projectName)
                + row("Previous status", badge(oldStatus))
                + row("New status", badge(newStatus))
                + cta("Open project", frontendUrl);
        String html = buildHtml("Project status changed",
                "The status of a project you belong to has changed.", body);
        for (String email : memberEmails) {
            send(email, "Project update: " + projectName, html);
        }
    }

    // ─── Internal helpers ──────────────────────────────────────────

    private void send(String to, String subject, String html) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject("[Nexus] " + subject);
            helper.setText(html, true);
            mailSender.send(message);
            log.info("Email sent → {} | {}", to, subject);
        } catch (Exception e) {
            log.warn("Email failed → {} | {} | {}", to, subject, e.getMessage());
        }
    }

    private String buildHtml(String title, String subtitle, String content) {
        return "<!DOCTYPE html><html><head><meta charset='UTF-8'></head>"
                + "<body style='margin:0;padding:0;background:#f0f2f5;font-family:Arial,sans-serif;'>"
                + "<div style='max-width:560px;margin:40px auto;background:#fff;"
                + "border-radius:14px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);'>"

                + "<div style='background:linear-gradient(135deg,#0d1117,#161a22);"
                + "padding:28px 32px;border-bottom:3px solid #4fffb0;'>"
                + "<div style='font-size:20px;font-weight:800;color:#fff;letter-spacing:-0.5px;'>"
                + "NEX<span style='color:#4fffb0'>US</span></div>"
                + "<div style='color:rgba(255,255,255,0.45);font-size:12px;margin-top:2px;'>"
                + "Intelligent Project Management</div></div>"

                + "<div style='background:#f8f9fb;padding:20px 32px;border-bottom:1px solid #eee;'>"
                + "<div style='font-size:17px;font-weight:700;color:#111;margin-bottom:4px;'>" + title + "</div>"
                + "<div style='font-size:13px;color:#666;'>" + subtitle + "</div>"
                + "</div>"

                + "<div style='padding:24px 32px;'>" + content + "</div>"

                + "<div style='padding:16px 32px;background:#f8f9fb;border-top:1px solid #eee;"
                + "font-size:11px;color:#aaa;'>You received this because you have a Nexus account. "
                + "Manage preferences in <a href='" + frontendUrl
                + "' style='color:#3d8aff;text-decoration:none;'>Settings</a>.</div>"
                + "</div></body></html>";
    }

    private String row(String label, String value) {
        return "<div style='margin-bottom:14px;'>"
                + "<div style='font-size:10px;text-transform:uppercase;letter-spacing:0.6px;"
                + "color:#888;margin-bottom:3px;'>" + label + "</div>"
                + "<div style='font-size:14px;color:#222;font-weight:500;'>" + value + "</div>"
                + "</div>";
    }

    private String badge(String status) {
        String color = switch (status.toUpperCase()) {
            case "ACTIVE", "DONE", "COMPLETED" -> "#22c55e";
            case "IN_PROGRESS", "INPROGRESS" -> "#3d8aff";
            case "ON_HOLD", "BLOCKED" -> "#f59e0b";
            case "CANCELLED" -> "#ef4444";
            default -> "#888";
        };
        return "<span style='display:inline-block;background:" + color + "20;color:" + color
                + ";padding:2px 10px;border-radius:20px;font-size:12px;font-weight:600;"
                + "border:1px solid " + color + "40;'>" + status + "</span>";
    }

    private String cta(String label, String url) {
        return "<div style='margin-top:20px;'>"
                + "<a href='" + url + "' style='display:inline-block;"
                + "background:linear-gradient(135deg,#4fffb0,#3d8aff);"
                + "color:#0a0c10;padding:11px 22px;border-radius:8px;"
                + "text-decoration:none;font-weight:700;font-size:13px;'>"
                + label + " →</a></div>";
    }
}
