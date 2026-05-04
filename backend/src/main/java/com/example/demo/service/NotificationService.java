package com.example.demo.service;

import com.example.demo.dto.NotificationResponse;
import com.example.demo.model.Project;
import com.example.demo.model.ProjectStatus;
import com.example.demo.model.Task;
import com.example.demo.model.TaskStatus;
import com.example.demo.repository.ProjectRepository;
import com.example.demo.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;

    @Transactional(readOnly = true)
    public List<NotificationResponse> getNotifications() {
        List<NotificationResponse> notifications = new ArrayList<>();
        LocalDate today = LocalDate.now();
        LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7);

        List<Task> allTasks = taskRepository.findAll();
        List<Project> allProjects = projectRepository.findAll();

        // Overdue tasks → ALERT
        allTasks.stream()
                .filter(t -> t.getDueDate() != null
                        && t.getDueDate().isBefore(today)
                        && t.getStatus() != TaskStatus.DONE)
                .forEach(t -> {
                    long daysLate = ChronoUnit.DAYS.between(t.getDueDate(), today);
                    notifications.add(NotificationResponse.builder()
                            .id("task-overdue-" + t.getId())
                            .type("ALERT")
                            .title("Tâche en retard — " + t.getTitle())
                            .description("En retard de " + daysLate + " jour(s)."
                                    + (t.getProject() != null ? " Projet : " + t.getProject().getName() : ""))
                            .timeAgo(timeAgo(t.getCreatedAt()))
                            .read(false)
                            .build());
                });

        // Projects with deadline within 14 days → WARNING
        allProjects.stream()
                .filter(p -> p.getEndDate() != null
                        && p.getStatus() != ProjectStatus.COMPLETED
                        && p.getStatus() != ProjectStatus.CANCELLED
                        && !p.getEndDate().isBefore(today)
                        && ChronoUnit.DAYS.between(today, p.getEndDate()) <= 14)
                .forEach(p -> {
                    long daysLeft = ChronoUnit.DAYS.between(today, p.getEndDate());
                    notifications.add(NotificationResponse.builder()
                            .id("project-deadline-" + p.getId())
                            .type("WARNING")
                            .title("Échéance proche — " + p.getName())
                            .description("Livraison dans " + daysLeft + " jour(s). Progression : "
                                    + p.getProgressPercentage() + "%.")
                            .timeAgo(timeAgo(p.getCreatedAt()))
                            .read(false)
                            .build());
                });

        // Projects with budget and progress > 90% → INFO (budget at risk)
        allProjects.stream()
                .filter(p -> p.getBudget() != null
                        && p.getBudget().compareTo(BigDecimal.ZERO) > 0
                        && p.getProgressPercentage() != null
                        && p.getProgressPercentage() >= 90
                        && p.getStatus() != ProjectStatus.COMPLETED)
                .forEach(p -> {
                    notifications.add(NotificationResponse.builder()
                            .id("budget-risk-" + p.getId())
                            .type("WARNING")
                            .title("Budget presque consommé — " + p.getName())
                            .description("Progression à " + p.getProgressPercentage()
                                    + "% avec budget alloué de " + p.getBudget().toPlainString() + ".")
                            .timeAgo(timeAgo(p.getCreatedAt()))
                            .read(false)
                            .build());
                });

        // Recently completed tasks (last 7 days) → SUCCESS
        allTasks.stream()
                .filter(t -> t.getStatus() == TaskStatus.DONE
                        && t.getCreatedAt() != null
                        && t.getCreatedAt().isAfter(sevenDaysAgo))
                .limit(3)
                .forEach(t -> {
                    notifications.add(NotificationResponse.builder()
                            .id("task-done-" + t.getId())
                            .type("SUCCESS")
                            .title("Tâche complétée — " + t.getTitle())
                            .description("Terminée avec succès."
                                    + (t.getProject() != null ? " Projet : " + t.getProject().getName() : ""))
                            .timeAgo(timeAgo(t.getCreatedAt()))
                            .read(true)
                            .build());
                });

        notifications.sort(Comparator.comparing(n -> n.isRead() ? 1 : 0));
        return notifications;
    }

    private String timeAgo(LocalDateTime dateTime) {
        if (dateTime == null) return "";
        long minutes = ChronoUnit.MINUTES.between(dateTime, LocalDateTime.now());
        if (minutes < 60) return minutes + " min";
        long hours = minutes / 60;
        if (hours < 24) return hours + "h";
        long days = hours / 24;
        if (days < 7) return days + "j";
        return (days / 7) + " sem";
    }
}
