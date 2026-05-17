package com.example.demo.dto;

import com.example.demo.model.SprintStatus;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SprintResponse {
    private Long id;
    private Long projectId;
    private String projectName;
    private String name;
    private String goal;
    private LocalDate startDate;
    private LocalDate endDate;
    private SprintStatus status;
    private Integer capacityPoints;
    private Integer committedPoints;
    private Integer completedPoints;
    private Integer remainingPoints;
    private Integer taskCount;
    private Integer doneTaskCount;
    private LocalDateTime createdAt;
    private LocalDateTime closedAt;
}
