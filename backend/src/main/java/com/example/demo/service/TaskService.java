package com.example.demo.service;

import com.example.demo.dto.TaskRequest;
import com.example.demo.dto.TaskResponse;
import com.example.demo.dto.PagedResponse;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.model.Project;
import com.example.demo.model.Task;
import com.example.demo.model.TaskPriority;
import com.example.demo.model.TaskStatus;
import com.example.demo.model.User;
import com.example.demo.repository.ProjectRepository;
import com.example.demo.repository.TaskCommentRepository;
import com.example.demo.repository.TaskRepository;
import com.example.demo.repository.UserRepository;
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
public class TaskService {

    private final TaskRepository taskRepository;
    private final TaskCommentRepository taskCommentRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final NotificationService notificationService;

    @Transactional
    public TaskResponse createTask(TaskRequest request) {
        validateDates(request);

        Project project = findProject(request.getProjectId());
        User assignee = findAssignee(request.getAssigneeId());

        Task task = Task.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .status(request.getStatus())
                .priority(request.getPriority())
                .startDate(request.getStartDate())
                .dueDate(request.getDueDate())
                .estimatedHours(request.getEstimatedHours())
                .actualHours(request.getActualHours())
                .project(project)
                .assignee(assignee)
                .build();

        TaskResponse response = mapToResponse(taskRepository.save(task));

        if (assignee != null) {
            emailService.sendTaskAssignedEmail(
                    assignee.getEmail(),
                    assignee.getFirstName(),
                    task.getTitle(),
                    project.getName(),
                    request.getDueDate() != null ? request.getDueDate().toString() : null);
            notificationService.create(
                    assignee.getId(),
                    "TASK_ASSIGNED",
                    "Task assigned: " + task.getTitle(),
                    "You have been assigned to \"" + task.getTitle() + "\" in project " + project.getName() + ".",
                    "taches");
        }

        return response;
    }

    @Transactional(readOnly = true)
    public PagedResponse<TaskResponse> getAllTasks(
            Long projectId,
            TaskStatus status,
            TaskPriority priority,
            String search,
            int page,
            int size,
            String sortBy,
            String sortDir) {
        Sort sort = Sort.by(Sort.Direction.fromString(sortDir), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Task> taskPage = taskRepository.findAll((root, query, criteriaBuilder) -> {
                    List<Predicate> predicates = new ArrayList<>();

                    if (projectId != null) {
                        predicates.add(criteriaBuilder.equal(root.get("project").get("id"), projectId));
                    }

                    if (status != null) {
                        predicates.add(criteriaBuilder.equal(root.get("status"), status));
                    }

                    if (priority != null) {
                        predicates.add(criteriaBuilder.equal(root.get("priority"), priority));
                    }

                    if (search != null && !search.isBlank()) {
                        String searchPattern = "%" + search.toLowerCase() + "%";
                        predicates.add(criteriaBuilder.or(
                                criteriaBuilder.like(criteriaBuilder.lower(root.get("title")), searchPattern),
                                criteriaBuilder.like(criteriaBuilder.lower(root.get("description")), searchPattern)
                        ));
                    }

                    return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
                }, pageable);

        List<TaskResponse> content = taskPage.getContent().stream()
                .map(this::mapToResponse)
                .toList();

        return PagedResponse.<TaskResponse>builder()
                .content(content)
                .page(taskPage.getNumber())
                .size(taskPage.getSize())
                .totalElements(taskPage.getTotalElements())
                .totalPages(taskPage.getTotalPages())
                .first(taskPage.isFirst())
                .last(taskPage.isLast())
                .build();
    }

    @Transactional(readOnly = true)
    public List<TaskResponse> getTasksByProjectId(Long projectId) {
        findProject(projectId);
        return taskRepository.findByProjectId(projectId).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public TaskResponse getTaskById(Long id) {
        return mapToResponse(findTask(id));
    }

    @Transactional
    public TaskResponse updateTask(Long id, TaskRequest request) {
        validateDates(request);

        Task task = findTask(id);
        User oldAssignee = task.getAssignee();
        TaskStatus oldStatus = task.getStatus();

        Project project = findProject(request.getProjectId());
        User newAssignee = findAssignee(request.getAssigneeId());
        TaskStatus newStatus = request.getStatus() != null ? request.getStatus() : task.getStatus();

        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());
        task.setStatus(newStatus);
        task.setPriority(request.getPriority() != null ? request.getPriority() : task.getPriority());
        task.setStartDate(request.getStartDate());
        task.setDueDate(request.getDueDate());
        task.setEstimatedHours(request.getEstimatedHours());
        task.setActualHours(request.getActualHours());
        task.setProject(project);
        task.setAssignee(newAssignee);

        TaskResponse response = mapToResponse(taskRepository.save(task));

        // Notify new assignee if assignee changed
        boolean assigneeChanged = newAssignee != null
                && (oldAssignee == null || !oldAssignee.getId().equals(newAssignee.getId()));
        if (assigneeChanged) {
            emailService.sendTaskAssignedEmail(
                    newAssignee.getEmail(),
                    newAssignee.getFirstName(),
                    task.getTitle(),
                    project.getName(),
                    request.getDueDate() != null ? request.getDueDate().toString() : null);
            notificationService.create(
                    newAssignee.getId(),
                    "TASK_ASSIGNED",
                    "Task assigned: " + task.getTitle(),
                    "You have been assigned to \"" + task.getTitle() + "\" in project " + project.getName() + ".",
                    "taches");
        }

        // Notify assignee if status changed
        boolean statusChanged = newAssignee != null && oldStatus != newStatus;
        if (statusChanged && !assigneeChanged) {
            emailService.sendTaskStatusChangedEmail(
                    newAssignee.getEmail(),
                    newAssignee.getFirstName(),
                    task.getTitle(),
                    project.getName(),
                    oldStatus.name(),
                    newStatus.name());
            notificationService.create(
                    newAssignee.getId(),
                    "TASK_STATUS_CHANGED",
                    "Task updated: " + task.getTitle(),
                    "Status changed from " + oldStatus.name() + " to " + newStatus.name() + " on \"" + task.getTitle() + "\".",
                    "taches");
        }

        return response;
    }

    @Transactional
    public void deleteTask(Long id) {
        taskCommentRepository.deleteByTaskId(id);
        taskRepository.delete(findTask(id));
    }

    private Task findTask(Long id) {
        return taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));
    }

    private Project findProject(Long id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));
    }

    private User findAssignee(Long assigneeId) {
        if (assigneeId == null) {
            return null;
        }

        return userRepository.findById(assigneeId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + assigneeId));
    }

    private void validateDates(TaskRequest request) {
        if (request.getStartDate() != null
                && request.getDueDate() != null
                && request.getDueDate().isBefore(request.getStartDate())) {
            throw new IllegalArgumentException("Task due date cannot be before start date");
        }
    }

    private TaskResponse mapToResponse(Task task) {
        return TaskResponse.builder()
                .id(task.getId())
                .title(task.getTitle())
                .description(task.getDescription())
                .status(task.getStatus())
                .priority(task.getPriority())
                .startDate(task.getStartDate())
                .dueDate(task.getDueDate())
                .estimatedHours(task.getEstimatedHours())
                .actualHours(task.getActualHours())
                .createdAt(task.getCreatedAt())
                .projectId(task.getProject().getId())
                .projectName(task.getProject().getName())
                .assigneeId(task.getAssignee() != null ? task.getAssignee().getId() : null)
                .assigneeEmail(task.getAssignee() != null ? task.getAssignee().getEmail() : null)
                .build();
    }
}
