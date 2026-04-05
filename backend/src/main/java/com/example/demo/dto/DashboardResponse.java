package com.example.demo.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardResponse {

    private int totalProjects;
    private int activeProjects;
    private int totalTasks;
    private int completedTasks;
    private int totalUsers;
    private List<DashboardProjectSummaryResponse> projects;
}
