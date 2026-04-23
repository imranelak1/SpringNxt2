package com.example.demo.service;

import com.example.demo.dto.ProjectMemberRequest;
import com.example.demo.dto.ProjectMemberResponse;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.model.Project;
import com.example.demo.model.ProjectMember;
import com.example.demo.model.User;
import com.example.demo.repository.ProjectMemberRepository;
import com.example.demo.repository.ProjectRepository;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProjectMemberService {

    private final ProjectMemberRepository projectMemberRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final NotificationService notificationService;

    @Transactional
    public ProjectMemberResponse addMember(ProjectMemberRequest request) {
        Project project = findProject(request.getProjectId());
        User user = findUser(request.getUserId());

        projectMemberRepository.findByProjectIdAndUserId(project.getId(), user.getId())
                .ifPresent(existing -> {
                    throw new IllegalArgumentException("User is already assigned to this project");
                });

        ProjectMember member = ProjectMember.builder()
                .project(project)
                .user(user)
                .role(request.getRole())
                .allocationPercentage(request.getAllocationPercentage())
                .build();

        ProjectMemberResponse response = mapToResponse(projectMemberRepository.save(member));

        emailService.sendProjectMemberAddedEmail(
                user.getEmail(),
                user.getFirstName(),
                project.getName(),
                request.getRole() != null ? request.getRole().name() : "CONTRIBUTOR");
        notificationService.create(
                user.getId(),
                "PROJECT_MEMBER_ADDED",
                "Added to project: " + project.getName(),
                "You have been added to \"" + project.getName() + "\" as " +
                        (request.getRole() != null ? request.getRole().name() : "CONTRIBUTOR") + ".",
                "projets");

        return response;
    }

    @Transactional(readOnly = true)
    public List<ProjectMemberResponse> getMembersByProjectId(Long projectId) {
        findProject(projectId);
        return projectMemberRepository.findByProjectId(projectId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional
    public ProjectMemberResponse updateMember(Long id, ProjectMemberRequest request) {
        ProjectMember member = findMember(id);

        Project project = findProject(request.getProjectId());
        User user = findUser(request.getUserId());

        projectMemberRepository.findByProjectIdAndUserId(project.getId(), user.getId())
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> {
                    throw new IllegalArgumentException("User is already assigned to this project");
                });

        member.setProject(project);
        member.setUser(user);
        member.setRole(request.getRole() != null ? request.getRole() : member.getRole());
        member.setAllocationPercentage(
                request.getAllocationPercentage() != null
                        ? request.getAllocationPercentage()
                        : member.getAllocationPercentage());

        return mapToResponse(projectMemberRepository.save(member));
    }

    @Transactional
    public void removeMember(Long id) {
        projectMemberRepository.delete(findMember(id));
    }

    private ProjectMember findMember(Long id) {
        return projectMemberRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project member not found with id: " + id));
    }

    private Project findProject(Long id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));
    }

    private User findUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
    }

    private ProjectMemberResponse mapToResponse(ProjectMember member) {
        return ProjectMemberResponse.builder()
                .id(member.getId())
                .projectId(member.getProject().getId())
                .projectName(member.getProject().getName())
                .userId(member.getUser().getId())
                .userEmail(member.getUser().getEmail())
                .firstName(member.getUser().getFirstName())
                .lastName(member.getUser().getLastName())
                .role(member.getRole())
                .allocationPercentage(member.getAllocationPercentage())
                .createdAt(member.getCreatedAt())
                .build();
    }
}
