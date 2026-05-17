package com.example.demo.ai;

import com.example.demo.dto.AiChatResponse;
import com.example.demo.dto.AiInsightsResponse;
import com.example.demo.dto.ProjectSimulationRequest;
import com.example.demo.dto.ProjectSimulationResponse;
import com.example.demo.model.Role;
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
    private final ObjectMapper objectMapper;

    private static final String SYSTEM_BASE = """
            Tu es NEXUS-IA, assistant d'analyse projet de SpringNxt.
            Tu utilises uniquement les donnees fournies dans le contexte.
            Chaque reponse doit citer des chiffres, projets, taches ou signaux presents dans le contexte quand c'est possible.
            Si les donnees sont insuffisantes, dis clairement ce qui manque au lieu d'inventer.
            Reponds en francais, avec un style direct, operationnel et non generique.
            """;

    public AiChatResponse ask(String question, String userEmail, Role userRole) {
        if (!llmClient.isConfigured()) {
            return new AiChatResponse(fallbackUnavailable(), false);
        }
        try {
            String context = contextBuilder.build(userEmail, userRole);
            String system = SYSTEM_BASE + "\n\nCONTEXTE TEMPS REEL:\n" + context;
            String prompt = """
                    QUESTION UTILISATEUR:
                    %s

                    CONSIGNES:
                    - Appuie la reponse sur les projets, taches, budgets et signaux calcules du contexte.
                    - Priorise les anomalies concretes: retard, blocage, budget, taches critiques, echeances proches.
                    - Termine par 1 a 3 actions recommandees si la question appelle une decision.
                    - Ne donne pas de conseil generique sans lien avec les donnees.
                    """.formatted(question);

            String answer = llmClient.complete(system, prompt, 900);
            return new AiChatResponse(answer, true);
        } catch (Exception e) {
            log.error("AI ask failed: {}", e.getMessage());
            return new AiChatResponse("Desole, une erreur s'est produite. Reessayez dans un instant.", false);
        }
    }

    public AiInsightsResponse getInsights(String userEmail, Role userRole) {
        if (!llmClient.isConfigured()) {
            return new AiInsightsResponse(fallbackInsights(), false);
        }
        try {
            String context = contextBuilder.build(userEmail, userRole);
            String prompt = """
                    CONTEXTE PORTEFEUILLE:

                    %s

                    Genere exactement 4 insights dynamiques pour le dashboard.

                    Regles strictes:
                    - Une seule ligne par insight, sans numerotation ni tiret initial.
                    - Chaque ligne doit suivre ce format: PRIORITE - constat chiffre -> action concrete.
                    - PRIORITE doit etre CRITIQUE, ATTENTION, OPPORTUNITE ou OK.
                    - Cite au moins un projet, une tache, un pourcentage, un montant ou un compteur par ligne.
                    - Evite les phrases generiques comme "surveiller les projets" sans signal precis.
                    - Ne repete pas deux fois le meme angle d'analyse.
                    """.formatted(context);

            String raw = llmClient.complete(SYSTEM_BASE, prompt, 700);
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

    public AiChatResponse decomposeTasks(String goal, Long projectId, String userEmail, Role userRole) {
        if (!llmClient.isConfigured()) {
            return new AiChatResponse(fallbackUnavailable(), false);
        }
        try {
            String context = projectId != null
                    ? contextBuilder.buildProject(projectId, userEmail, userRole)
                    : contextBuilder.build(userEmail, userRole);

            String prompt = """
                    CONTEXTE:
                    %s

                    OBJECTIF A DECOMPOSER:
                    "%s"

                    Genere une liste de 4 a 8 titres de taches actionnables.
                    Les taches doivent tenir compte du contexte reel: statut du projet, taches bloquees, echeances, priorites et charge si disponibles.
                    Chaque ligne doit contenir uniquement le titre de la tache, max 80 caracteres, sans numerotation ni tiret initial.
                    """.formatted(context, goal);

            String raw = llmClient.complete(SYSTEM_BASE, prompt, 650);
            return new AiChatResponse(raw.trim(), true);
        } catch (Exception e) {
            log.error("AI decompose failed: {}", e.getMessage());
            return new AiChatResponse("Impossible de decomposer l'objectif pour le moment. Reessayez.", false);
        }
    }

    public AiChatResponse analyzeRisk(Long projectId, String userEmail, Role userRole) {
        if (!llmClient.isConfigured()) {
            return new AiChatResponse(fallbackUnavailable(), false);
        }
        try {
            String context = contextBuilder.buildProject(projectId, userEmail, userRole);
            String prompt = """
                    CONTEXTE PROJET:
                    %s

                    Produis une analyse de risque specifique au PROJET CIBLE.

                    Format attendu:
                    Niveau global: Faible/Moyen/Eleve/Critique - justification en une phrase avec chiffres.
                    Facteurs:
                    1. Cause precise -> impact probable -> action recommandee.
                    2. Cause precise -> impact probable -> action recommandee.
                    3. Cause precise -> impact probable -> action recommandee.
                    Decision manager: une action prioritaire pour les prochaines 24-48h.

                    Contraintes:
                    - Cite explicitement les signaux fournis: score risque, retard, taches bloquees, budget, health score ou echeances.
                    - Si aucun risque fort n'apparait, explique pourquoi et propose une optimisation concrete.
                    - N'ajoute pas d'informations absentes du contexte.
                    """.formatted(context);

            String raw = llmClient.complete(SYSTEM_BASE, prompt, 1100);
            return new AiChatResponse(raw.trim(), true);
        } catch (Exception e) {
            log.error("AI risk analysis failed: {}", e.getMessage());
            return new AiChatResponse("Analyse de risque indisponible pour le moment.", false);
        }
    }

    public ProjectSimulationResponse simulateProject(ProjectSimulationRequest request) {
        if (!llmClient.isConfigured()) {
            throw new IllegalStateException("GROQ_API_KEY is not configured.");
        }

        String budgetStr = request.getBudget() != null ? request.getBudget().toPlainString() + " MAD" : "non specifie";
        String durationStr = request.getDuration() != null ? request.getDuration() : "non specifie";
        String teamStr = request.getTeamSize() != null ? request.getTeamSize() + " personnes" : "non specifie";

        String system = """
                Tu es un expert senior en gestion de projet.
                Tu dois simuler un plan realiste, adapte au domaine decrit par l'utilisateur et aux contraintes donnees.
                Reponds UNIQUEMENT avec un objet JSON valide, sans markdown, sans explication, sans commentaires.
                """;

        String prompt = """
                Simule un plan de projet complet pour la description suivante:
                "%s"

                Contraintes: budget=%s | duree=%s | equipe=%s

                Consignes de realisme:
                - Adapte les phases, roles, risques et budget au domaine du projet.
                - Si une contrainte est faible ou incoherente, baisse la confidence et ajoute un risque explicite.
                - Les risques doivent etre specifiques, pas generiques.

                Retourne EXACTEMENT ce JSON:
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

            List<ProjectSimulationResponse.SimPhase> phases = new ArrayList<>();
            for (JsonNode p : iterArray(root.path("phases"))) {
                List<ProjectSimulationResponse.SimTask> tasks = new ArrayList<>();
                for (JsonNode t : iterArray(p.path("tasks"))) {
                    tasks.add(ProjectSimulationResponse.SimTask.builder()
                            .title(t.path("title").asText("Tache"))
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

            List<ProjectSimulationResponse.SimBudgetItem> budgetItems = new ArrayList<>();
            for (JsonNode b : iterArray(root.path("budgetBreakdown"))) {
                budgetItems.add(ProjectSimulationResponse.SimBudgetItem.builder()
                        .category(b.path("category").asText("Poste"))
                        .amount(safeDecimal(b.path("amount")))
                        .percentage(b.path("percentage").asInt(0))
                        .build());
            }

            List<ProjectSimulationResponse.SimTeamRole> teamRoles = new ArrayList<>();
            for (JsonNode r : iterArray(root.path("teamRoles"))) {
                teamRoles.add(ProjectSimulationResponse.SimTeamRole.builder()
                        .role(r.path("role").asText("Membre"))
                        .count(r.path("count").asInt(1))
                        .allocationPercentage(r.path("allocationPercentage").asInt(100))
                        .build());
            }

            List<ProjectSimulationResponse.SimRisk> risks = new ArrayList<>();
            for (JsonNode r : iterArray(root.path("risks"))) {
                risks.add(ProjectSimulationResponse.SimRisk.builder()
                        .level(r.path("level").asText("MEDIUM"))
                        .title(r.path("title").asText("Risque"))
                        .description(r.path("description").asText(""))
                        .build());
            }

            List<String> insights = new ArrayList<>();
            for (JsonNode i : iterArray(root.path("keyInsights"))) {
                insights.add(i.asText(""));
            }

            BigDecimal totalBudget = root.path("totalBudget").isMissingNode() || root.path("totalBudget").isNull()
                    ? (request.getBudget() != null ? request.getBudget() : BigDecimal.ZERO)
                    : safeDecimal(root.path("totalBudget"));

            return ProjectSimulationResponse.builder()
                    .projectName(root.path("projectName").asText("Projet simule"))
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
            throw new IllegalStateException("La simulation a echoue: " + e.getMessage(), e);
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
        try {
            return new BigDecimal(node.asText("0"));
        } catch (NumberFormatException e) {
            return BigDecimal.ZERO;
        }
    }

    private String fallbackUnavailable() {
        return "L'assistant IA n'est pas disponible. Configurez la variable d'environnement GROQ_API_KEY et redemarrez le backend.";
    }

    private List<String> fallbackInsights() {
        return List.of(
                "Configurez GROQ_API_KEY pour activer les insights IA en temps reel.",
                "Une fois configure, NEXUS-IA analysera automatiquement vos projets, taches, budgets et echeances.",
                "Les analyses de risque exploiteront les retards, blocages, taches critiques et scores de sante.",
                "La decomposition de taches tiendra compte du projet cible et de ses contraintes."
        );
    }
}
