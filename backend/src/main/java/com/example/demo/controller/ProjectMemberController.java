package com.example.demo.controller;

import com.example.demo.dto.ProjectMemberRequest;
import com.example.demo.dto.ProjectMemberResponse;
import com.example.demo.service.ProjectMemberService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/project-members")
@RequiredArgsConstructor
public class ProjectMemberController {

    private final ProjectMemberService projectMemberService;

    @PostMapping
    public ResponseEntity<ProjectMemberResponse> addMember(@Valid @RequestBody ProjectMemberRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(projectMemberService.addMember(request));
    }

    @GetMapping
    public ResponseEntity<List<ProjectMemberResponse>> getMembersByProject(
            @RequestParam Long projectId) {
        return ResponseEntity.ok(projectMemberService.getMembersByProjectId(projectId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProjectMemberResponse> updateMember(
            @PathVariable Long id,
            @Valid @RequestBody ProjectMemberRequest request) {
        return ResponseEntity.ok(projectMemberService.updateMember(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> removeMember(@PathVariable Long id) {
        projectMemberService.removeMember(id);
        return ResponseEntity.noContent().build();
    }
}
