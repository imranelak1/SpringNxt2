package com.example.demo.service;

import com.example.demo.dto.*;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.model.*;
import com.example.demo.repository.ProjectRepository;
import com.example.demo.repository.SprintRepository;
import com.example.demo.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ScrumService {

    private final ProjectRepository projectRepository;
    private final SprintRepository sprintRepository;
    private final TaskRepository taskRepository;

    @Transactional(readOnly = true)
    public ScrumBoardResponse getBoard(Long projectId) {
        Project project = findProject(projectId);
        Sprint activeSprint = sprintRepository.findFirstByProjectIdAndStatus(projectId, SprintStatus.ACTIVE).orElse(null);
        List<Sprint> plannedSprints = sprintRepository.findByProjectIdAndStatusOrderByStartDateDescIdDesc(projectId, SprintStatus.PLANNED);
        List<Sprint> closedSprints = sprintRepository.findByProjectIdAndStatusOrderByStartDateDescIdDesc(projectId, SprintStatus.CLOSED);
        List<Task> backlog = taskRepository.findByProjectIdOrderByBacklogRankAscIdAsc(projectId).stream()
                .filter(task -> task.getSprint() == null)
                .toList();
        List<Task> activeTasks = activeSprint == null
                ? List.of()
                : taskRepository.findBySprintIdOrderByBacklogRankAscIdAsc(activeSprint.getId());

        return ScrumBoardResponse.builder()
                .projectId(project.getId())
                .projectName(project.getName())
                .activeSprint(mapSprint(activeSprint))
                .plannedSprints(plannedSprints.stream().map(this::mapSprint).toList())
                .closedSprints(closedSprints.stream().map(this::mapSprint).toList())
                .backlog(backlog.stream().map(this::mapTask).toList())
                .activeSprintTasks(activeTasks.stream().map(this::mapTask).toList())
                .burndown(activeSprint == null ? List.of() : buildBurndown(activeSprint, activeTasks))
                .velocity(closedSprints.stream()
                        .sorted(Comparator.comparing(Sprint::getEndDate))
                        .map(this::mapVelocity)
                        .toList())
                .metrics(buildMetrics(backlog, activeSprint, activeTasks, closedSprints))
                .build();
    }

    @Transactional
    public SprintResponse createSprint(Long projectId, SprintRequest request) {
        validateSprintRequest(request);
        Project project = findProject(projectId);

        Sprint sprint = Sprint.builder()
                .project(project)
                .name(request.getName())
                .goal(request.getGoal())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .capacityPoints(request.getCapacityPoints())
                .status(SprintStatus.PLANNED)
                .build();

        return mapSprint(sprintRepository.save(sprint));
    }

    @Transactional
    public SprintResponse updateSprint(Long sprintId, SprintRequest request) {
        validateSprintRequest(request);
        Sprint sprint = findSprint(sprintId);
        if (sprint.getStatus() == SprintStatus.CLOSED) {
            throw new IllegalArgumentException("Closed sprints cannot be edited");
        }

        sprint.setName(request.getName());
        sprint.setGoal(request.getGoal());
        sprint.setStartDate(request.getStartDate());
        sprint.setEndDate(request.getEndDate());
        sprint.setCapacityPoints(request.getCapacityPoints() != null ? request.getCapacityPoints() : 0);

        return mapSprint(sprintRepository.save(sprint));
    }

    @Transactional
    public SprintResponse startSprint(Long sprintId) {
        Sprint sprint = findSprint(sprintId);
        if (sprint.getStatus() == SprintStatus.CLOSED) {
            throw new IllegalArgumentException("Closed sprints cannot be restarted");
        }
        sprintRepository.findFirstByProjectIdAndStatus(sprint.getProject().getId(), SprintStatus.ACTIVE)
                .filter(active -> !active.getId().equals(sprintId))
                .ifPresent(active -> {
                    throw new IllegalArgumentException("Project already has an active sprint: " + active.getName());
                });

        sprint.setStatus(SprintStatus.ACTIVE);
        return mapSprint(sprintRepository.save(sprint));
    }

    @Transactional
    public SprintResponse closeSprint(Long sprintId) {
        Sprint sprint = findSprint(sprintId);
        if (sprint.getStatus() != SprintStatus.ACTIVE) {
            throw new IllegalArgumentException("Only active sprints can be closed");
        }

        List<Task> tasks = taskRepository.findBySprintIdOrderByBacklogRankAscIdAsc(sprintId);
        sprint.setCommittedPointsSnapshot(sumStoryPoints(tasks));
        sprint.setCompletedPointsSnapshot(sumCompletedStoryPoints(tasks));
        sprint.setStatus(SprintStatus.CLOSED);
        sprint.setClosedAt(LocalDateTime.now());

        tasks.stream()
                .filter(task -> task.getStatus() != TaskStatus.DONE)
                .forEach(task -> {
                    task.setSprint(null);
                    if (task.getStatus() == TaskStatus.IN_PROGRESS) {
                        task.setStatus(TaskStatus.TODO);
                    }
                });

        return mapSprint(sprintRepository.save(sprint));
    }

    @Transactional
    public TaskResponse assignTaskToSprint(Long sprintId, Long taskId) {
        Sprint sprint = findSprint(sprintId);
        if (sprint.getStatus() == SprintStatus.CLOSED) {
            throw new IllegalArgumentException("Cannot add tasks to a closed sprint");
        }

        Task task = findTask(taskId);
        if (!task.getProject().getId().equals(sprint.getProject().getId())) {
            throw new IllegalArgumentException("Task and sprint must belong to the same project");
        }
        task.setSprint(sprint);
        return mapTask(taskRepository.save(task));
    }

    @Transactional
    public TaskResponse removeTaskFromSprint(Long sprintId, Long taskId) {
        Sprint sprint = findSprint(sprintId);
        if (sprint.getStatus() == SprintStatus.CLOSED) {
            throw new IllegalArgumentException("Cannot remove tasks from a closed sprint");
        }

        Task task = findTask(taskId);
        if (task.getSprint() == null || !task.getSprint().getId().equals(sprintId)) {
            throw new IllegalArgumentException("Task is not assigned to this sprint");
        }
        task.setSprint(null);
        return mapTask(taskRepository.save(task));
    }

    @Transactional
    public TaskResponse updateTaskScrum(Long taskId, TaskScrumUpdateRequest request) {
        Task task = findTask(taskId);
        if (request.getStoryPoints() != null) {
            task.setStoryPoints(request.getStoryPoints());
        }
        if (request.getBacklogRank() != null) {
            task.setBacklogRank(request.getBacklogRank());
        }
        if (request.getAcceptanceCriteria() != null) {
            task.setAcceptanceCriteria(request.getAcceptanceCriteria());
        }
        return mapTask(taskRepository.save(task));
    }

    private ScrumMetricsResponse buildMetrics(List<Task> backlog, Sprint activeSprint, List<Task> activeTasks, List<Sprint> closedSprints) {
        int averageVelocity = closedSprints.stream()
                .limit(5)
                .mapToInt(this::completedPoints)
                .sum();
        int closedCount = Math.min(5, closedSprints.size());
        if (closedCount > 0) {
            averageVelocity = Math.round((float) averageVelocity / closedCount);
        }

        return ScrumMetricsResponse.builder()
                .backlogItems(backlog.size())
                .backlogPoints(sumStoryPoints(backlog))
                .activeCommittedPoints(sumStoryPoints(activeTasks))
                .activeCompletedPoints(sumCompletedStoryPoints(activeTasks))
                .activeRemainingPoints(sumRemainingStoryPoints(activeTasks))
                .activeBlockedItems((int) activeTasks.stream().filter(task -> task.getStatus() == TaskStatus.BLOCKED).count())
                .activeCapacityPoints(activeSprint != null ? activeSprint.getCapacityPoints() : 0)
                .averageVelocity(averageVelocity)
                .build();
    }

    private List<BurndownPointResponse> buildBurndown(Sprint sprint, List<Task> tasks) {
        int totalPoints = sumStoryPoints(tasks);
        long durationDays = Math.max(1, ChronoUnit.DAYS.between(sprint.getStartDate(), sprint.getEndDate()) + 1);
        LocalDate today = LocalDate.now();

        return sprint.getStartDate().datesUntil(sprint.getEndDate().plusDays(1))
                .map(date -> {
                    long dayIndex = ChronoUnit.DAYS.between(sprint.getStartDate(), date);
                    int ideal = Math.max(0, Math.round(totalPoints - ((float) totalPoints * dayIndex / Math.max(1, durationDays - 1))));
                    Integer actual = date.isAfter(today) ? null : remainingPointsAt(tasks, date);
                    return BurndownPointResponse.builder()
                            .date(date)
                            .idealRemainingPoints(ideal)
                            .actualRemainingPoints(actual)
                            .build();
                })
                .toList();
    }

    private int remainingPointsAt(List<Task> tasks, LocalDate date) {
        return tasks.stream()
                .filter(task -> task.getCompletedAt() == null || task.getCompletedAt().toLocalDate().isAfter(date))
                .mapToInt(this::storyPoints)
                .sum();
    }

    private VelocityPointResponse mapVelocity(Sprint sprint) {
        return VelocityPointResponse.builder()
                .sprintId(sprint.getId())
                .sprintName(sprint.getName())
                .committedPoints(committedPoints(sprint))
                .completedPoints(completedPoints(sprint))
                .build();
    }

    private SprintResponse mapSprint(Sprint sprint) {
        if (sprint == null) {
            return null;
        }
        List<Task> tasks = taskRepository.findBySprintIdOrderByBacklogRankAscIdAsc(sprint.getId());
        int committed = committedPoints(sprint, tasks);
        int completed = completedPoints(sprint, tasks);

        return SprintResponse.builder()
                .id(sprint.getId())
                .projectId(sprint.getProject().getId())
                .projectName(sprint.getProject().getName())
                .name(sprint.getName())
                .goal(sprint.getGoal())
                .startDate(sprint.getStartDate())
                .endDate(sprint.getEndDate())
                .status(sprint.getStatus())
                .capacityPoints(sprint.getCapacityPoints())
                .committedPoints(committed)
                .completedPoints(completed)
                .remainingPoints(Math.max(0, committed - completed))
                .taskCount(tasks.size())
                .doneTaskCount((int) tasks.stream().filter(task -> task.getStatus() == TaskStatus.DONE).count())
                .createdAt(sprint.getCreatedAt())
                .closedAt(sprint.getClosedAt())
                .build();
    }

    private TaskResponse mapTask(Task task) {
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

    private Project findProject(Long projectId) {
        return projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));
    }

    private Sprint findSprint(Long sprintId) {
        return sprintRepository.findById(sprintId)
                .orElseThrow(() -> new ResourceNotFoundException("Sprint not found with id: " + sprintId));
    }

    private Task findTask(Long taskId) {
        return taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + taskId));
    }

    private void validateSprintRequest(SprintRequest request) {
        if (request.getStartDate() != null
                && request.getEndDate() != null
                && request.getEndDate().isBefore(request.getStartDate())) {
            throw new IllegalArgumentException("Sprint end date cannot be before start date");
        }
    }

    private int committedPoints(Sprint sprint) {
        return committedPoints(sprint, taskRepository.findBySprintIdOrderByBacklogRankAscIdAsc(sprint.getId()));
    }

    private int committedPoints(Sprint sprint, List<Task> tasks) {
        if (sprint.getCommittedPointsSnapshot() != null) {
            return sprint.getCommittedPointsSnapshot();
        }
        return sumStoryPoints(tasks);
    }

    private int completedPoints(Sprint sprint) {
        return completedPoints(sprint, taskRepository.findBySprintIdOrderByBacklogRankAscIdAsc(sprint.getId()));
    }

    private int completedPoints(Sprint sprint, List<Task> tasks) {
        if (sprint.getCompletedPointsSnapshot() != null) {
            return sprint.getCompletedPointsSnapshot();
        }
        return sumCompletedStoryPoints(tasks);
    }

    private int sumStoryPoints(List<Task> tasks) {
        return tasks.stream().mapToInt(this::storyPoints).sum();
    }

    private int sumCompletedStoryPoints(List<Task> tasks) {
        return tasks.stream()
                .filter(task -> task.getStatus() == TaskStatus.DONE)
                .mapToInt(this::storyPoints)
                .sum();
    }

    private int sumRemainingStoryPoints(List<Task> tasks) {
        return tasks.stream()
                .filter(task -> task.getStatus() != TaskStatus.DONE)
                .mapToInt(this::storyPoints)
                .sum();
    }

    private int storyPoints(Task task) {
        return task.getStoryPoints() != null ? task.getStoryPoints() : 0;
    }
}
