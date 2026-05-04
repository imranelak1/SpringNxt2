package com.example.demo.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectSimulationResponse {

    private String projectName;
    private String description;
    private int estimatedWeeks;
    private BigDecimal totalBudget;
    private String confidence;
    private List<SimPhase> phases;
    private List<SimBudgetItem> budgetBreakdown;
    private List<SimTeamRole> teamRoles;
    private List<SimRisk> risks;
    private List<String> keyInsights;

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class SimPhase {
        private String name;
        private int weeks;
        private List<SimTask> tasks;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class SimTask {
        private String title;
        private String priority;
        private int estimatedHours;
        private String role;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class SimBudgetItem {
        private String category;
        private BigDecimal amount;
        private int percentage;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class SimTeamRole {
        private String role;
        private int count;
        private int allocationPercentage;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class SimRisk {
        private String level;
        private String title;
        private String description;
    }
}
