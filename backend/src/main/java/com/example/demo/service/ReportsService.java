package com.example.demo.service;

import com.example.demo.dto.MonthlyCountResponse;
import com.example.demo.dto.ReportsResponse;
import com.example.demo.dto.StatusCountResponse;
import com.example.demo.model.Project;
import com.example.demo.model.ProjectStatus;
import com.example.demo.model.Task;
import com.example.demo.model.TaskStatus;
import com.example.demo.repository.HealthScoreRepository;
import com.example.demo.repository.ProjectRepository;
import com.example.demo.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportsService {

    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final HealthScoreRepository healthScoreRepository;

    @Transactional(readOnly = true)
    public ReportsResponse getReports() {
        List<Project> projects = projectRepository.findAll();
        List<Task> tasks = taskRepository.findAll();

        int totalProjects = projects.size();
        int completedProjects = (int) projects.stream()
                .filter(p -> p.getStatus() == ProjectStatus.COMPLETED)
                .count();
        int activeProjects = (int) projects.stream()
                .filter(p -> p.getStatus() == ProjectStatus.ACTIVE)
                .count();

        int totalTasks = tasks.size();
        int completedTasks = (int) tasks.stream()
                .filter(t -> t.getStatus() == TaskStatus.DONE)
                .count();
        int deliveryRate = totalTasks == 0 ? 0 : (completedTasks * 100) / totalTasks;

        int avgHealth = (int) healthScoreRepository.findAll().stream()
                .mapToInt(h -> h.getOverallScore())
                .average()
                .orElse(0.0);

        List<MonthlyCountResponse> monthly = buildMonthlyProjectCounts(projects);

        Map<String, Long> byStatus = projects.stream()
                .collect(Collectors.groupingBy(p -> p.getStatus().name(), Collectors.counting()));
        List<StatusCountResponse> statusCounts = byStatus.entrySet().stream()
                .map(e -> new StatusCountResponse(e.getKey(), e.getValue().intValue()))
                .toList();

        return ReportsResponse.builder()
                .totalProjects(totalProjects)
                .completedProjects(completedProjects)
                .activeProjects(activeProjects)
                .deliveryRate(deliveryRate)
                .avgHealthScore(avgHealth)
                .totalTasks(totalTasks)
                .completedTasks(completedTasks)
                .monthlyProjectCounts(monthly)
                .projectsByStatus(statusCounts)
                .build();
    }

    private List<MonthlyCountResponse> buildMonthlyProjectCounts(List<Project> projects) {
        LocalDateTime now = LocalDateTime.now();
        List<MonthlyCountResponse> result = new ArrayList<>();

        for (int i = 5; i >= 0; i--) {
            LocalDateTime monthStart = now.minusMonths(i).withDayOfMonth(1).toLocalDate().atStartOfDay();
            LocalDateTime monthEnd = monthStart.plusMonths(1);
            String label = monthStart.getMonth().getDisplayName(TextStyle.SHORT, Locale.FRENCH);

            long count = projects.stream()
                    .filter(p -> {
                        LocalDateTime created = p.getCreatedAt();
                        return created != null && !created.isBefore(monthStart) && created.isBefore(monthEnd);
                    })
                    .count();

            result.add(new MonthlyCountResponse(label, (int) count));
        }

        return result;
    }
}
