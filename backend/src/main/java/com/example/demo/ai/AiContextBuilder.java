package com.example.demo.ai;

import com.example.demo.model.HealthScore;
import com.example.demo.model.Project;
import com.example.demo.model.ProjectMember;
import com.example.demo.model.ProjectStatus;
import com.example.demo.model.Role;
import com.example.demo.model.Task;
import com.example.demo.model.TaskPriority;
import com.example.demo.model.TaskStatus;
import com.example.demo.repository.ProjectMemberRepository;
import com.example.demo.repository.ProjectRepository;
import com.example.demo.repository.TaskRepository;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
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
        return buildPortfolioContext(userEmail, userRole);
    }

    @Transactional(readOnly = true)
    public String buildProject(Long projectId, String userEmail, Role userRole) {
        List<Project> visibleProjects = resolveProjects(userEmail, userRole);
        Project project = visibleProjects.stream()
                .filter(p -> p.getId().equals(projectId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Project not found or not visible"));

        LocalDate today = LocalDate.now();
        List<Task> tasks = resolveTasksForProject(project.getId(), userEmail, userRole);
        StringBuilder sb = new StringBuilder();

        sb.append("DATE_ANALYSE: ").append(today).append("\n\n");
        sb.append("=== PROJET CIBLE ===\n");
        appendProjectContext(sb, project, tasks, today, true);
        sb.append("\n=== POSITION DANS LE PORTEFEUILLE ===\n");
        appendPortfolioSummary(sb, visibleProjects, userEmail, userRole, today);

        return sb.toString();
    }

    private String buildPortfolioContext(String userEmail, Role userRole) {
        LocalDate today = LocalDate.now();
        List<Project> projects = resolveProjects(userEmail, userRole);
        StringBuilder sb = new StringBuilder();

        sb.append("DATE_ANALYSE: ").append(today).append("\n\n");

        if (projects.isEmpty()) {
            sb.append("Aucun projet disponible.\n");
            return sb.toString();
        }

        sb.append("=== SYNTHESE PORTEFEUILLE ===\n");
        appendPortfolioSummary(sb, projects, userEmail, userRole, today);

        sb.append("\n=== SIGNAUX PRIORITAIRES DETECTES ===\n");
        appendPortfolioSignals(sb, projects, userEmail, userRole, today);

        sb.append("\n=== DETAILS PROJETS, TRIES PAR RISQUE ===\n");
        projects.stream()
                .sorted(Comparator.comparingInt(
                        (Project p) -> projectRiskScore(p, resolveTasksForProject(p.getId(), userEmail, userRole), today)
                ).reversed())
                .forEach(project -> {
                    List<Task> tasks = resolveTasksForProject(project.getId(), userEmail, userRole);
                    appendProjectContext(sb, project, tasks, today, false);
                    sb.append("\n");
                });

        if (userRole == Role.ADMIN || userRole == Role.MANAGER) {
            sb.append("\n=== EQUIPE ===\n");
            userRepository.findAll().forEach(u ->
                    sb.append("- ").append(u.getFirstName()).append(" ").append(u.getLastName())
                            .append(" <").append(u.getEmail()).append(">")
                            .append(" [").append(u.getRole()).append("]\n")
            );
        }

        return sb.toString();
    }

    private void appendPortfolioSummary(StringBuilder sb, List<Project> projects, String userEmail, Role role, LocalDate today) {
        List<Task> tasks = projects.stream()
                .flatMap(project -> resolveTasksForProject(project.getId(), userEmail, role).stream())
                .toList();

        int activeProjects = countProjects(projects, ProjectStatus.ACTIVE);
        int completedProjects = countProjects(projects, ProjectStatus.COMPLETED);
        int lateProjects = (int) projects.stream().filter(p -> isLateProject(p, today)).count();
        int blockedTasks = countTasks(tasks, TaskStatus.BLOCKED);
        int overdueTasks = (int) tasks.stream().filter(t -> isOverdue(t, today)).count();
        int dueSoonTasks = (int) tasks.stream().filter(t -> isDueSoon(t, today, 7)).count();
        int criticalOpenTasks = (int) tasks.stream().filter(this::isCriticalOpen).count();

        BigDecimal totalBudget = sum(projects.stream().map(Project::getBudget).toList());
        BigDecimal totalSpent = sum(projects.stream().map(Project::getSpentAmount).toList());

        sb.append("- Projets visibles: ").append(projects.size())
                .append(" | actifs: ").append(activeProjects)
                .append(" | termines: ").append(completedProjects)
                .append(" | en retard: ").append(lateProjects).append("\n");
        sb.append("- Taches visibles: ").append(tasks.size())
                .append(" | terminees: ").append(countTasks(tasks, TaskStatus.DONE))
                .append(" | en cours: ").append(countTasks(tasks, TaskStatus.IN_PROGRESS))
                .append(" | bloquees: ").append(blockedTasks)
                .append(" | en retard: ").append(overdueTasks)
                .append(" | echeance <= 7j: ").append(dueSoonTasks)
                .append(" | critiques ouvertes: ").append(criticalOpenTasks).append("\n");

        if (totalBudget.signum() > 0) {
            sb.append("- Budget global: ").append(money(totalBudget))
                    .append(" | depense: ").append(money(totalSpent))
                    .append(" | consommation: ").append(percentage(totalSpent, totalBudget)).append("%")
                    .append(" | restant: ").append(money(totalBudget.subtract(totalSpent))).append("\n");
        } else {
            sb.append("- Budget global: non renseigne\n");
        }
    }

    private void appendPortfolioSignals(StringBuilder sb, List<Project> projects, String userEmail, Role role, LocalDate today) {
        List<Task> tasks = projects.stream()
                .flatMap(project -> resolveTasksForProject(project.getId(), userEmail, role).stream())
                .toList();

        int lateProjects = (int) projects.stream().filter(p -> isLateProject(p, today)).count();
        int blockedTasks = countTasks(tasks, TaskStatus.BLOCKED);
        int overdueTasks = (int) tasks.stream().filter(t -> isOverdue(t, today)).count();
        int dueSoonTasks = (int) tasks.stream().filter(t -> isDueSoon(t, today, 7)).count();
        int criticalOpenTasks = (int) tasks.stream().filter(this::isCriticalOpen).count();
        long budgetAtRiskProjects = projects.stream().filter(this::isBudgetAtRisk).count();

        if (lateProjects == 0 && blockedTasks == 0 && overdueTasks == 0 && dueSoonTasks == 0
                && criticalOpenTasks == 0 && budgetAtRiskProjects == 0) {
            sb.append("- Aucun signal critique automatique. Chercher les opportunites d'optimisation: priorisation, charge, budget, dependances.\n");
            return;
        }

        if (lateProjects > 0) sb.append("- ").append(lateProjects).append(" projet(s) ont depasse leur echeance.\n");
        if (blockedTasks > 0) sb.append("- ").append(blockedTasks).append(" tache(s) bloquees impactent l'avancement.\n");
        if (overdueTasks > 0) sb.append("- ").append(overdueTasks).append(" tache(s) ouvertes sont en retard.\n");
        if (dueSoonTasks > 0) sb.append("- ").append(dueSoonTasks).append(" tache(s) ouvertes arrivent a echeance dans 7 jours.\n");
        if (criticalOpenTasks > 0) sb.append("- ").append(criticalOpenTasks).append(" tache(s) critiques ne sont pas terminees.\n");
        if (budgetAtRiskProjects > 0) sb.append("- ").append(budgetAtRiskProjects).append(" projet(s) depassent 90% de consommation budgetaire ou sont en depassement.\n");
    }

    private void appendProjectContext(StringBuilder sb, Project project, List<Task> tasks, LocalDate today, boolean includeMoreTasks) {
        int riskScore = projectRiskScore(project, tasks, today);
        Map<TaskStatus, Long> statusCounts = tasks.stream()
                .collect(Collectors.groupingBy(Task::getStatus, () -> new EnumMap<>(TaskStatus.class), Collectors.counting()));

        int overdueTasks = (int) tasks.stream().filter(t -> isOverdue(t, today)).count();
        int dueSoonTasks = (int) tasks.stream().filter(t -> isDueSoon(t, today, 7)).count();
        int criticalOpenTasks = (int) tasks.stream().filter(this::isCriticalOpen).count();

        sb.append("- Projet #").append(project.getId()).append(": ").append(project.getName()).append("\n");
        sb.append("  Statut: ").append(project.getStatus())
                .append(" | progression: ").append(valueOrZero(project.getProgressPercentage())).append("%")
                .append(" | score risque calcule: ").append(riskScore).append("/100\n");

        if (project.getStartDate() != null || project.getEndDate() != null) {
            sb.append("  Planning: debut=").append(valueOrDash(project.getStartDate()))
                    .append(" | fin=").append(valueOrDash(project.getEndDate()));
            if (project.getEndDate() != null) {
                long daysLeft = ChronoUnit.DAYS.between(today, project.getEndDate());
                sb.append(" | ").append(daysLeft >= 0 ? daysLeft + "j restants" : Math.abs(daysLeft) + "j de retard");
            }
            sb.append("\n");
        }

        if (project.getBudget() != null) {
            BigDecimal spent = nonNull(project.getSpentAmount());
            sb.append("  Budget: ").append(money(project.getBudget()))
                    .append(" | depense: ").append(money(spent))
                    .append(" | consommation: ").append(percentage(spent, project.getBudget())).append("%")
                    .append(" | restant: ").append(money(project.getBudget().subtract(spent))).append("\n");
        }

        if (project.getHealthScore() != null) {
            HealthScore h = project.getHealthScore();
            sb.append("  HealthScore: global=").append(valueOrZero(h.getOverallScore()))
                    .append("/100 | delai=").append(valueOrZero(h.getDelayScore()))
                    .append(" | progression=").append(valueOrZero(h.getProgressScore()))
                    .append(" | charge=").append(valueOrZero(h.getWorkloadScore()))
                    .append(" | budget=").append(valueOrZero(h.getBudgetScore())).append("\n");
        }

        sb.append("  Taches: total=").append(tasks.size())
                .append(" | TODO=").append(statusCounts.getOrDefault(TaskStatus.TODO, 0L))
                .append(" | IN_PROGRESS=").append(statusCounts.getOrDefault(TaskStatus.IN_PROGRESS, 0L))
                .append(" | BLOCKED=").append(statusCounts.getOrDefault(TaskStatus.BLOCKED, 0L))
                .append(" | DONE=").append(statusCounts.getOrDefault(TaskStatus.DONE, 0L))
                .append(" | en retard=").append(overdueTasks)
                .append(" | echeance <= 7j=").append(dueSoonTasks)
                .append(" | critiques ouvertes=").append(criticalOpenTasks).append("\n");

        if (project.getMembers() != null && !project.getMembers().isEmpty()) {
            int allocation = project.getMembers().stream()
                    .map(ProjectMember::getAllocationPercentage)
                    .mapToInt(v -> v != null ? v : 0)
                    .sum();
            sb.append("  Equipe: ").append(project.getMembers().size())
                    .append(" membre(s), allocation totale projet=").append(allocation).append("%\n");
        }

        List<Task> attentionTasks = tasks.stream()
                .filter(t -> t.getStatus() != TaskStatus.DONE)
                .filter(t -> t.getStatus() == TaskStatus.BLOCKED
                        || isOverdue(t, today)
                        || isDueSoon(t, today, 7)
                        || t.getPriority() == TaskPriority.CRITICAL
                        || t.getPriority() == TaskPriority.HIGH)
                .sorted(Comparator.comparingInt((Task t) -> taskRiskScore(t, today)).reversed())
                .limit(includeMoreTasks ? 12 : 5)
                .toList();

        if (!attentionTasks.isEmpty()) {
            sb.append("  Taches a surveiller:\n");
            attentionTasks.forEach(task -> appendTaskLine(sb, task, today));
        } else if (includeMoreTasks && !tasks.isEmpty()) {
            sb.append("  Taches principales:\n");
            tasks.stream()
                    .sorted(Comparator.comparing(Task::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                    .limit(12)
                    .forEach(task -> appendTaskLine(sb, task, today));
        }
    }

    private void appendTaskLine(StringBuilder sb, Task task, LocalDate today) {
        sb.append("    - ").append(task.getTitle())
                .append(" | statut=").append(task.getStatus())
                .append(" | priorite=").append(task.getPriority());
        if (task.getDueDate() != null) {
            long daysLeft = ChronoUnit.DAYS.between(today, task.getDueDate());
            sb.append(" | echeance=").append(task.getDueDate())
                    .append(daysLeft < 0 ? " (" + Math.abs(daysLeft) + "j retard)" : " (" + daysLeft + "j)");
        }
        if (task.getEstimatedHours() != null) sb.append(" | estime=").append(task.getEstimatedHours()).append("h");
        if (task.getActualHours() != null) sb.append(" | reel=").append(task.getActualHours()).append("h");
        if (task.getAssignee() != null) {
            sb.append(" | assignee=").append(task.getAssignee().getFirstName()).append(" ")
                    .append(task.getAssignee().getLastName());
        }
        sb.append("\n");
    }

    private List<Project> resolveProjects(String userEmail, Role role) {
        if (role == Role.ADMIN || role == Role.MANAGER) {
            return projectRepository.findAll();
        }
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

    private int projectRiskScore(Project project, List<Task> tasks, LocalDate today) {
        int score = 0;
        if (isLateProject(project, today)) score += 25;
        if (isBudgetAtRisk(project)) score += 20;
        if (project.getHealthScore() != null && project.getHealthScore().getOverallScore() != null) {
            score += Math.max(0, 100 - project.getHealthScore().getOverallScore()) / 3;
        }
        score += Math.min(20, (int) tasks.stream().filter(t -> isOverdue(t, today)).count() * 6);
        score += Math.min(15, countTasks(tasks, TaskStatus.BLOCKED) * 5);
        score += Math.min(10, (int) tasks.stream().filter(this::isCriticalOpen).count() * 3);
        return Math.min(100, score);
    }

    private int taskRiskScore(Task task, LocalDate today) {
        int score = 0;
        if (isOverdue(task, today)) score += 50;
        if (task.getStatus() == TaskStatus.BLOCKED) score += 40;
        if (task.getPriority() == TaskPriority.CRITICAL) score += 30;
        if (task.getPriority() == TaskPriority.HIGH) score += 15;
        if (isDueSoon(task, today, 7)) score += 12;
        if (task.getActualHours() != null && task.getEstimatedHours() != null
                && task.getActualHours() > task.getEstimatedHours()) {
            score += 10;
        }
        return score;
    }

    private boolean isLateProject(Project project, LocalDate today) {
        return project.getEndDate() != null
                && project.getEndDate().isBefore(today)
                && project.getStatus() != ProjectStatus.COMPLETED
                && project.getStatus() != ProjectStatus.CANCELLED;
    }

    private boolean isOverdue(Task task, LocalDate today) {
        return task.getDueDate() != null
                && task.getDueDate().isBefore(today)
                && task.getStatus() != TaskStatus.DONE;
    }

    private boolean isDueSoon(Task task, LocalDate today, int days) {
        if (task.getDueDate() == null || task.getStatus() == TaskStatus.DONE) return false;
        long daysLeft = ChronoUnit.DAYS.between(today, task.getDueDate());
        return daysLeft >= 0 && daysLeft <= days;
    }

    private boolean isCriticalOpen(Task task) {
        return task.getPriority() == TaskPriority.CRITICAL && task.getStatus() != TaskStatus.DONE;
    }

    private boolean isBudgetAtRisk(Project project) {
        if (project.getBudget() == null || project.getBudget().signum() <= 0 || project.getSpentAmount() == null) {
            return false;
        }
        return project.getSpentAmount().compareTo(project.getBudget()) > 0
                || percentage(project.getSpentAmount(), project.getBudget()) >= 90;
    }

    private int countProjects(List<Project> projects, ProjectStatus status) {
        return (int) projects.stream().filter(project -> project.getStatus() == status).count();
    }

    private int countTasks(List<Task> tasks, TaskStatus status) {
        return (int) tasks.stream().filter(task -> task.getStatus() == status).count();
    }

    private BigDecimal sum(List<BigDecimal> values) {
        return values.stream().map(this::nonNull).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal nonNull(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    private int percentage(BigDecimal numerator, BigDecimal denominator) {
        if (denominator == null || denominator.signum() <= 0) return 0;
        return nonNull(numerator)
                .multiply(BigDecimal.valueOf(100))
                .divide(denominator, 0, RoundingMode.HALF_UP)
                .intValue();
    }

    private String money(BigDecimal value) {
        return nonNull(value).setScale(0, RoundingMode.HALF_UP).toPlainString() + " MAD";
    }

    private String valueOrDash(LocalDate value) {
        return value != null ? value.toString() : "-";
    }

    private int valueOrZero(Integer value) {
        return value != null ? value : 0;
    }
}
