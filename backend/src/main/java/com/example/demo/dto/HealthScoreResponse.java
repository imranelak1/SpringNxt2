package com.example.demo.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HealthScoreResponse {

    private Long projectId;
    private String projectName;
    private Integer overallScore;
    private Integer delayScore;
    private Integer progressScore;
    private Integer workloadScore;
    private Integer budgetScore;
    private LocalDateTime calculatedAt;
}
