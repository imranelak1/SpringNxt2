package com.example.demo.service;

import com.example.demo.dto.ProjectRequest;
import com.example.demo.dto.ProjectResponse;
import com.example.demo.dto.PagedResponse;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.model.Project;
import com.example.demo.model.ProjectStatus;
import com.example.demo.repository.ProjectMemberRepository;
import com.example.demo.repository.ProjectRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final EmailService emailService;
    private final NotificationService notificationService;

    @Transactional
    public ProjectResponse createProject(ProjectRequest request) {
        validateDates(request);

        Project project = Project.builder()
                .name(request.getName())
                .description(request.getDescription())
                .status(request.getStatus())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .budget(request.getBudget())
                .progressPercentage(request.getProgressPercentage())
                .githubRepo(normalizeGithubRepo(request.getGithubRepo()))
                .build();

        return mapToResponse(projectRepository.save(project));
    }

    @Transactional(readOnly = true)
    public PagedResponse<ProjectResponse> getAllProjects(
            String search,
            ProjectStatus status,
            int page,
            int size,
            String sortBy,
            String sortDir) {
        Sort sort = Sort.by(Sort.Direction.fromString(sortDir), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Project> rawPage = projectRepository.findAll((root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (search != null && !search.isBlank()) {
                String searchPattern = "%" + search.toLowerCase() + "%";
                predicates.add(criteriaBuilder.or(
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("name")), searchPattern),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("description")), searchPattern)
                ));
            }

            if (status != null) {
                predicates.add(criteriaBuilder.equal(root.get("status"), status));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        }, pageable);

        List<ProjectResponse> content = rawPage.getContent().stream()
                .map(this::mapToResponse)
                .toList();

        return PagedResponse.<ProjectResponse>builder()
                .content(content)
                .page(rawPage.getNumber())
                .size(rawPage.getSize())
                .totalElements(rawPage.getTotalElements())
                .totalPages(rawPage.getTotalPages())
                .first(rawPage.isFirst())
                .last(rawPage.isLast())
                .build();
    }

    @Transactional(readOnly = true)
    public ProjectResponse getProjectById(Long id) {
        return mapToResponse(findProject(id));
    }

    @Transactional
    public ProjectResponse updateProject(Long id, ProjectRequest request) {
        validateDates(request);

        Project project = findProject(id);
        ProjectStatus oldStatus = project.getStatus();
        ProjectStatus newStatus = request.getStatus() != null ? request.getStatus() : project.getStatus();

        project.setName(request.getName());
        project.setDescription(request.getDescription());
        project.setStatus(newStatus);
        project.setStartDate(request.getStartDate());
        project.setEndDate(request.getEndDate());
        project.setBudget(request.getBudget());
        project.setGithubRepo(normalizeGithubRepo(request.getGithubRepo()));
        project.setProgressPercentage(
                request.getProgressPercentage() != null ? request.getProgressPercentage() : project.getProgressPercentage());

        ProjectResponse response = mapToResponse(projectRepository.save(project));

        if (oldStatus != newStatus) {
            var members = projectMemberRepository.findByProjectId(id);
            List<String> memberEmails = members.stream().map(pm -> pm.getUser().getEmail()).toList();
            emailService.sendProjectStatusChangedEmail(project.getName(), oldStatus.name(), newStatus.name(), memberEmails);
            members.forEach(pm -> notificationService.create(
                    pm.getUser().getId(),
                    "PROJECT_STATUS_CHANGED",
                    "Project status updated: " + project.getName(),
                    "\"" + project.getName() + "\" status changed from " + oldStatus.name() + " to " + newStatus.name() + ".",
                    "projets"));
        }

        return response;
    }

    @Transactional
    public void deleteProject(Long id) {
        Project project = findProject(id);
        projectRepository.delete(project);
    }

    private Project findProject(Long id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));
    }

    private void validateDates(ProjectRequest request) {
        if (request.getStartDate() != null
                && request.getEndDate() != null
                && request.getEndDate().isBefore(request.getStartDate())) {
            throw new IllegalArgumentException("Project end date cannot be before start date");
        }
    }

    private ProjectResponse mapToResponse(Project project) {
        return ProjectResponse.builder()
                .id(project.getId())
                .name(project.getName())
                .description(project.getDescription())
                .status(project.getStatus())
                .startDate(project.getStartDate())
                .endDate(project.getEndDate())
                .budget(project.getBudget())
                .progressPercentage(project.getProgressPercentage())
                .createdAt(project.getCreatedAt())
                .taskCount(project.getTasks() != null ? project.getTasks().size() : 0)
                .memberCount(project.getMembers() != null ? project.getMembers().size() : 0)
                .githubRepo(project.getGithubRepo())
                .build();
    }

    private String normalizeGithubRepo(String raw) {
        if (raw == null || raw.isBlank()) return null;
        // Accept full URL or owner/repo — always store as owner/repo
        String s = raw.trim().replaceAll("/$", "");
        if (s.startsWith("https://github.com/")) s = s.substring("https://github.com/".length());
        if (s.startsWith("github.com/")) s = s.substring("github.com/".length());
        return s;
    }
}
