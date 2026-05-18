package com.example.demo;

import com.example.demo.dto.ProjectMemberRequest;
import com.example.demo.dto.ProjectRequest;
import com.example.demo.dto.SprintRequest;
import com.example.demo.dto.TaskRequest;
import com.example.demo.dto.TaskScrumUpdateRequest;
import com.example.demo.model.AuthProvider;
import com.example.demo.model.Project;
import com.example.demo.model.ProjectMember;
import com.example.demo.model.ProjectMemberRole;
import com.example.demo.model.ProjectStatus;
import com.example.demo.model.Role;
import com.example.demo.model.Sprint;
import com.example.demo.model.SprintStatus;
import com.example.demo.model.Task;
import com.example.demo.model.TaskPriority;
import com.example.demo.model.TaskStatus;
import com.example.demo.model.User;
import com.example.demo.repository.ProjectMemberRepository;
import com.example.demo.repository.ProjectRepository;
import com.example.demo.repository.SprintRepository;
import com.example.demo.repository.TaskRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.repository.CalendarEventRepository;
import com.example.demo.repository.HealthScoreRepository;
import com.example.demo.repository.NotificationRepository;
import com.example.demo.repository.PasswordResetTokenRepository;
import com.example.demo.repository.TaskCommentRepository;
import com.example.demo.repository.VerificationTokenRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ApiIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProjectMemberRepository projectMemberRepository;

    @Autowired
    private SprintRepository sprintRepository;

    @Autowired
    private TaskCommentRepository taskCommentRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private HealthScoreRepository healthScoreRepository;

    @Autowired
    private CalendarEventRepository calendarEventRepository;

    @Autowired
    private VerificationTokenRepository verificationTokenRepository;

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    private Project project;
    private User user;

    @BeforeEach
    void setUp() {
        taskCommentRepository.deleteAll();
        notificationRepository.deleteAll();
        healthScoreRepository.deleteAll();
        calendarEventRepository.deleteAll();
        verificationTokenRepository.deleteAll();
        passwordResetTokenRepository.deleteAll();
        projectMemberRepository.deleteAll();
        taskRepository.deleteAll();
        sprintRepository.deleteAll();
        projectRepository.deleteAll();
        userRepository.deleteAll();

        user = userRepository.save(User.builder()
                .firstName("Test")
                .lastName("User")
                .email("tester@example.com")
                .password("encoded")
                .role(Role.ADMIN)
                .provider(AuthProvider.LOCAL)
                .enabled(true)
                .build());

        project = projectRepository.save(Project.builder()
                .name("Initial Project")
                .description("Existing project for integration tests")
                .status(ProjectStatus.ACTIVE)
                .startDate(LocalDate.of(2026, 4, 1))
                .endDate(LocalDate.of(2026, 6, 30))
                .budget(BigDecimal.valueOf(15000))
                .progressPercentage(35)
                .build());
    }

    @Test
    @WithMockUser(username = "tester@example.com", roles = {"ADMIN"})
    void createProject_shouldReturnCreatedProject() throws Exception {
        ProjectRequest request = ProjectRequest.builder()
                .name("Platform Revamp")
                .description("New platform delivery")
                .status(ProjectStatus.ACTIVE)
                .startDate(LocalDate.of(2026, 4, 4))
                .endDate(LocalDate.of(2026, 7, 1))
                .budget(BigDecimal.valueOf(30000))
                .progressPercentage(10)
                .build();

        mockMvc.perform(post("/api/projects")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.name").value("Platform Revamp"))
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    @WithMockUser(username = "tester@example.com", roles = {"ADMIN"})
    void createProject_shouldRejectInvalidProgress() throws Exception {
        ProjectRequest request = ProjectRequest.builder()
                .name("Broken Project")
                .progressPercentage(101)
                .build();

        mockMvc.perform(post("/api/projects")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.progressPercentage").exists());
    }

    @Test
    @WithMockUser(username = "tester@example.com", roles = {"ADMIN"})
    void updateProject_shouldPersistChanges() throws Exception {
        ProjectRequest request = ProjectRequest.builder()
                .name("Updated Project")
                .description("Updated details")
                .status(ProjectStatus.ON_HOLD)
                .startDate(LocalDate.of(2026, 4, 1))
                .endDate(LocalDate.of(2026, 7, 15))
                .budget(BigDecimal.valueOf(22000))
                .progressPercentage(55)
                .build();

        mockMvc.perform(put("/api/projects/{id}", project.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Updated Project"))
                .andExpect(jsonPath("$.status").value("ON_HOLD"))
                .andExpect(jsonPath("$.progressPercentage").value(55));
    }

    @Test
    @WithMockUser(username = "tester@example.com", roles = {"ADMIN"})
    void getProjects_shouldFilterBySearchAndStatus() throws Exception {
        projectRepository.save(Project.builder()
                .name("Archived Initiative")
                .description("Other project")
                .status(ProjectStatus.COMPLETED)
                .progressPercentage(100)
                .build());

        mockMvc.perform(get("/api/projects")
                        .param("search", "initial")
                        .param("status", "ACTIVE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].name").value("Initial Project"));
    }

    @Test
    @WithMockUser(username = "tester@example.com", roles = {"ADMIN"})
    void getProjects_shouldPaginateAndSort() throws Exception {
        projectRepository.save(Project.builder()
                .name("Beta Project")
                .description("Second")
                .status(ProjectStatus.ACTIVE)
                .progressPercentage(20)
                .build());
        projectRepository.save(Project.builder()
                .name("Alpha Project")
                .description("Third")
                .status(ProjectStatus.ACTIVE)
                .progressPercentage(30)
                .build());

        mockMvc.perform(get("/api/projects")
                        .param("page", "0")
                        .param("size", "2")
                        .param("sortBy", "name")
                        .param("sortDir", "asc"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(2))
                .andExpect(jsonPath("$.totalElements").value(3))
                .andExpect(jsonPath("$.totalPages").value(2))
                .andExpect(jsonPath("$.content[0].name").value("Alpha Project"));
    }

    @Test
    @WithMockUser(username = "tester@example.com", roles = {"ADMIN"})
    void deleteProject_shouldRemoveProject() throws Exception {
        mockMvc.perform(delete("/api/projects/{id}", project.getId()))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/projects/{id}", project.getId()))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(username = "tester@example.com", roles = {"ADMIN"})
    void createTask_shouldAttachTaskToProject() throws Exception {
        TaskRequest request = TaskRequest.builder()
                .title("Implement API")
                .description("Build task endpoints")
                .status(TaskStatus.IN_PROGRESS)
                .priority(TaskPriority.HIGH)
                .startDate(LocalDate.of(2026, 4, 5))
                .dueDate(LocalDate.of(2026, 4, 12))
                .estimatedHours(8)
                .actualHours(3)
                .projectId(project.getId())
                .assigneeId(user.getId())
                .build();

        mockMvc.perform(post("/api/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("Implement API"))
                .andExpect(jsonPath("$.projectId").value(project.getId()))
                .andExpect(jsonPath("$.assigneeId").value(user.getId()));
    }

    @Test
    @WithMockUser(username = "tester@example.com", roles = {"ADMIN"})
    void createTask_shouldRejectInvalidDates() throws Exception {
        TaskRequest request = TaskRequest.builder()
                .title("Invalid Task")
                .projectId(project.getId())
                .startDate(LocalDate.of(2026, 4, 10))
                .dueDate(LocalDate.of(2026, 4, 5))
                .build();

        mockMvc.perform(post("/api/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Task due date cannot be before start date"));
    }

    @Test
    @WithMockUser(username = "tester@example.com", roles = {"ADMIN"})
    void updateTask_shouldPersistChanges() throws Exception {
        Task savedTask = taskRepository.save(Task.builder()
                .title("Original Task")
                .description("Original")
                .status(TaskStatus.TODO)
                .priority(TaskPriority.MEDIUM)
                .project(project)
                .assignee(user)
                .estimatedHours(4)
                .actualHours(1)
                .build());

        TaskRequest request = TaskRequest.builder()
                .title("Updated Task")
                .description("Updated")
                .status(TaskStatus.DONE)
                .priority(TaskPriority.HIGH)
                .projectId(project.getId())
                .assigneeId(user.getId())
                .estimatedHours(5)
                .actualHours(5)
                .build();

        mockMvc.perform(put("/api/tasks/{id}", savedTask.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Updated Task"))
                .andExpect(jsonPath("$.status").value("DONE"))
                .andExpect(jsonPath("$.actualHours").value(5));
    }

    @Test
    @WithMockUser(username = "tester@example.com", roles = {"ADMIN"})
    void getTasks_shouldFilterByProjectStatusPriorityAndSearch() throws Exception {
        taskRepository.save(Task.builder()
                .title("API Searchable Task")
                .description("Filter me in")
                .status(TaskStatus.IN_PROGRESS)
                .priority(TaskPriority.HIGH)
                .project(project)
                .assignee(user)
                .build());

        taskRepository.save(Task.builder()
                .title("Other Task")
                .description("Do not include")
                .status(TaskStatus.DONE)
                .priority(TaskPriority.LOW)
                .project(project)
                .assignee(user)
                .build());

        mockMvc.perform(get("/api/tasks")
                        .param("projectId", project.getId().toString())
                        .param("status", "IN_PROGRESS")
                        .param("priority", "HIGH")
                        .param("search", "searchable"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].title").value("API Searchable Task"));
    }

    @Test
    @WithMockUser(username = "tester@example.com", roles = {"ADMIN"})
    void getTasks_shouldPaginateAndSort() throws Exception {
        taskRepository.save(Task.builder()
                .title("Zulu Task")
                .description("Later")
                .status(TaskStatus.TODO)
                .priority(TaskPriority.LOW)
                .project(project)
                .assignee(user)
                .build());
        taskRepository.save(Task.builder()
                .title("Alpha Task")
                .description("Earlier")
                .status(TaskStatus.TODO)
                .priority(TaskPriority.LOW)
                .project(project)
                .assignee(user)
                .build());

        mockMvc.perform(get("/api/tasks")
                        .param("page", "0")
                        .param("size", "1")
                        .param("sortBy", "title")
                        .param("sortDir", "asc"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.totalPages").value(2))
                .andExpect(jsonPath("$.content[0].title").value("Alpha Task"));
    }

    @Test
    @WithMockUser(username = "tester@example.com", roles = {"ADMIN"})
    void deleteTask_shouldRemoveTask() throws Exception {
        Task savedTask = taskRepository.save(Task.builder()
                .title("Delete Me")
                .description("Task to delete")
                .status(TaskStatus.TODO)
                .priority(TaskPriority.LOW)
                .project(project)
                .assignee(user)
                .build());

        mockMvc.perform(delete("/api/tasks/{id}", savedTask.getId()))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/tasks/{id}", savedTask.getId()))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(username = "tester@example.com", roles = {"ADMIN"})
    void addProjectMember_shouldReturnCreatedMembership() throws Exception {
        ProjectMemberRequest request = ProjectMemberRequest.builder()
                .projectId(project.getId())
                .userId(user.getId())
                .allocationPercentage(75)
                .build();

        mockMvc.perform(post("/api/project-members")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.projectId").value(project.getId()))
                .andExpect(jsonPath("$.userId").value(user.getId()))
                .andExpect(jsonPath("$.allocationPercentage").value(75));
    }

    @Test
    @WithMockUser(username = "tester@example.com", roles = {"ADMIN"})
    void addProjectMember_shouldRejectDuplicateMembership() throws Exception {
        projectMemberRepository.save(com.example.demo.model.ProjectMember.builder()
                .project(project)
                .user(user)
                .allocationPercentage(50)
                .build());

        ProjectMemberRequest request = ProjectMemberRequest.builder()
                .projectId(project.getId())
                .userId(user.getId())
                .allocationPercentage(75)
                .build();

        mockMvc.perform(post("/api/project-members")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("User is already assigned to this project"));
    }

    @Test
    @WithMockUser(username = "tester@example.com", roles = {"ADMIN"})
    void updateProjectMember_shouldPersistChanges() throws Exception {
        var savedMember = projectMemberRepository.save(com.example.demo.model.ProjectMember.builder()
                .project(project)
                .user(user)
                .allocationPercentage(40)
                .build());

        ProjectMemberRequest request = ProjectMemberRequest.builder()
                .projectId(project.getId())
                .userId(user.getId())
                .allocationPercentage(90)
                .role(com.example.demo.model.ProjectMemberRole.OWNER)
                .build();

        mockMvc.perform(put("/api/project-members/{id}", savedMember.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.allocationPercentage").value(90))
                .andExpect(jsonPath("$.role").value("OWNER"));
    }

    @Test
    @WithMockUser(username = "tester@example.com", roles = {"ADMIN"})
    void deleteProjectMember_shouldRemoveMembership() throws Exception {
        var savedMember = projectMemberRepository.save(com.example.demo.model.ProjectMember.builder()
                .project(project)
                .user(user)
                .allocationPercentage(40)
                .build());

        mockMvc.perform(delete("/api/project-members/{id}", savedMember.getId()))
                .andExpect(status().isNoContent());
    }

    @Test
    @WithMockUser(username = "tester@example.com", roles = {"ADMIN"})
    void getDashboard_shouldReturnSummaryMetrics() throws Exception {
        taskRepository.save(Task.builder()
                .title("Done Task")
                .description("Completed work")
                .status(TaskStatus.DONE)
                .priority(TaskPriority.MEDIUM)
                .project(project)
                .assignee(user)
                .estimatedHours(4)
                .actualHours(4)
                .build());

        mockMvc.perform(get("/api/dashboard"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalProjects").value(1))
                .andExpect(jsonPath("$.totalTasks").value(1))
                .andExpect(jsonPath("$.completedTasks").value(1))
                .andExpect(jsonPath("$.projects[0].projectName").value("Initial Project"));
    }

    @Test
    @WithMockUser(username = "tester@example.com", roles = {"ADMIN"})
    void calculateProjectHealth_shouldReturnScores() throws Exception {
        taskRepository.save(Task.builder()
                .title("Late Task")
                .description("Overdue task")
                .status(TaskStatus.IN_PROGRESS)
                .priority(TaskPriority.HIGH)
                .project(project)
                .assignee(user)
                .startDate(LocalDate.of(2026, 4, 1))
                .dueDate(LocalDate.now().minusDays(1))
                .estimatedHours(6)
                .actualHours(5)
                .build());

        mockMvc.perform(get("/api/dashboard/projects/{projectId}/health", project.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.projectId").value(project.getId()))
                .andExpect(jsonPath("$.overallScore").isNumber())
                .andExpect(jsonPath("$.delayScore").isNumber())
                .andExpect(jsonPath("$.progressScore").value(35));
    }

    @Test
    @WithMockUser(username = "tester@example.com", roles = {"ADMIN"})
    void createSprint_shouldReturnPlannedSprint() throws Exception {
        SprintRequest request = SprintRequest.builder()
                .name("Sprint 1")
                .goal("Deliver project planning slice")
                .startDate(LocalDate.of(2026, 5, 18))
                .endDate(LocalDate.of(2026, 5, 31))
                .capacityPoints(20)
                .build();

        mockMvc.perform(post("/api/projects/{projectId}/sprints", project.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.projectId").value(project.getId()))
                .andExpect(jsonPath("$.name").value("Sprint 1"))
                .andExpect(jsonPath("$.status").value("PLANNED"))
                .andExpect(jsonPath("$.capacityPoints").value(20));
    }

    @Test
    @WithMockUser(username = "tester@example.com", roles = {"ADMIN"})
    void scrumBoard_shouldExposeActiveSprintAndAssignedTasks() throws Exception {
        Sprint sprint = sprintRepository.save(Sprint.builder()
                .project(project)
                .name("Sprint Board")
                .goal("Move backlog into delivery")
                .startDate(LocalDate.now().minusDays(1))
                .endDate(LocalDate.now().plusDays(12))
                .capacityPoints(13)
                .status(SprintStatus.PLANNED)
                .build());

        Task task = taskRepository.save(Task.builder()
                .title("Scrum task")
                .description("Task for sprint assignment")
                .status(TaskStatus.TODO)
                .priority(TaskPriority.HIGH)
                .storyPoints(5)
                .backlogRank(1)
                .project(project)
                .assignee(user)
                .build());

        mockMvc.perform(put("/api/sprints/{sprintId}/start", sprint.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"));

        mockMvc.perform(put("/api/sprints/{sprintId}/tasks/{taskId}", sprint.getId(), task.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sprintId").value(sprint.getId()))
                .andExpect(jsonPath("$.storyPoints").value(5));

        mockMvc.perform(get("/api/projects/{projectId}/scrum", project.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.activeSprint.id").value(sprint.getId()))
                .andExpect(jsonPath("$.activeSprintTasks.length()").value(1))
                .andExpect(jsonPath("$.activeSprintTasks[0].title").value("Scrum task"))
                .andExpect(jsonPath("$.metrics.activeCommittedPoints").value(5))
                .andExpect(jsonPath("$.metrics.activeCapacityPoints").value(13));
    }

    @Test
    @WithMockUser(username = "tester@example.com", roles = {"ADMIN"})
    void updateTaskScrum_shouldPersistPlanningFields() throws Exception {
        Task task = taskRepository.save(Task.builder()
                .title("Estimate me")
                .description("Task needing scrum metadata")
                .status(TaskStatus.TODO)
                .priority(TaskPriority.MEDIUM)
                .project(project)
                .assignee(user)
                .build());

        TaskScrumUpdateRequest request = TaskScrumUpdateRequest.builder()
                .storyPoints(8)
                .backlogRank(2)
                .acceptanceCriteria("Done when criteria are verified")
                .build();

        mockMvc.perform(put("/api/tasks/{taskId}/scrum", task.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.storyPoints").value(8))
                .andExpect(jsonPath("$.backlogRank").value(2))
                .andExpect(jsonPath("$.acceptanceCriteria").value("Done when criteria are verified"));
    }

    @Test
    @WithMockUser(username = "employee@example.com", roles = {"EMPLOYEE"})
    void employeeViews_shouldOnlyExposeAssignedWork() throws Exception {
        User employee = userRepository.save(User.builder()
                .firstName("Ema")
                .lastName("Employee")
                .email("employee@example.com")
                .password("encoded")
                .role(Role.EMPLOYEE)
                .provider(AuthProvider.LOCAL)
                .enabled(true)
                .build());

        Project hiddenProject = projectRepository.save(Project.builder()
                .name("Hidden Project")
                .description("Not visible to employee")
                .status(ProjectStatus.ACTIVE)
                .startDate(LocalDate.of(2026, 5, 1))
                .endDate(LocalDate.of(2026, 6, 1))
                .progressPercentage(10)
                .build());

        projectMemberRepository.save(ProjectMember.builder()
                .project(project)
                .user(employee)
                .role(ProjectMemberRole.CONTRIBUTOR)
                .allocationPercentage(80)
                .build());

        taskRepository.save(Task.builder()
                .title("Employee assigned task")
                .description("Visible task")
                .status(TaskStatus.IN_PROGRESS)
                .priority(TaskPriority.HIGH)
                .project(project)
                .assignee(employee)
                .build());

        taskRepository.save(Task.builder()
                .title("Manager-only task")
                .description("Same project but assigned elsewhere")
                .status(TaskStatus.TODO)
                .priority(TaskPriority.MEDIUM)
                .project(project)
                .assignee(user)
                .build());

        taskRepository.save(Task.builder()
                .title("Hidden project task")
                .description("Different project")
                .status(TaskStatus.TODO)
                .priority(TaskPriority.MEDIUM)
                .project(hiddenProject)
                .assignee(user)
                .build());

        mockMvc.perform(get("/api/projects"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].name").value("Initial Project"));

        mockMvc.perform(get("/api/tasks"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].title").value("Employee assigned task"));

        mockMvc.perform(get("/api/dashboard"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalProjects").value(1))
                .andExpect(jsonPath("$.totalTasks").value(1))
                .andExpect(jsonPath("$.totalUsers").value(1));
    }

    @Test
    @WithMockUser(username = "employee@example.com", roles = {"EMPLOYEE"})
    void employeeWrites_shouldBeForbiddenForProjectManagement() throws Exception {
        userRepository.save(User.builder()
                .firstName("Ema")
                .lastName("Employee")
                .email("employee@example.com")
                .password("encoded")
                .role(Role.EMPLOYEE)
                .provider(AuthProvider.LOCAL)
                .enabled(true)
                .build());

        ProjectRequest request = ProjectRequest.builder()
                .name("Employee Project")
                .description("Should not be created")
                .status(ProjectStatus.ACTIVE)
                .progressPercentage(0)
                .build();

        mockMvc.perform(post("/api/projects")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/budget"))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/users"))
                .andExpect(status().isForbidden());
    }
}
