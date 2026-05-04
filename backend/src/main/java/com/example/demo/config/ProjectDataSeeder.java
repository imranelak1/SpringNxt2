package com.example.demo.config;

import com.example.demo.model.*;
import com.example.demo.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Component
@Order(2)
@RequiredArgsConstructor
public class ProjectDataSeeder implements CommandLineRunner {

    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public void run(String... args) {
        User admin    = userRepository.findByEmail("admin@springnxt.local").orElse(null);
        User manager  = userRepository.findByEmail("manager@springnxt.local").orElse(null);
        User emp1     = userRepository.findByEmail("employee1@springnxt.local").orElse(null);
        User karim    = userRepository.findByEmail("developer@springnxt.local").orElse(null);
        User sofia    = userRepository.findByEmail("designer@springnxt.local").orElse(null);

        if (admin == null || manager == null || emp1 == null) return;

        // Use emp1 as fallback if new users haven't been created yet
        User dev      = karim  != null ? karim  : emp1;
        User designer = sofia  != null ? sofia  : emp1;

        Set<String> existing = projectRepository.findAll().stream()
                .map(Project::getName).collect(Collectors.toSet());

        LocalDate today = LocalDate.now();

        // ── Project 1: Refonte Site Web ────────────────────────────────────
        if (!existing.contains("Refonte Site Web")) {
            Project p = save(Project.builder()
                    .name("Refonte Site Web")
                    .description("Refonte complète du site vitrine avec nouveau design et CMS headless.")
                    .status(ProjectStatus.ACTIVE).startDate(today.minusDays(45))
                    .endDate(today.plusDays(30)).budget(new BigDecimal("120000"))
                    .spentAmount(new BigDecimal("81600")).progressPercentage(68).build());
            addMember(p, manager, ProjectMemberRole.OWNER, 100);
            addMember(p, designer, ProjectMemberRole.CONTRIBUTOR, 80);
            saveTasks(List.of(
                task("Audit de l'existant",         TaskStatus.DONE,        TaskPriority.HIGH,   p, designer, today.minusDays(40), today.minusDays(35), 8, 8),
                task("Maquettes Figma",             TaskStatus.DONE,        TaskPriority.HIGH,   p, designer, today.minusDays(34), today.minusDays(20), 16, 18),
                task("Intégration page d'accueil",  TaskStatus.DONE,        TaskPriority.MEDIUM, p, designer, today.minusDays(19), today.minusDays(10), 12, 11),
                task("Intégration pages internes",  TaskStatus.IN_PROGRESS, TaskPriority.MEDIUM, p, designer, today.minusDays(9),  today.plusDays(10),  20, 8),
                task("Tests cross-browser",         TaskStatus.TODO,        TaskPriority.MEDIUM, p, designer, today.plusDays(11), today.plusDays(20),   8, null),
                task("Mise en ligne et DNS",        TaskStatus.TODO,        TaskPriority.HIGH,   p, manager,  today.plusDays(21), today.plusDays(30),   4, null)
            ));
        }

        // ── Project 2: Application Mobile ─────────────────────────────────
        if (!existing.contains("Application Mobile")) {
            Project p = save(Project.builder()
                    .name("Application Mobile")
                    .description("Application iOS/Android pour la gestion des commandes clients en temps réel.")
                    .status(ProjectStatus.ACTIVE).startDate(today.minusDays(90))
                    .endDate(today.plusDays(11)).budget(new BigDecimal("180000"))
                    .spentAmount(new BigDecimal("194000")).progressPercentage(85).build());
            addMember(p, manager,  ProjectMemberRole.MANAGER,     100);
            addMember(p, dev,      ProjectMemberRole.CONTRIBUTOR, 100);
            addMember(p, admin,    ProjectMemberRole.VIEWER,       20);
            saveTasks(List.of(
                task("Architecture technique",       TaskStatus.DONE,        TaskPriority.HIGH,   p, manager, today.minusDays(88), today.minusDays(80), 10, 10),
                task("Module authentification",      TaskStatus.DONE,        TaskPriority.HIGH,   p, dev,     today.minusDays(79), today.minusDays(60), 24, 26),
                task("Module catalogue produits",    TaskStatus.DONE,        TaskPriority.HIGH,   p, dev,     today.minusDays(59), today.minusDays(40), 20, 22),
                task("Module panier & commandes",    TaskStatus.DONE,        TaskPriority.HIGH,   p, dev,     today.minusDays(39), today.minusDays(15), 30, 28),
                task("Intégration paiement Stripe",  TaskStatus.IN_PROGRESS, TaskPriority.HIGH,   p, dev,     today.minusDays(14), today.plusDays(5),   16, 10),
                task("Tests et QA",                  TaskStatus.TODO,        TaskPriority.HIGH,   p, manager, today.plusDays(6),  today.plusDays(10),   8, null),
                task("Correction bugs critiques",    TaskStatus.IN_PROGRESS, TaskPriority.HIGH,   p, dev,     today.minusDays(10), today.minusDays(3),  8, 6)
            ));
        }

        // ── Project 3: Dashboard Analytics (COMPLETED) ────────────────────
        if (!existing.contains("Dashboard Analytics")) {
            Project p = save(Project.builder()
                    .name("Dashboard Analytics")
                    .description("Tableau de bord analytique en temps réel pour le suivi des KPIs commerciaux.")
                    .status(ProjectStatus.COMPLETED).startDate(today.minusDays(120))
                    .endDate(today.minusDays(20)).budget(new BigDecimal("80000"))
                    .spentAmount(new BigDecimal("78500")).progressPercentage(100).build());
            addMember(p, manager, ProjectMemberRole.OWNER,       100);
            addMember(p, dev,     ProjectMemberRole.CONTRIBUTOR,  60);
            saveTasks(List.of(
                task("Spécifications fonctionnelles", TaskStatus.DONE, TaskPriority.HIGH,   p, manager, today.minusDays(118), today.minusDays(110), 8,  8),
                task("Conception base de données",   TaskStatus.DONE, TaskPriority.HIGH,   p, dev,     today.minusDays(109), today.minusDays(95),  16, 15),
                task("Développement API REST",        TaskStatus.DONE, TaskPriority.HIGH,   p, dev,     today.minusDays(94),  today.minusDays(60),  40, 42),
                task("Intégration graphiques",        TaskStatus.DONE, TaskPriority.MEDIUM, p, designer,today.minusDays(59),  today.minusDays(35),  20, 19),
                task("Recette client",                TaskStatus.DONE, TaskPriority.HIGH,   p, manager, today.minusDays(34),  today.minusDays(21),  8,  7)
            ));
        }

        // ── Project 4: Campagne Marketing Q2 ──────────────────────────────
        if (!existing.contains("Campagne Marketing Q2")) {
            Project p = save(Project.builder()
                    .name("Campagne Marketing Q2")
                    .description("Campagne digitale multi-canal pour le lancement produit du second trimestre.")
                    .status(ProjectStatus.PLANNING).startDate(today.plusDays(5))
                    .endDate(today.plusDays(75)).budget(new BigDecimal("95000"))
                    .spentAmount(new BigDecimal("8500")).progressPercentage(15).build());
            addMember(p, manager, ProjectMemberRole.OWNER, 80);
            saveTasks(List.of(
                task("Brief créatif",                TaskStatus.DONE,        TaskPriority.HIGH,   p, manager, today.minusDays(5), today.minusDays(1), 4, 4),
                task("Sélection agence media",       TaskStatus.IN_PROGRESS, TaskPriority.MEDIUM, p, manager, today,              today.plusDays(14), 6, 2),
                task("Production visuels",           TaskStatus.TODO,        TaskPriority.MEDIUM, p, designer,today.plusDays(15), today.plusDays(35), 20, null),
                task("Lancement campagne SEA",       TaskStatus.TODO,        TaskPriority.HIGH,   p, null,    today.plusDays(36), today.plusDays(55), 8, null),
                task("Rapport de performance",       TaskStatus.TODO,        TaskPriority.LOW,    p, null,    today.plusDays(65), today.plusDays(75), 4, null)
            ));
        }

        // ── Project 5: Plateforme E-Commerce ──────────────────────────────
        if (!existing.contains("Plateforme E-Commerce")) {
            Project p = save(Project.builder()
                    .name("Plateforme E-Commerce")
                    .description("Marketplace B2C avec moteur de recommandation et checkout optimisé.")
                    .status(ProjectStatus.ACTIVE).startDate(today.minusDays(60))
                    .endDate(today.plusDays(20)).budget(new BigDecimal("200000"))
                    .spentAmount(new BigDecimal("112000")).progressPercentage(55).build());
            addMember(p, manager, ProjectMemberRole.OWNER,       100);
            addMember(p, dev,     ProjectMemberRole.CONTRIBUTOR, 100);
            addMember(p, designer,ProjectMemberRole.CONTRIBUTOR,  60);
            saveTasks(List.of(
                task("Setup infrastructure cloud",   TaskStatus.DONE,        TaskPriority.HIGH,     p, dev,     today.minusDays(58), today.minusDays(50), 12, 14),
                task("Catalogue produits",           TaskStatus.DONE,        TaskPriority.HIGH,     p, dev,     today.minusDays(49), today.minusDays(35), 24, 25),
                task("Système de paiement",          TaskStatus.DONE,        TaskPriority.CRITICAL, p, dev,     today.minusDays(34), today.minusDays(20), 20, 22),
                task("Design système & UI kit",      TaskStatus.DONE,        TaskPriority.HIGH,     p, designer,today.minusDays(55), today.minusDays(30), 30, 28),
                task("Moteur de recherche",          TaskStatus.IN_PROGRESS, TaskPriority.HIGH,     p, dev,     today.minusDays(19), today.plusDays(5),   16, 10),
                task("Recommandations IA",           TaskStatus.IN_PROGRESS, TaskPriority.MEDIUM,   p, dev,     today.minusDays(10), today.plusDays(15),  20, 6),
                task("Tests de charge",              TaskStatus.TODO,        TaskPriority.HIGH,     p, manager, today.plusDays(5),  today.plusDays(18),   8, null),
                // Overdue — triggers notification
                task("Optimisation SEO",             TaskStatus.IN_PROGRESS, TaskPriority.MEDIUM,   p, designer,today.minusDays(15), today.minusDays(5),  10, 4)
            ));
        }

        // ── Project 6: Migration Infrastructure ───────────────────────────
        if (!existing.contains("Migration Infrastructure")) {
            Project p = save(Project.builder()
                    .name("Migration Infrastructure")
                    .description("Migration on-premise vers cloud AWS avec zero downtime. Projet mis en pause.")
                    .status(ProjectStatus.ON_HOLD).startDate(today.minusDays(80))
                    .endDate(today.plusDays(60)).budget(new BigDecimal("150000"))
                    .spentAmount(new BigDecimal("45000")).progressPercentage(30).build());
            addMember(p, admin,   ProjectMemberRole.OWNER,       100);
            addMember(p, dev,     ProjectMemberRole.CONTRIBUTOR,  50);
            saveTasks(List.of(
                task("Audit infrastructure existante", TaskStatus.DONE,    TaskPriority.HIGH,   p, admin,   today.minusDays(78), today.minusDays(65), 16, 18),
                task("Plan de migration détaillé",     TaskStatus.DONE,    TaskPriority.HIGH,   p, admin,   today.minusDays(64), today.minusDays(50), 12, 13),
                task("Setup environnement staging",    TaskStatus.DONE,    TaskPriority.MEDIUM, p, dev,     today.minusDays(49), today.minusDays(35), 20, 19),
                task("Migration base de données",      TaskStatus.BLOCKED,  TaskPriority.CRITICAL,p, dev,   today.minusDays(34), today.minusDays(10), 30, 8),
                task("Bascule DNS et tests prod",      TaskStatus.TODO,    TaskPriority.CRITICAL,p, admin,  today.plusDays(20), today.plusDays(40),  16, null),
                task("Documentation ops",             TaskStatus.TODO,    TaskPriority.LOW,    p, dev,     today.plusDays(41), today.plusDays(55),   8, null)
            ));
        }

        // ── Project 7: Refonte CRM ─────────────────────────────────────────
        if (!existing.contains("Refonte CRM")) {
            Project p = save(Project.builder()
                    .name("Refonte CRM")
                    .description("Remplacement du CRM legacy par solution moderne avec pipeline de vente visuel.")
                    .status(ProjectStatus.ACTIVE).startDate(today.minusDays(40))
                    .endDate(today.plusDays(45)).budget(new BigDecimal("110000"))
                    .spentAmount(new BigDecimal("79200")).progressPercentage(72).build());
            addMember(p, manager, ProjectMemberRole.MANAGER,     100);
            addMember(p, dev,     ProjectMemberRole.CONTRIBUTOR, 100);
            addMember(p, designer,ProjectMemberRole.CONTRIBUTOR,  40);
            saveTasks(List.of(
                task("Analyse des besoins métier",   TaskStatus.DONE,        TaskPriority.HIGH,   p, manager, today.minusDays(38), today.minusDays(32), 8,  8),
                task("Modélisation des données",     TaskStatus.DONE,        TaskPriority.HIGH,   p, dev,     today.minusDays(31), today.minusDays(22), 12, 13),
                task("Pipeline de vente",            TaskStatus.DONE,        TaskPriority.HIGH,   p, dev,     today.minusDays(21), today.minusDays(10), 20, 21),
                task("Interface contacts",           TaskStatus.DONE,        TaskPriority.MEDIUM, p, designer,today.minusDays(18), today.minusDays(8),  16, 14),
                task("Rapports & KPIs",              TaskStatus.IN_PROGRESS, TaskPriority.MEDIUM, p, dev,     today.minusDays(7),  today.plusDays(15),  14, 6),
                task("Intégration email marketing",  TaskStatus.IN_PROGRESS, TaskPriority.HIGH,   p, dev,     today.minusDays(5),  today.plusDays(20),  10, 3),
                task("Formation équipe commerciale", TaskStatus.TODO,        TaskPriority.MEDIUM, p, manager, today.plusDays(25), today.plusDays(40),   6, null),
                task("Migration données legacy",     TaskStatus.TODO,        TaskPriority.HIGH,   p, dev,     today.plusDays(30), today.plusDays(44),   20, null)
            ));
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Project save(Project p) {
        return projectRepository.save(p);
    }

    private void addMember(Project project, User user, ProjectMemberRole role, int allocation) {
        if (user == null) return;
        if (projectMemberRepository.findByProjectIdAndUserId(project.getId(), user.getId()).isPresent()) return;
        projectMemberRepository.save(ProjectMember.builder()
                .project(project).user(user).role(role).allocationPercentage(allocation).build());
    }

    private void saveTasks(List<Task> tasks) {
        tasks.forEach(taskRepository::save);
    }

    private Task task(String title, TaskStatus status, TaskPriority priority,
                      Project project, User assignee, LocalDate start, LocalDate due,
                      Integer estimated, Integer actual) {
        return Task.builder()
                .title(title).description("").status(status).priority(priority)
                .project(project).assignee(assignee)
                .startDate(start).dueDate(due)
                .estimatedHours(estimated).actualHours(actual)
                .build();
    }
}
