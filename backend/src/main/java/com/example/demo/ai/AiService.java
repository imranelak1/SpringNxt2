package com.example.demo.ai;

import com.example.demo.dto.AiChatResponse;
import com.example.demo.dto.AiInsightsResponse;
import com.example.demo.dto.ProjectSimulationRequest;
import com.example.demo.dto.ProjectSimulationResponse;
import com.example.demo.model.Project;
import com.example.demo.model.Role;
import com.example.demo.repository.ProjectRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiService {

    private final LlmClient llmClient;
    private final AiContextBuilder contextBuilder;
    private final ProjectRepository projectRepository;
    private final ObjectMapper objectMapper;

    private static final String SYSTEM_BASE = """
            Tu es NEXUS-IA, l'assistant intelligent du système de gestion de projets NEXUS.
            Tu analyses les données réelles du projet et fournis des insights précis, des recommandations
            et des réponses contextualisées. Réponds toujours en français, de façon concise et professionnelle.
            Ne fais jamais référence au fait que tu es une IA ou un LLM — parle simplement en tant qu'assistant NEXUS.
            """;

    // ── Chat (assistant conversationnel) ────────────────────────────────────

    public AiChatResponse ask(String question, String userEmail, Role userRole) {
        if (!llmClient.isConfigured()) {
            return new AiChatResponse(fallbackUnavailable(), false);
        }
        try {
            String context = contextBuilder.build(userEmail, userRole);
            String system = SYSTEM_BASE + "\n\nDonnées du projet en temps réel :\n" + context;
            String answer = llmClient.complete(system, question);
            return new AiChatResponse(answer, true);
        } catch (Exception e) {
            log.error("AI ask failed: {}", e.getMessage());
            return new AiChatResponse("Désolé, une erreur s'est produite. Réessayez dans un instant.", false);
        }
    }

    // ── Insights (tableau de bord, rapports) ────────────────────────────────

    public AiInsightsResponse getInsights(String userEmail, Role userRole) {
        if (!llmClient.isConfigured()) {
            return new AiInsightsResponse(fallbackInsights(), false);
        }
        try {
            String context = contextBuilder.build(userEmail, userRole);
            String system = SYSTEM_BASE;
            String prompt = """
                    Voici les données actuelles du portfolio de projets :

                    %s

                    Génère exactement 4 insights pertinents sur l'état du portfolio.
                    Chaque insight doit être une phrase courte (max 2 lignes), factuelle, basée sur les données.
                    Retourne uniquement les 4 insights, un par ligne, sans numérotation ni tirets.
                    """.formatted(context);

            String raw = llmClient.complete(system, prompt, 512);
            List<String> insights = Arrays.stream(raw.split("\n"))
                    .map(String::trim)
                    .filter(s -> !s.isBlank())
                    .limit(4)
                    .collect(Collectors.toList());
            return new AiInsightsResponse(insights, true);
        } catch (Exception e) {
            log.error("AI insights failed: {}", e.getMessage());
            return new AiInsightsResponse(fallbackInsights(), false);
        }
    }

    // ── Task decomposition ───────────────────────────────────────────────────

    public AiChatResponse decomposeTasks(String goal, Long projectId, String userEmail, Role userRole) {
        if (!llmClient.isConfigured()) {
            return new AiChatResponse(fallbackUnavailable(), false);
        }
        try {
            String projectContext = "";
            if (projectId != null) {
                projectContext = projectRepository.findById(projectId)
                        .map(p -> "Projet cible : " + p.getName() + " (" + p.getStatus() + ", " + p.getProgressPercentage() + "% avancement)\n")
                        .orElse("");
            }

            String system = SYSTEM_BASE;
            String prompt = """
                    %s
                    L'utilisateur souhaite décomposer cet objectif en tâches concrètes :
                    "%s"

                    Génère une liste de 4 à 8 tâches actionables pour atteindre cet objectif.
                    Chaque tâche doit être sur une ligne séparée, sous forme de titre court et clair (max 80 caractères).
                    Retourne uniquement les tâches, une par ligne, sans numérotation ni tirets.
                    """.formatted(projectContext, goal);

            String raw = llmClient.complete(system, prompt, 512);
            return new AiChatResponse(raw.trim(), true);
        } catch (Exception e) {
            log.error("AI decompose failed: {}", e.getMessage());
            return new AiChatResponse("Impossible de décomposer l'objectif pour le moment. Réessayez.", false);
        }
    }

    // ── Project risk analysis ────────────────────────────────────────────────

    public AiChatResponse analyzeRisk(Long projectId, String userEmail, Role userRole) {
        if (!llmClient.isConfigured()) {
            return new AiChatResponse(fallbackUnavailable(), false);
        }
        try {
            Project project = projectRepository.findById(projectId)
                    .orElseThrow(() -> new IllegalArgumentException("Project not found"));

            String context = contextBuilder.build(userEmail, userRole);
            String system = SYSTEM_BASE;
            String prompt = """
                    Voici les données du portfolio :
                    %s

                    Analyse le risque spécifique au projet "%s" et fournis :
                    1. Le niveau de risque global (Faible / Moyen / Élevé / Critique)
                    2. Les 3 principaux facteurs de risque identifiés
                    3. Une recommandation concrète pour mitiger le risque principal

                    Sois direct et factuel. Réponds en français.
                    """.formatted(context, project.getName());

            String raw = llmClient.complete(system, prompt, 768);
            return new AiChatResponse(raw.trim(), true);
        } catch (Exception e) {
            log.error("AI risk analysis failed: {}", e.getMessage());
            return new AiChatResponse("Analyse de risque indisponible pour le moment.", false);
        }
    }

    // ── Project simulation ───────────────────────────────────────────────────

    public ProjectSimulationResponse simulateProject(ProjectSimulationRequest request) {
        if (!llmClient.isConfigured()) {
            throw new IllegalStateException("GROQ_API_KEY is not configured.");
        }

        String budgetStr = request.getBudget() != null ? request.getBudget().toPlainString() + " MAD" : "non spécifié";
        String durationStr = request.getDuration() != null ? request.getDuration() : "non spécifié";
        String teamStr = request.getTeamSize() != null ? request.getTeamSize() + " personnes" : "non spécifié";

        String system = """
                Tu es un expert en gestion de projet avec 20 ans d'expérience.
                Tu dois simuler un plan de projet complet et réaliste basé sur la description de l'utilisateur.
                Réponds UNIQUEMENT avec un objet JSON valide, sans markdown, sans explication, sans commentaires.
                """;

        String prompt = """
                Simule un plan de projet complet pour la description suivante :
                "%s"

                Contraintes : budget=%s | durée=%s | équipe=%s

                Retourne EXACTEMENT ce JSON (sans aucun texte avant ou après) :
                {
                  "projectName": "string",
                  "description": "string (2-3 phrases concises)",
                  "estimatedWeeks": number,
                  "totalBudget": number,
                  "confidence": "LOW|MEDIUM|HIGH",
                  "phases": [
                    {
                      "name": "string",
                      "weeks": number,
                      "tasks": [
                        {"title": "string", "priority": "LOW|MEDIUM|HIGH|CRITICAL", "estimatedHours": number, "role": "string"}
                      ]
                    }
                  ],
                  "budgetBreakdown": [
                    {"category": "string", "amount": number, "percentage": number}
                  ],
                  "teamRoles": [
                    {"role": "string", "count": number, "allocationPercentage": number}
                  ],
                  "risks": [
                    {"level": "LOW|MEDIUM|HIGH|CRITICAL", "title": "string", "description": "string"}
                  ],
                  "keyInsights": ["string", "string", "string"]
                }
                """.formatted(request.getDescription(), budgetStr, durationStr, teamStr);

        try {
            String raw = llmClient.complete(system, prompt, 2048);
            String json = extractJson(raw);
            JsonNode root = objectMapper.readTree(json);

            // Phases
            List<ProjectSimulationResponse.SimPhase> phases = new ArrayList<>();
            for (JsonNode p : iterArray(root.path("phases"))) {
                List<ProjectSimulationResponse.SimTask> tasks = new ArrayList<>();
                for (JsonNode t : iterArray(p.path("tasks"))) {
                    tasks.add(ProjectSimulationResponse.SimTask.builder()
                            .title(t.path("title").asText("Tâche"))
                            .priority(t.path("priority").asText("MEDIUM"))
                            .estimatedHours(t.path("estimatedHours").asInt(8))
                            .role(t.path("role").asText(""))
                            .build());
                }
                phases.add(ProjectSimulationResponse.SimPhase.builder()
                        .name(p.path("name").asText("Phase"))
                        .weeks(p.path("weeks").asInt(2))
                        .tasks(tasks)
                        .build());
            }

            // Budget breakdown
            List<ProjectSimulationResponse.SimBudgetItem> budgetItems = new ArrayList<>();
            for (JsonNode b : iterArray(root.path("budgetBreakdown"))) {
                budgetItems.add(ProjectSimulationResponse.SimBudgetItem.builder()
                        .category(b.path("category").asText("Poste"))
                        .amount(safeDecimal(b.path("amount")))
                        .percentage(b.path("percentage").asInt(0))
                        .build());
            }

            // Team roles
            List<ProjectSimulationResponse.SimTeamRole> teamRoles = new ArrayList<>();
            for (JsonNode r : iterArray(root.path("teamRoles"))) {
                teamRoles.add(ProjectSimulationResponse.SimTeamRole.builder()
                        .role(r.path("role").asText("Membre"))
                        .count(r.path("count").asInt(1))
                        .allocationPercentage(r.path("allocationPercentage").asInt(100))
                        .build());
            }

            // Risks
            List<ProjectSimulationResponse.SimRisk> risks = new ArrayList<>();
            for (JsonNode r : iterArray(root.path("risks"))) {
                risks.add(ProjectSimulationResponse.SimRisk.builder()
                        .level(r.path("level").asText("MEDIUM"))
                        .title(r.path("title").asText("Risque"))
                        .description(r.path("description").asText(""))
                        .build());
            }

            // Key insights
            List<String> insights = new ArrayList<>();
            for (JsonNode i : iterArray(root.path("keyInsights"))) {
                insights.add(i.asText(""));
            }

            BigDecimal totalBudget = root.path("totalBudget").isMissingNode() || root.path("totalBudget").isNull()
                    ? (request.getBudget() != null ? request.getBudget() : BigDecimal.ZERO)
                    : safeDecimal(root.path("totalBudget"));

            return ProjectSimulationResponse.builder()
                    .projectName(root.path("projectName").asText("Projet simulé"))
                    .description(root.path("description").asText(""))
                    .estimatedWeeks(root.path("estimatedWeeks").asInt(8))
                    .totalBudget(totalBudget)
                    .confidence(root.path("confidence").asText("MEDIUM"))
                    .phases(phases)
                    .budgetBreakdown(budgetItems)
                    .teamRoles(teamRoles)
                    .risks(risks)
                    .keyInsights(insights)
                    .build();

        } catch (Exception e) {
            log.error("Project simulation failed", e);
            throw new IllegalStateException("La simulation a échoué : " + e.getMessage(), e);
        }
    }

    private String extractJson(String raw) {
        String s = raw.trim();
        if (s.startsWith("```json")) s = s.substring(7);
        else if (s.startsWith("```")) s = s.substring(3);
        if (s.endsWith("```")) s = s.substring(0, s.length() - 3);
        int start = s.indexOf('{');
        int end = s.lastIndexOf('}');
        if (start >= 0 && end > start) return s.substring(start, end + 1);
        return s.trim();
    }

    private Iterable<JsonNode> iterArray(JsonNode node) {
        if (node == null || node.isMissingNode() || !node.isArray()) return List.of();
        return node;
    }

    private BigDecimal safeDecimal(JsonNode node) {
        if (node == null || node.isMissingNode() || node.isNull()) return BigDecimal.ZERO;
        try { return new BigDecimal(node.asText("0")); } catch (NumberFormatException e) { return BigDecimal.ZERO; }
    }

    // ── Fallbacks ────────────────────────────────────────────────────────────

    private String fallbackUnavailable() {
        return "L'assistant IA n'est pas disponible. Configurez la variable d'environnement GROQ_API_KEY et redémarrez le backend.";
    }

    private List<String> fallbackInsights() {
        return List.of(
                "Configurez GROQ_API_KEY pour activer les insights IA en temps réel.",
                "Une fois configuré, NEXUS-IA analysera automatiquement vos projets et budgets.",
                "L'assistant conversationnel sera disponible pour répondre à vos questions métier.",
                "La décomposition automatique de tâches sera également activée."
        );
    }
}
