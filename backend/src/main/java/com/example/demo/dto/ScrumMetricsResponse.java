package com.example.demo.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScrumMetricsResponse {
    private Integer backlogItems;
    private Integer backlogPoints;
    private Integer activeCommittedPoints;
    private Integer activeCompletedPoints;
    private Integer activeRemainingPoints;
    private Integer activeBlockedItems;
    private Integer activeCapacityPoints;
    private Integer averageVelocity;
}
