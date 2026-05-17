package com.example.demo.controller;

import com.example.demo.dto.*;
import com.example.demo.service.ScrumService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class ScrumController {

    private final ScrumService scrumService;

    @GetMapping("/api/projects/{projectId}/scrum")
    public ResponseEntity<ScrumBoardResponse> getBoard(@PathVariable Long projectId) {
        return ResponseEntity.ok(scrumService.getBoard(projectId));
    }

    @PostMapping("/api/projects/{projectId}/sprints")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<SprintResponse> createSprint(
            @PathVariable Long projectId,
            @Valid @RequestBody SprintRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(scrumService.createSprint(projectId, request));
    }

    @PutMapping("/api/sprints/{sprintId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<SprintResponse> updateSprint(
            @PathVariable Long sprintId,
            @Valid @RequestBody SprintRequest request) {
        return ResponseEntity.ok(scrumService.updateSprint(sprintId, request));
    }

    @PutMapping("/api/sprints/{sprintId}/start")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<SprintResponse> startSprint(@PathVariable Long sprintId) {
        return ResponseEntity.ok(scrumService.startSprint(sprintId));
    }

    @PutMapping("/api/sprints/{sprintId}/close")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<SprintResponse> closeSprint(@PathVariable Long sprintId) {
        return ResponseEntity.ok(scrumService.closeSprint(sprintId));
    }

    @PutMapping("/api/sprints/{sprintId}/tasks/{taskId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<TaskResponse> assignTask(
            @PathVariable Long sprintId,
            @PathVariable Long taskId) {
        return ResponseEntity.ok(scrumService.assignTaskToSprint(sprintId, taskId));
    }

    @DeleteMapping("/api/sprints/{sprintId}/tasks/{taskId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<TaskResponse> removeTask(
            @PathVariable Long sprintId,
            @PathVariable Long taskId) {
        return ResponseEntity.ok(scrumService.removeTaskFromSprint(sprintId, taskId));
    }

    @PutMapping("/api/tasks/{taskId}/scrum")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<TaskResponse> updateTaskScrum(
            @PathVariable Long taskId,
            @Valid @RequestBody TaskScrumUpdateRequest request) {
        return ResponseEntity.ok(scrumService.updateTaskScrum(taskId, request));
    }
}
