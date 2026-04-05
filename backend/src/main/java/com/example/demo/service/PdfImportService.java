package com.example.demo.service;

import com.example.demo.dto.*;
import com.example.demo.model.Project;
import com.example.demo.model.ProjectStatus;
import com.example.demo.model.Task;
import com.example.demo.model.TaskPriority;
import com.example.demo.model.TaskStatus;
import com.example.demo.repository.ProjectRepository;
import com.example.demo.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class PdfImportService {

    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;

    @Transactional(readOnly = true)
    public PdfImportAnalysisResponse analyze(MultipartFile file) {
        String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "uploaded-document.pdf";
        String baseName = originalName.replaceFirst("\\.[^.]+$", "");
        String projectName = prettifyProjectName(baseName);
        LocalDate startDate = LocalDate.now().plusDays(3);
        LocalDate endDate = startDate.plusDays(60);

        List<PdfImportEntityResponse> entities = new ArrayList<>();
        entities.add(PdfImportEntityResponse.builder()
                .type("project")
                .label("Project name")
                .value(projectName)
                .sub("Generated from uploaded file name")
                .editable(true)
                .build());
        entities.add(PdfImportEntityResponse.builder()
                .type("date")
                .label("Start date")
                .value(startDate.toString())
                .sub("Suggested import kickoff date")
                .editable(true)
                .build());
        entities.add(PdfImportEntityResponse.builder()
                .type("date")
                .label("End date")
                .value(endDate.toString())
                .sub("Estimated delivery window")
                .editable(true)
                .build());
        entities.add(PdfImportEntityResponse.builder()
                .type("member")
                .label("Suggested owner")
                .value("manager@springnxt.local")
                .sub("Suggested from seeded manager account")
                .editable(true)
                .build());

        for (String taskTitle : suggestTasks(projectName)) {
            entities.add(PdfImportEntityResponse.builder()
                    .type("task")
                    .label("Suggested task")
                    .value(taskTitle)
                    .sub("Imported from PDF analysis template")
                    .editable(true)
                    .build());
        }

        return PdfImportAnalysisResponse.builder()
                .fileName(originalName)
                .projectName(projectName)
                .description("Imported from PDF: " + originalName)
                .startDate(startDate)
                .endDate(endDate)
                .entities(entities)
                .build();
    }

    @Transactional
    public PdfImportCreateResponse createProjectFromImport(PdfImportCreateRequest request) {
        Project project = Project.builder()
                .name(request.getProjectName())
                .description(request.getDescription())
                .status(ProjectStatus.PLANNING)
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .progressPercentage(0)
                .build();

        Project savedProject = projectRepository.save(project);

        List<String> tasks = request.getTasks() != null ? request.getTasks() : List.of();
        int createdTaskCount = 0;

        for (String taskTitle : tasks) {
            if (taskTitle == null || taskTitle.isBlank()) {
                continue;
            }

            Task task = Task.builder()
                    .title(taskTitle.trim())
                    .description("Imported from PDF workflow")
                    .status(TaskStatus.TODO)
                    .priority(TaskPriority.MEDIUM)
                    .startDate(request.getStartDate())
                    .dueDate(request.getEndDate())
                    .project(savedProject)
                    .build();

            taskRepository.save(task);
            createdTaskCount++;
        }

        return PdfImportCreateResponse.builder()
                .projectId(savedProject.getId())
                .projectName(savedProject.getName())
                .taskCount(createdTaskCount)
                .build();
    }

    private String prettifyProjectName(String rawName) {
        String cleaned = rawName.replaceAll("[-_]+", " ").trim();
        if (cleaned.isBlank()) {
            return "Imported Project";
        }

        String[] parts = cleaned.split("\\s+");
        StringBuilder builder = new StringBuilder();

        for (int i = 0; i < parts.length; i++) {
            if (i > 0) {
                builder.append(' ');
            }
            String part = parts[i].toLowerCase(Locale.ROOT);
            builder.append(Character.toUpperCase(part.charAt(0))).append(part.substring(1));
        }

        return builder.toString();
    }

    private List<String> suggestTasks(String projectName) {
        return List.of(
                "Review imported scope for " + projectName,
                "Prepare timeline and milestone breakdown",
                "Create delivery tasks and assign ownership",
                "Run stakeholder validation and kickoff"
        );
    }
}
