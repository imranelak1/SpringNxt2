package com.example.demo.service;

import com.example.demo.dto.DashboardProjectSummaryResponse;
import com.example.demo.dto.DashboardResponse;
import com.example.demo.dto.HealthScoreResponse;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.model.HealthScore;
import com.example.demo.model.Project;
import com.example.demo.model.ProjectStatus;
import com.example.demo.model.Task;
import com.example.demo.model.TaskStatus;
import com.example.demo.repository.HealthScoreRepository;
import com.example.demo.repository.ProjectRepository;
import com.example.demo.repository.TaskRepository;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class HealthScoreService {

    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final HealthScoreRepository healthScoreRepository;
    private final UserRepository userRepository;

    @Transactional
    public HealthScoreResponse calculateProjectHealth(Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));

        List<Task> tasks = taskRepository.findByProjectId(projectId);

        int totalTasks = tasks.size();
        int completedTasks = (int) tasks.stream()
                .filter(task -> task.getStatus() == TaskStatus.DONE)
                .count();
        int delayedTasks = (int) tasks.stream()
                .filter(task -> task.getDueDate() != null
                        && task.getDueDate().isBefore(LocalDate.now())
                        && task.getStatus() != TaskStatus.DONE)
                .count();

        int progressScore = clamp(project.getProgressPercentage() != null ? project.getProgressPercentage() : 0);
        int delayScore = totalTasks == 0 ? 100 : clamp(100 - ((delayedTasks * 100) / totalTasks));
        int workloadScore = totalTasks == 0 ? 100 : clamp((completedTasks * 100) / totalTasks);
        int budgetScore = project.getBudget() != null ? 80 : 100;
        int overallScore = clamp(Math.round((delayScore * 0.40f)
                + (progressScore * 0.35f)
                + (workloadScore * 0.15f)
                + (budgetScore * 0.10f)));

        HealthScore healthScore = healthScoreRepository.findByProjectId(projectId)
                .orElseGet(() -> HealthScore.builder().project(project).build());

        healthScore.setDelayScore(delayScore);
        healthScore.setProgressScore(progressScore);
        healthScore.setWorkloadScore(workloadScore);
        healthScore.setBudgetScore(budgetScore);
        healthScore.setOverallScore(overallScore);

        return mapHealthScoreResponse(healthScoreRepository.save(healthScore));
    }

    @Transactional(readOnly = true)
    public DashboardResponse getDashboard() {
        List<Project> projects = projectRepository.findAll();
        List<Task> tasks = taskRepository.findAll();

        List<DashboardProjectSummaryResponse> projectSummaries = projects.stream()
                .map(project -> {
                    List<Task> projectTasks = taskRepository.findByProjectId(project.getId());
                    int completedProjectTasks = (int) projectTasks.stream()
                            .filter(task -> task.getStatus() == TaskStatus.DONE)
                            .count();

                    Integer overallHealthScore = healthScoreRepository.findByProjectId(project.getId())
                            .map(HealthScore::getOverallScore)
                            .orElse(null);

                    return DashboardProjectSummaryResponse.builder()
                            .projectId(project.getId())
                            .projectName(project.getName())
                            .status(project.getStatus())
                            .progressPercentage(project.getProgressPercentage())
                            .taskCount(projectTasks.size())
                            .completedTaskCount(completedProjectTasks)
                            .memberCount(project.getMembers() != null ? project.getMembers().size() : 0)
                            .overallHealthScore(overallHealthScore)
                            .build();
                })
                .toList();

        int activeProjects = (int) projects.stream()
                .filter(project -> project.getStatus() == ProjectStatus.ACTIVE)
                .count();
        int completedTasks = (int) tasks.stream()
                .filter(task -> task.getStatus() == TaskStatus.DONE)
                .count();

        return DashboardResponse.builder()
                .totalProjects(projects.size())
                .activeProjects(activeProjects)
                .totalTasks(tasks.size())
                .completedTasks(completedTasks)
                .totalUsers((int) userRepository.count())
                .projects(projectSummaries)
                .build();
    }

    private HealthScoreResponse mapHealthScoreResponse(HealthScore healthScore) {
        return HealthScoreResponse.builder()
                .projectId(healthScore.getProject().getId())
                .projectName(healthScore.getProject().getName())
                .overallScore(healthScore.getOverallScore())
                .delayScore(healthScore.getDelayScore())
                .progressScore(healthScore.getProgressScore())
                .workloadScore(healthScore.getWorkloadScore())
                .budgetScore(healthScore.getBudgetScore())
                .calculatedAt(healthScore.getCalculatedAt())
                .build();
    }

    private int clamp(int value) {
        return Math.max(0, Math.min(100, value));
    }
}
