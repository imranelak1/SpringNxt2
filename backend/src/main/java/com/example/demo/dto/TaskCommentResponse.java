package com.example.demo.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class TaskCommentResponse {
    private Long id;
    private Long taskId;
    private Long authorId;
    private String authorEmail;
    private String authorName;
    private String text;
    private LocalDateTime createdAt;
}
