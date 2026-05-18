package com.example.demo.service;

import com.example.demo.dto.TaskRequest;
import com.example.demo.dto.TaskResponse;
import com.example.demo.dto.PagedResponse;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.model.Project;
import com.example.demo.model.Sprint;
import com.example.demo.model.Task;
import com.example.demo.model.TaskPriority;
import com.example.demo.model.TaskStatus;
import com.example.demo.model.User;
import com.example.demo.repository.ProjectRepository;
import com.example.demo.repository.SprintRepository;
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

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final TaskCommentRepository taskCommentRepository;
    private final ProjectRepository projectRepository;
    private final SprintRepository sprintRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final NotificationService notificationService;
    private final CurrentUserService currentUserService;

    @Transactional
    public TaskResponse createTask(TaskRequest request) {
        currentUserService.requireManagerOrAdmin();
        validateDates(request);

        Project project = findProject(request.getProjectId());
        User assignee = findAssignee(request.getAssigneeId());
        Sprint sprint = findSprint(request.getSprintId(), project.getId());

        Task task = Task.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .status(request.getStatus())
                .priority(request.getPriority())
                .startDate(request.getStartDate())
                .dueDate(request.getDueDate())
                .estimatedHours(request.getEstimatedHours())
                .actualHours(request.getActualHours())
                .storyPoints(request.getStoryPoints())
                .backlogRank(request.getBacklogRank())
                .acceptanceCriteria(request.getAcceptanceCriteria())
                .project(project)
                .sprint(sprint)
                .assignee(assignee)
                .build();

        if (task.getStatus() == TaskStatus.DONE) {
            task.setCompletedAt(LocalDateTime.now());
        }

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
        User currentUser = currentUserService.getCurrentUser();
        Sort sort = Sort.by(Sort.Direction.fromString(sortDir), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Task> taskPage = taskRepository.findAll((root, query, criteriaBuilder) -> {
                    List<Predicate> predicates = new ArrayList<>();

                    if (!currentUserService.canManage(currentUser)) {
                        predicates.add(criteriaBuilder.equal(root.get("assignee").get("id"), currentUser.getId()));
                    }

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
        Task task = findTask(id);
        currentUserService.requireCanViewTask(task);
        return mapToResponse(task);
    }

    @Transactional
    public TaskResponse updateTask(Long id, TaskRequest request) {
        Task task = findTask(id);
        User currentUser = currentUserService.getCurrentUser();
        if (!currentUserService.canManage(currentUser)) {
            return updateEmployeeTask(task, request, currentUser);
        }

        validateDates(request);

        User oldAssignee = task.getAssignee();
        TaskStatus oldStatus = task.getStatus();

        Project project = findProject(request.getProjectId());
        User newAssignee = findAssignee(request.getAssigneeId());
        Sprint sprint = findSprint(request.getSprintId(), project.getId());
        TaskStatus newStatus = request.getStatus() != null ? request.getStatus() : task.getStatus();

        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());
        task.setStatus(newStatus);
        task.setPriority(request.getPriority() != null ? request.getPriority() : task.getPriority());
        task.setStartDate(request.getStartDate());
        task.setDueDate(request.getDueDate());
        task.setEstimatedHours(request.getEstimatedHours());
        task.setActualHours(request.getActualHours());
        task.setStoryPoints(request.getStoryPoints() != null ? request.getStoryPoints() : task.getStoryPoints());
        task.setBacklogRank(request.getBacklogRank());
        task.setAcceptanceCriteria(request.getAcceptanceCriteria());
        task.setProject(project);
        task.setSprint(sprint);
        task.setAssignee(newAssignee);

        if (oldStatus != TaskStatus.DONE && newStatus == TaskStatus.DONE) {
            task.setCompletedAt(LocalDateTime.now());
        } else if (oldStatus == TaskStatus.DONE && newStatus != TaskStatus.DONE) {
            task.setCompletedAt(null);
        }

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
        currentUserService.requireManagerOrAdmin();
        taskCommentRepository.deleteByTaskId(id);
        taskRepository.delete(findTask(id));
    }

    private TaskResponse updateEmployeeTask(Task task, TaskRequest request, User currentUser) {
        currentUserService.requireCanUpdateEmployeeTask(currentUser, task);

        TaskStatus oldStatus = task.getStatus();
        TaskStatus newStatus = request.getStatus() != null ? request.getStatus() : oldStatus;

        task.setStatus(newStatus);
        task.setActualHours(request.getActualHours());

        if (oldStatus != TaskStatus.DONE && newStatus == TaskStatus.DONE) {
            task.setCompletedAt(LocalDateTime.now());
        } else if (oldStatus == TaskStatus.DONE && newStatus != TaskStatus.DONE) {
            task.setCompletedAt(null);
        }

        return mapToResponse(taskRepository.save(task));
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

    private Sprint findSprint(Long sprintId, Long projectId) {
        if (sprintId == null) {
            return null;
        }

        Sprint sprint = sprintRepository.findById(sprintId)
                .orElseThrow(() -> new ResourceNotFoundException("Sprint not found with id: " + sprintId));
        if (!sprint.getProject().getId().equals(projectId)) {
            throw new IllegalArgumentException("Sprint does not belong to the selected project");
        }
        return sprint;
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
                .storyPoints(task.getStoryPoints())
                .backlogRank(task.getBacklogRank())
                .acceptanceCriteria(task.getAcceptanceCriteria())
                .createdAt(task.getCreatedAt())
                .completedAt(task.getCompletedAt())
                .projectId(task.getProject().getId())
                .projectName(task.getProject().getName())
                .sprintId(task.getSprint() != null ? task.getSprint().getId() : null)
                .sprintName(task.getSprint() != null ? task.getSprint().getName() : null)
                .assigneeId(task.getAssignee() != null ? task.getAssignee().getId() : null)
                .assigneeEmail(task.getAssignee() != null ? task.getAssignee().getEmail() : null)
                .build();
    }
}
