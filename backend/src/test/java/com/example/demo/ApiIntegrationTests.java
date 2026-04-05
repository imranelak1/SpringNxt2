package com.example.demo;

import com.example.demo.dto.ProjectMemberRequest;
import com.example.demo.dto.ProjectRequest;
import com.example.demo.dto.TaskRequest;
import com.example.demo.model.AuthProvider;
import com.example.demo.model.Project;
import com.example.demo.model.ProjectStatus;
import com.example.demo.model.Role;
import com.example.demo.model.Task;
import com.example.demo.model.TaskPriority;
import com.example.demo.model.TaskStatus;
import com.example.demo.model.User;
import com.example.demo.repository.ProjectMemberRepository;
import com.example.demo.repository.ProjectRepository;
import com.example.demo.repository.TaskRepository;
import com.example.demo.repository.UserRepository;
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

    private Project project;
    private User user;

    @BeforeEach
    void setUp() {
        projectMemberRepository.deleteAll();
        taskRepository.deleteAll();
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
    @WithMockUser(roles = {"ADMIN"})
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
    @WithMockUser(roles = {"ADMIN"})
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
    @WithMockUser(roles = {"ADMIN"})
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
    @WithMockUser(roles = {"ADMIN"})
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
    @WithMockUser(roles = {"ADMIN"})
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
    @WithMockUser(roles = {"ADMIN"})
    void deleteProject_shouldRemoveProject() throws Exception {
        mockMvc.perform(delete("/api/projects/{id}", project.getId()))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/projects/{id}", project.getId()))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(roles = {"ADMIN"})
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
    @WithMockUser(roles = {"ADMIN"})
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
    @WithMockUser(roles = {"ADMIN"})
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
    @WithMockUser(roles = {"ADMIN"})
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
    @WithMockUser(roles = {"ADMIN"})
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
    @WithMockUser(roles = {"ADMIN"})
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
    @WithMockUser(roles = {"ADMIN"})
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
    @WithMockUser(roles = {"ADMIN"})
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
    @WithMockUser(roles = {"ADMIN"})
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
    @WithMockUser(roles = {"ADMIN"})
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
    @WithMockUser(roles = {"ADMIN"})
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
    @WithMockUser(roles = {"ADMIN"})
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
}
