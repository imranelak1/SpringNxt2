package com.example.demo.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReportsResponse {
    private int totalProjects;
    private int completedProjects;
    private int activeProjects;
    private int deliveryRate;
    private int avgHealthScore;
    private int totalTasks;
    private int completedTasks;
    private List<MonthlyCountResponse> monthlyProjectCounts;
    private List<StatusCountResponse> projectsByStatus;
}
