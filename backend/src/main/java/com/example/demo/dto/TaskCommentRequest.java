package com.example.demo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class TaskCommentRequest {

    @NotBlank(message = "Comment text is required")
    @Size(max = 2000, message = "Comment text must not exceed 2000 characters")
    private String text;
}
