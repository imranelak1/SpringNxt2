package com.example.demo.ai;

import com.example.demo.model.*;
import com.example.demo.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class AiContextBuilder {

    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final ProjectMemberRepository projectMemberRepository;

    @Transactional(readOnly = true)
    public String build(String userEmail, Role userRole) {
        StringBuilder sb = new StringBuilder();
        sb.append("Date du jour : ").append(LocalDate.now()).append("\n\n");

        List<Project> projects = resolveProjects(userEmail, userRole);

        if (projects.isEmpty()) {
            sb.append("Aucun projet disponible.\n");
            return sb.toString();
        }

        sb.append("=== PROJETS ===\n");
        for (Project p : projects) {
            sb.append("- ").append(p.getName())
                    .append(" [").append(p.getStatus()).append("]")
                    .append(" | Avancement : ").append(p.getProgressPercentage()).append("%");

            if (p.getBudget() != null) {
                sb.append(" | Budget : ").append(p.getBudget().toPlainString());
                if (p.getSpentAmount() != null) {
                    sb.append(" | Dépensé : ").append(p.getSpentAmount().toPlainString());
                }
            }
            if (p.getEndDate() != null) {
                long daysLeft = LocalDate.now().until(p.getEndDate()).getDays();
                sb.append(" | Échéance : ").append(p.getEndDate())
                        .append(" (").append(daysLeft >= 0 ? daysLeft + "j restants" : Math.abs(daysLeft) + "j de retard").append(")");
            }
            sb.append("\n");

            List<Task> tasks = resolveTasksForProject(p.getId(), userEmail, userRole);
            for (Task t : tasks) {
                sb.append("  · ").append(t.getTitle())
                        .append(" [").append(t.getStatus()).append("]")
                        .append(" Priorité:").append(t.getPriority());
                if (t.getAssignee() != null) {
                    sb.append(" Assigné:").append(t.getAssignee().getFirstName())
                            .append(" ").append(t.getAssignee().getLastName());
                }
                if (t.getDueDate() != null) {
                    boolean overdue = t.getDueDate().isBefore(LocalDate.now())
                            && t.getStatus() != TaskStatus.DONE;
                    sb.append(" Échéance:").append(t.getDueDate());
                    if (overdue) sb.append(" ⚠ EN RETARD");
                }
                sb.append("\n");
            }
        }

        if (userRole == Role.ADMIN || userRole == Role.MANAGER) {
            sb.append("\n=== ÉQUIPE ===\n");
            userRepository.findAll().forEach(u ->
                    sb.append("- ").append(u.getFirstName()).append(" ").append(u.getLastName())
                            .append(" <").append(u.getEmail()).append(">")
                            .append(" [").append(u.getRole()).append("]\n")
            );
        }

        return sb.toString();
    }

    private List<Project> resolveProjects(String userEmail, Role role) {
        if (role == Role.ADMIN || role == Role.MANAGER) {
            return projectRepository.findAll();
        }
        // Employee: only projects they're members of
        return projectMemberRepository.findAll().stream()
                .filter(pm -> pm.getUser().getEmail().equals(userEmail))
                .map(ProjectMember::getProject)
                .distinct()
                .collect(Collectors.toList());
    }

    private List<Task> resolveTasksForProject(Long projectId, String userEmail, Role role) {
        List<Task> all = taskRepository.findByProjectId(projectId);
        if (role == Role.EMPLOYEE) {
            return all.stream()
                    .filter(t -> t.getAssignee() != null && t.getAssignee().getEmail().equals(userEmail))
                    .collect(Collectors.toList());
        }
        return all;
    }
}
