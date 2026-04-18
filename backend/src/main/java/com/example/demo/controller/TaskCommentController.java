package com.example.demo.controller;

import com.example.demo.dto.TaskCommentRequest;
import com.example.demo.dto.TaskCommentResponse;
import com.example.demo.service.TaskCommentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tasks/{taskId}/comments")
@RequiredArgsConstructor
public class TaskCommentController {

    private final TaskCommentService taskCommentService;

    @GetMapping
    public ResponseEntity<List<TaskCommentResponse>> getTaskComments(@PathVariable Long taskId) {
        return ResponseEntity.ok(taskCommentService.getByTaskId(taskId));
    }

    @PostMapping
    public ResponseEntity<TaskCommentResponse> addComment(
            @PathVariable Long taskId,
            @Valid @RequestBody TaskCommentRequest request,
            Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(taskCommentService.addComment(taskId, request, authentication.getName()));
    }
}
