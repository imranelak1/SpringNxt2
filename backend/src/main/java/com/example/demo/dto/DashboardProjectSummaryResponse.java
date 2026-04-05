package com.example.demo.dto;

import com.example.demo.model.ProjectStatus;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardProjectSummaryResponse {

    private Long projectId;
    private String projectName;
    private ProjectStatus status;
    private Integer progressPercentage;
    private int taskCount;
    private int completedTaskCount;
    private int memberCount;
    private Integer overallHealthScore;
}
