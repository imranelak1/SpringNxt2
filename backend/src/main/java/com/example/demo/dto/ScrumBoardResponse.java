package com.example.demo.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScrumBoardResponse {
    private Long projectId;
    private String projectName;
    private SprintResponse activeSprint;
    private List<SprintResponse> plannedSprints;
    private List<SprintResponse> closedSprints;
    private List<TaskResponse> backlog;
    private List<TaskResponse> activeSprintTasks;
    private List<BurndownPointResponse> burndown;
    private List<VelocityPointResponse> velocity;
    private ScrumMetricsResponse metrics;
}
