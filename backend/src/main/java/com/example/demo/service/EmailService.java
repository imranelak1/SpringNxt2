package com.example.demo.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.backend-url}")
    private String backendUrl;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    public void sendVerificationEmail(String to, String token) {
        String link = backendUrl + "/api/auth/verify?token=" + token;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(to);
        message.setSubject("Verify your email address");
        message.setText(
                "Hello,\n\n"
                        + "Please click the link below to verify your email address:\n\n"
                        + link + "\n\n"
                        + "This link will expire in 24 hours.\n\n"
                        + "If you did not create an account, please ignore this email.");
        mailSender.send(message);
    }

    public void sendPasswordResetEmail(String to, String token) {
        String link = frontendUrl + "/reset-password?token=" + token;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(to);
        message.setSubject("Reset your password");
        message.setText(
                "Hello,\n\n"
                        + "You requested to reset your password. Click the link below:\n\n"
                        + link + "\n\n"
                        + "This link will expire in 1 hour.\n\n"
                        + "If you did not request a password reset, please ignore this email.");
        mailSender.send(message);
    }
}
