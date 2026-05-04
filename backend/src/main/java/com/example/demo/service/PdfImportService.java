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
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class PdfImportService {

    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;

    private static final Pattern DATE_PATTERN = Pattern.compile(
            "\\b(\\d{1,2}[/\\-.]\\d{1,2}[/\\-.]\\d{2,4}|\\d{4}[/\\-.]\\d{1,2}[/\\-.]\\d{1,2})\\b");

    private static final Pattern TASK_LINE_PATTERN = Pattern.compile(
            "^\\s*(?:[•\\-*>]|\\d+[.)])\\s+(.+)$");

    private static final Pattern ACTION_VERB_PATTERN = Pattern.compile(
            "^\\s*(Créer|Créez|Préparer|Préparez|Développer|Développez|Analyser|Analysez|" +
            "Tester|Testez|Valider|Validez|Configurer|Configurez|Rédiger|Rédigez|" +
            "Implémenter|Implémentez|Livrer|Livrez|Définir|Définissez|" +
            "Create|Prepare|Develop|Analyse|Analyze|Test|Validate|Configure|" +
            "Write|Implement|Deliver|Define|Review|Setup|Deploy|Design|Build)\\b.+",
            Pattern.CASE_INSENSITIVE);

    @Transactional(readOnly = true)
    public PdfImportAnalysisResponse analyze(MultipartFile file) {
        String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "document.pdf";
        String baseName = originalName.replaceFirst("\\.[^.]+$", "");

        String pdfText = extractText(file);
        String projectName = deriveProjectName(pdfText, baseName);
        String description = deriveDescription(pdfText, originalName);
        LocalDate[] dates = extractDates(pdfText);
        List<String> tasks = extractTasks(pdfText, projectName);

        List<PdfImportEntityResponse> entities = new ArrayList<>();
        entities.add(PdfImportEntityResponse.builder()
                .type("project").label("Nom du projet").value(projectName)
                .sub("Extrait du contenu PDF").editable(true).build());
        entities.add(PdfImportEntityResponse.builder()
                .type("date").label("Date de début").value(dates[0].toString())
                .sub("Détectée dans le document").editable(true).build());
        entities.add(PdfImportEntityResponse.builder()
                .type("date").label("Date de fin").value(dates[1].toString())
                .sub("Détectée dans le document").editable(true).build());

        for (String task : tasks) {
            entities.add(PdfImportEntityResponse.builder()
                    .type("task").label("Tâche suggérée").value(task)
                    .sub("Extraite du document").editable(true).build());
        }

        return PdfImportAnalysisResponse.builder()
                .fileName(originalName)
                .projectName(projectName)
                .description(description)
                .startDate(dates[0])
                .endDate(dates[1])
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

        Project saved = projectRepository.save(project);
        List<String> tasks = request.getTasks() != null ? request.getTasks() : List.of();
        int count = 0;

        for (String title : tasks) {
            if (title == null || title.isBlank()) continue;
            taskRepository.save(Task.builder()
                    .title(title.trim())
                    .description("Importé depuis PDF")
                    .status(TaskStatus.TODO)
                    .priority(TaskPriority.MEDIUM)
                    .startDate(request.getStartDate())
                    .dueDate(request.getEndDate())
                    .project(saved)
                    .build());
            count++;
        }

        return PdfImportCreateResponse.builder()
                .projectId(saved.getId())
                .projectName(saved.getName())
                .taskCount(count)
                .build();
    }

    // ── Text extraction ──────────────────────────────────────────────────────

    private String extractText(MultipartFile file) {
        try {
            byte[] bytes = file.getBytes();
            try (PDDocument doc = Loader.loadPDF(bytes)) {
                PDFTextStripper stripper = new PDFTextStripper();
                return stripper.getText(doc);
            }
        } catch (IOException e) {
            return "";
        }
    }

    // ── Project name ─────────────────────────────────────────────────────────

    private String deriveProjectName(String text, String fallback) {
        if (text.isBlank()) return prettify(fallback);

        String[] lines = text.split("\\r?\\n");
        // Use the first non-trivial line (length 5–80) as the title
        for (String line : lines) {
            String trimmed = line.trim();
            if (trimmed.length() >= 5 && trimmed.length() <= 80
                    && !trimmed.matches("^[\\d\\s/\\-.:]+$")) {
                return capitalizeFirst(trimmed);
            }
        }
        return prettify(fallback);
    }

    // ── Description ──────────────────────────────────────────────────────────

    private String deriveDescription(String text, String fileName) {
        if (text.isBlank()) return "Importé depuis PDF : " + fileName;

        String[] lines = text.split("\\r?\\n");
        StringBuilder sb = new StringBuilder();
        int collected = 0;
        boolean skippedTitle = false;

        for (String line : lines) {
            String trimmed = line.trim();
            if (trimmed.isBlank()) continue;
            if (!skippedTitle) { skippedTitle = true; continue; } // skip first (title) line
            if (trimmed.length() < 10) continue;
            sb.append(trimmed).append(' ');
            if (++collected >= 3) break;
        }

        String desc = sb.toString().trim();
        return desc.isEmpty() ? "Importé depuis PDF : " + fileName : desc;
    }

    // ── Date extraction ───────────────────────────────────────────────────────

    private LocalDate[] extractDates(String text) {
        List<LocalDate> found = new ArrayList<>();
        Matcher m = DATE_PATTERN.matcher(text);

        List<DateTimeFormatter> formatters = List.of(
                DateTimeFormatter.ofPattern("dd/MM/yyyy"),
                DateTimeFormatter.ofPattern("d/M/yyyy"),
                DateTimeFormatter.ofPattern("dd-MM-yyyy"),
                DateTimeFormatter.ofPattern("d-M-yyyy"),
                DateTimeFormatter.ofPattern("yyyy-MM-dd"),
                DateTimeFormatter.ofPattern("yyyy/MM/dd"),
                DateTimeFormatter.ofPattern("dd.MM.yyyy"));

        while (m.find() && found.size() < 2) {
            String raw = m.group().replaceAll("[./]", "-");
            for (DateTimeFormatter fmt : formatters) {
                try {
                    found.add(LocalDate.parse(m.group(), fmt));
                    break;
                } catch (DateTimeParseException ignored) {}
            }
        }

        LocalDate start = found.size() > 0 ? found.get(0) : LocalDate.now().plusDays(3);
        LocalDate end   = found.size() > 1 ? found.get(1) : start.plusDays(60);
        if (!end.isAfter(start)) end = start.plusDays(60);
        return new LocalDate[]{start, end};
    }

    // ── Task extraction ───────────────────────────────────────────────────────

    private List<String> extractTasks(String text, String projectName) {
        List<String> tasks = new ArrayList<>();
        if (text.isBlank()) return fallbackTasks(projectName);

        String[] lines = text.split("\\r?\\n");
        for (String line : lines) {
            if (tasks.size() >= 8) break;

            Matcher bullet = TASK_LINE_PATTERN.matcher(line);
            if (bullet.matches()) {
                String candidate = bullet.group(1).trim();
                if (candidate.length() >= 5 && candidate.length() <= 120) {
                    tasks.add(capitalizeFirst(candidate));
                    continue;
                }
            }

            if (ACTION_VERB_PATTERN.matcher(line).matches()) {
                String candidate = line.trim();
                if (candidate.length() >= 5 && candidate.length() <= 120) {
                    tasks.add(capitalizeFirst(candidate));
                }
            }
        }

        return tasks.isEmpty() ? fallbackTasks(projectName) : tasks;
    }

    private List<String> fallbackTasks(String projectName) {
        return List.of(
                "Analyser le périmètre de " + projectName,
                "Préparer le planning et les jalons",
                "Créer les tâches de livraison et assigner les responsables",
                "Valider avec les parties prenantes et lancer le projet");
    }

    // ── Utilities ─────────────────────────────────────────────────────────────

    private String prettify(String raw) {
        String cleaned = raw.replaceAll("[-_]+", " ").trim();
        if (cleaned.isBlank()) return "Projet importé";
        String[] parts = cleaned.split("\\s+");
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < parts.length; i++) {
            if (i > 0) sb.append(' ');
            String p = parts[i].toLowerCase(Locale.ROOT);
            sb.append(Character.toUpperCase(p.charAt(0))).append(p.substring(1));
        }
        return sb.toString();
    }

    private String capitalizeFirst(String s) {
        if (s == null || s.isEmpty()) return s;
        return Character.toUpperCase(s.charAt(0)) + s.substring(1);
    }
}
